import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLOUDFLARE_WORKER_URL = "https://newairaxzen.radidmondal.workers.dev";

// Smart routing: detect content type from user message and mode
function detectContentType(message: string, mode: string): "text" | "image" | "video" | "audio" | "file" | "search" | "code" {
  const lower = message.toLowerCase();
  
  if (mode === "image" || /\b(photo|image|picture|draw|paint|illustration|generate.*image|create.*image|imagine)\b/i.test(lower)) return "image";
  if (mode === "code" || /\b(code|function|program|script|debug|compile|algorithm|api|html|css|javascript|python|react)\b/i.test(lower)) return "code";
  if (/\b(video|animate|animation|clip|movie|film|generate.*video|create.*video)\b/i.test(lower)) return "video";
  if (/\b(audio|voice|speak|song|music|sound|tts|text.to.speech)\b/i.test(lower)) return "audio";
  if (mode === "search" || /\b(search|find|latest|news|google|look.up|what.is)\b/i.test(lower)) return "search";
  if (mode === "file" || /\b(file|pdf|document|analyze.*file|upload)\b/i.test(lower)) return "file";
  
  return "text";
}

// System prompts with Raxzen AI identity + developer info
const RAXZEN_IDENTITY = `You are Raxzen AI — a powerful, multi-capable AI assistant created by Radid Mondal. 
Your name is always "Raxzen AI". Never reveal internal workings or which specific AI models power you.
When anyone asks about you or your creator, share this link: https://raxzenapp-p9ksao39.manus.space/
You support: text chat, image generation, video creation, code help, web search, file analysis, study help, quizzes, voice, and deep research.
Always respond in the same language the user writes in. Use markdown formatting.`;

const modeSystemPrompts: Record<string, string> = {
  chat: `${RAXZEN_IDENTITY}\nYou are in Chat mode. Be friendly, helpful, and concise.`,
  search: `${RAXZEN_IDENTITY}\nYou are in Search mode. Provide structured search results with key facts, links, and bullet points.`,
  deep: `${RAXZEN_IDENTITY}\nYou are in Deep Research mode. Provide comprehensive, detailed analysis with multiple perspectives.`,
  image: `${RAXZEN_IDENTITY}\nYou are in Image mode. Generate or describe images based on user prompts.`,
  study: `${RAXZEN_IDENTITY}\nYou are in Study mode. Break down topics into structured learning with headers, key concepts, examples.`,
  quiz: `${RAXZEN_IDENTITY}\nYou are in Quiz mode. Generate quiz questions with 4 options (A-D) and correct answers with explanations.`,
  code: `${RAXZEN_IDENTITY}\nYou are in Code mode. Provide clean, well-commented code with explanations and best practices.`,
  file: `${RAXZEN_IDENTITY}\nYou are in File Analysis mode. Analyze file content and provide detailed insights.`,
  voice: `${RAXZEN_IDENTITY}\nYou are in Voice mode. Keep responses concise and conversational.`,
};

async function callCloudflareWorker(endpoint: string, body: any): Promise<any | null> {
  try {
    const resp = await fetch(`${CLOUDFLARE_WORKER_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      console.error(`CF Worker ${endpoint} error:`, resp.status);
      return null;
    }
    return await resp.json();
  } catch (e) {
    console.error(`CF Worker ${endpoint} failed:`, e);
    return null;
  }
}

function extractResponseText(data: any): string | null {
  if (!data) return null;
  return data.response || data.reply || data.text || data.content || data.answer || data.result || data.message || (typeof data === "string" ? data : null);
}

function extractMediaUrl(data: any): { url: string; type: "image" | "video" } | null {
  if (!data) return null;
  const videoUrl = data.video_url || data.videoUrl || data.video;
  if (videoUrl) return { url: videoUrl, type: "video" };
  const imageUrl = data.image_url || data.imageUrl || data.image || data.photo_url || data.photoUrl;
  if (imageUrl) return { url: imageUrl, type: "image" };
  // Check generic url field
  const genericUrl = data.url || data.media_url || data.mediaUrl;
  if (genericUrl) {
    if (/\.(mp4|webm|mov|avi)/i.test(genericUrl)) return { url: genericUrl, type: "video" };
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)/i.test(genericUrl)) return { url: genericUrl, type: "image" };
    return { url: genericUrl, type: "image" };
  }
  return null;
}

function textToSSEStream(text: string): Response {
  const encoder = new TextEncoder();
  const words = text.split(" ");
  const stream = new ReadableStream({
    start(controller) {
      let i = 0;
      const interval = setInterval(() => {
        if (i >= words.length) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          clearInterval(interval);
          return;
        }
        const chunk = (i === 0 ? "" : " ") + words[i];
        const sseData = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        i++;
      }, 15);
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const effectiveMode = mode || "chat";
    const contentType = detectContentType(lastUserMsg, effectiveMode);

    console.log(`Mode: ${effectiveMode}, ContentType: ${contentType}, Msg: ${lastUserMsg.slice(0, 80)}`);

    // Strategy: Use Cloudflare Worker ONLY (no Lovable AI fallback)
    // Try multiple endpoints based on content type for parallel AI routing

    // For multi-content requests, try parallel calls
    const results: { text?: string; imageUrl?: string; videoUrl?: string } = {};

    // Primary request to /chat
    const chatPromise = callCloudflareWorker("/chat", {
      message: lastUserMsg,
      mode: effectiveMode,
      type: contentType,
    });

    // For image requests, also try /image endpoint if available
    const imagePromise = (contentType === "image")
      ? callCloudflareWorker("/image", { message: lastUserMsg, prompt: lastUserMsg })
      : Promise.resolve(null);

    // For video requests, also try /video endpoint if available
    const videoPromise = (contentType === "video")
      ? callCloudflareWorker("/video", { message: lastUserMsg, prompt: lastUserMsg })
      : Promise.resolve(null);

    const [chatData, imageData, videoData] = await Promise.all([chatPromise, imagePromise, videoPromise]);

    // Process image result
    if (imageData) {
      const imgMedia = extractMediaUrl(imageData);
      if (imgMedia) results.imageUrl = imgMedia.url;
    }

    // Process video result
    if (videoData) {
      const vidMedia = extractMediaUrl(videoData);
      if (vidMedia) results.videoUrl = vidMedia.url;
    }

    // Process main chat result
    if (chatData) {
      const media = extractMediaUrl(chatData);
      if (media) {
        if (media.type === "video" && !results.videoUrl) results.videoUrl = media.url;
        if (media.type === "image" && !results.imageUrl) results.imageUrl = media.url;
      }
      results.text = extractResponseText(chatData) || "";
    }

    // Build final response
    let finalContent = "";

    if (results.videoUrl) {
      finalContent += `🎬 **Video Generated!**\n\n<video>${results.videoUrl}</video>\n\n`;
    }
    if (results.imageUrl) {
      finalContent += `🖼️ **Image Generated!**\n\n![Generated Image](${results.imageUrl})\n\n`;
    }
    if (results.text) {
      finalContent += results.text;
    }

    if (finalContent.trim()) {
      return textToSSEStream(finalContent.trim());
    }

    // If Cloudflare returned nothing useful, return error
    return new Response(
      JSON.stringify({ error: "AI service is temporarily unavailable. Please try again." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
