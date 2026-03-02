import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLOUDFLARE_WORKER_URL = "https://newairaxzen.radidmondal.workers.dev/chat";

const modeSystemPrompts: Record<string, string> = {
  chat: "You are Raxzen AI, a friendly and helpful assistant. Keep answers clear, concise and helpful. Use markdown formatting when appropriate. Always respond in the same language as the user's message.",
  search: "You are Raxzen AI in Search mode. Provide well-structured search results with bullet points, links context, and key facts. Format results clearly with headers. Always respond in the same language as the user's message.",
  deep: "You are Raxzen AI in Deep Research mode. Provide comprehensive, detailed analysis with multiple perspectives, citations, and thorough explanations. Use markdown headers, bullet points, and structured formatting. Always respond in the same language as the user's message.",
  image: "You are Raxzen AI in Image mode. When asked to create/generate an image, use your image generation capabilities to create the image and return the image URL. If you cannot generate images, describe what the image would look like in vivid detail. Always respond in the same language as the user's message.",
  study: "You are Raxzen AI in Study mode. Break down topics into structured learning sections with headers, key concepts, examples, and summaries. Make complex topics easy to understand. Always respond in the same language as the user's message.",
  quiz: "You are Raxzen AI in Quiz mode. Generate quiz questions based on the topic. Format each question with: the question, 4 options (A-D), and the correct answer with explanation. Use markdown formatting. Always respond in the same language as the user's message.",
  code: "You are Raxzen AI in Code mode. Provide clean, well-commented code solutions. Explain the logic, suggest best practices, and include examples. Use code blocks with language tags. Always respond in the same language as the user's message.",
  file: "You are Raxzen AI in File Analysis mode. Analyze the provided file content and give detailed insights, summaries, and key findings. Always respond in the same language as the user's message.",
};

async function tryCloudflareWorker(message: string, mode: string): Promise<any | null> {
  try {
    const resp = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode }),
    });
    if (!resp.ok) {
      console.error("Cloudflare Worker error:", resp.status);
      return null;
    }
    const data = await resp.json();
    return data;
  } catch (e) {
    console.error("Cloudflare Worker failed:", e);
    return null;
  }
}

function extractResponseText(data: any): string | null {
  if (!data) return null;
  return data.response || data.reply || data.text || data.content || data.answer || data.result || (typeof data === "string" ? data : null);
}

function extractMediaUrl(data: any): string | null {
  if (!data) return null;
  return data.image_url || data.imageUrl || data.image || data.video_url || data.videoUrl || data.video || data.media_url || data.mediaUrl || data.url || null;
}

async function streamFromLovableAI(messages: any[], mode: string): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const systemPrompt = modeSystemPrompts[mode] || modeSystemPrompts.chat;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const t = await response.text();
    console.error("Lovable AI error:", response.status, t);
    throw new Error("Lovable AI error");
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
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
        const sseData = JSON.stringify({
          choices: [{ delta: { content: chunk } }],
        });
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        i++;
      }, 20);
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

    // Strategy: Try Cloudflare Worker first (your free API keys), fallback to Lovable AI
    const cfData = await tryCloudflareWorker(lastUserMsg, mode || "chat");
    
    if (cfData) {
      // Check for media URLs (image/video responses)
      const mediaUrl = extractMediaUrl(cfData);
      const responseText = extractResponseText(cfData);
      
      if (mediaUrl) {
        // Return media URL embedded in markdown so frontend can render it
        const isVideo = mediaUrl.match(/\.(mp4|webm|mov|avi)$/i) || cfData.type === "video" || mode === "video";
        let mediaContent = "";
        if (isVideo) {
          mediaContent = `🎬 **Video Generated!**\n\n<video>${mediaUrl}</video>\n\n${responseText || ""}`;
        } else {
          mediaContent = `🖼️ **Image Generated!**\n\n![Generated Image](${mediaUrl})\n\n${responseText || ""}`;
        }
        return textToSSEStream(mediaContent.trim());
      }
      
      if (responseText) {
        return textToSSEStream(responseText);
      }
    }

    // Fallback: Use Lovable AI
    console.log("Cloudflare Worker failed or empty, falling back to Lovable AI");
    return await streamFromLovableAI(messages, mode || "chat");
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
