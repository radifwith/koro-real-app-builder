import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WORKER_URL = "https://newairaxzen.radidmondal.workers.dev";

function detectContentType(message: string, mode: string): string {
  const lower = message.toLowerCase();

  // Mode-first routing so "Code" section always uses coding model rules
  if (mode === "search") return "search";
  if (mode === "image") return "image";
  if (mode === "code") return "code";

  if (/\b(search|find|latest|news|google|look.?up)\b/i.test(lower)) return "search";
  if (/\b(photo|image|picture|draw|paint|illustration|generate.*image|create.*image|imagine)\b/i.test(lower)) return "image";
  if (/\b(video|animate|animation|clip|movie|film|generate.*video|create.*video)\b/i.test(lower)) return "video";
  if (/\b(audio|voice|speak|song|music|sound|tts|text.to.speech|বলো|বল)\b/i.test(lower)) return "tts";
  if (/\b(scrape|crawl|extract.*website|web.*data)\b/i.test(lower)) return "scrape";

  return "text";
}

async function callWorker(endpoint: string, body: any): Promise<any | null> {
  try {
    const resp = await fetch(`${WORKER_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      console.error(`Worker ${endpoint} error: ${resp.status}`);
      return null;
    }
    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await resp.json();
    }
    const buffer = await resp.arrayBuffer();
    return { _binary: true, data: btoa(String.fromCharCode(...new Uint8Array(buffer))), contentType };
  } catch (e) {
    console.error(`Worker ${endpoint} failed:`, e);
    return null;
  }
}

// Upload image to /image endpoint
async function analyzeImage(base64: string, imageType: string, userId: string): Promise<any | null> {
  try {
    // Convert base64/dataURL to binary
    const normalizedBase64 = (base64.includes(",") ? base64.split(",").pop() || "" : base64).replace(/\s/g, "");
    const binaryStr = atob(normalizedBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const ext = imageType.includes("png") ? "png" : "jpg";
    console.log(`Sending image to worker: ${bytes.length} bytes, type: ${imageType}, user: ${userId}`);

    // Use File + FormData (Deno supports this natively)
    const file = new File([bytes], `upload.${ext}`, { type: imageType });
    const formData = new FormData();
    formData.append("image", file);
    formData.append("user_id", userId);

    const resp = await fetch(`${WORKER_URL}/image`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type - let fetch set it with boundary
    });

    console.log(`Worker /image response status: ${resp.status}`);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error(`Image analyze error: ${resp.status} - ${errText}`);
      return null;
    }
    return await resp.json();
  } catch (e) {
    console.error("Image analyze failed:", e);
    return null;
  }
}

function extractText(data: any): string | null {
  if (!data) return null;
  return data.response || data.reply || data.text || data.content || data.answer || data.result || data.message || (typeof data === "string" ? data : null);
}

function extractMediaUrl(data: any): { url: string; type: "image" | "video" } | null {
  if (!data) return null;
  const videoUrl = data.video_url || data.videoUrl || data.video;
  if (videoUrl) return { url: videoUrl, type: "video" };
  const imageUrl = data.image_url || data.imageUrl || data.image || data.photo_url || data.photoUrl;
  if (imageUrl) return { url: imageUrl, type: "image" };
  const genericUrl = data.url || data.media_url || data.mediaUrl;
  if (genericUrl) {
    if (/\.(mp4|webm|mov|avi)/i.test(genericUrl)) return { url: genericUrl, type: "video" };
    return { url: genericUrl, type: "image" };
  }
  return null;
}

function buildChatPayload({
  message,
  mode,
  type,
  model,
  fastMode,
  userId,
  history,
}: {
  message: string;
  mode?: string;
  type?: string;
  model?: string;
  fastMode?: boolean;
  userId: string;
  history: Array<{ role: string; content: string }>;
}) {
  return {
    message,
    mode,
    type,
    model,
    fastMode,
    userId,
    user_id: userId,
    history,
  };
}

function textToSSE(text: string): Response {
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
    const { messages, mode, userId, imageData } = await req.json();
    const lastMsg = messages[messages.length - 1]?.content || "";
    const effectiveMode = mode || "chat";
    const effectiveUserId = userId || "anonymous_" + Math.random().toString(36).slice(2, 10);

    const history = Array.isArray(messages) ? messages.slice(-10) : [];

    // ===== IMAGE UPLOAD ANALYSIS =====
    if (imageData && imageData.imageBase64) {
      console.log(`Image analysis for user: ${effectiveUserId}`);

      // Request 1: image tags
      const imaggaResult = await analyzeImage(imageData.imageBase64, imageData.imageType || "image/jpeg", effectiveUserId);
      if (!imaggaResult || !imaggaResult.success) {
        return textToSSE("❌ Image analysis failed. Please try again with another image.");
      }

      const tags = imaggaResult.result || [];
      const tagSummary = tags
        .slice(0, 20)
        .map((t: any) => `${t.tag?.en || t.tag} (${Math.round(t.confidence)}%)`)
        .join(", ");

      // Request 2: natural response from chat model
      const userQuestion = lastMsg || "এই ছবিতে কী আছে?";
      const analysisModel = effectiveMode === "code" ? "mistral" : "groq";
      const aiPrompt = `Image tags: ${tagSummary || "No clear tags found"}

User question: "${userQuestion}"

Give one clean final answer only (no raw JSON, no technical dump). Explain what is visible in the image and directly answer the user question in natural Bangla if user used Bangla.`;

      const chatData = await callWorker(
        "/chat",
        buildChatPayload({
          message: aiPrompt,
          mode: effectiveMode,
          type: "image_analysis",
          model: analysisModel,
          fastMode: analysisModel === "groq",
          userId: effectiveUserId,
          history,
        }),
      );

      const aiDescription = extractText(chatData) || `এই ছবিতে সম্ভবত: ${tagSummary}`;
      return textToSSE(aiDescription);
    }

    // ===== NORMAL ROUTING =====
    const contentType = detectContentType(lastMsg, effectiveMode);
    console.log(`Mode: ${effectiveMode}, Type: ${contentType}, User: ${effectiveUserId}, Msg: ${lastMsg.slice(0, 80)}`);

    const results: { text?: string; imageUrl?: string; videoUrl?: string } = {};

    if (contentType === "search") {
      const [searchData, chatData] = await Promise.all([
        callWorker("/search", { query: lastMsg, maxResults: 5, provider: "tavily" }),
        callWorker(
          "/chat",
          buildChatPayload({
            message: lastMsg,
            mode: effectiveMode,
            type: contentType,
            model: "groq",
            fastMode: true,
            userId: effectiveUserId,
            history,
          }),
        ),
      ]);

      if (searchData) {
        const searchResults = searchData.results || searchData.data || [];
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          let searchText = "🔍 **Search Results:**\n\n";
          searchResults.forEach((r: any, i: number) => {
            searchText += `**${i + 1}. [${r.title || "Result"}](${r.url || r.link || "#"})**\n`;
            if (r.snippet || r.description || r.content) {
              searchText += `${(r.snippet || r.description || r.content).slice(0, 200)}\n\n`;
            }
          });
          results.text = searchText;
        }
      }

      const aiText = extractText(chatData);
      if (aiText) results.text = (results.text || "") + "\n\n" + aiText;

    } else if (contentType === "image") {
      const [imageData2, chatData] = await Promise.all([
        callWorker("/image-generate", { prompt: lastMsg, width: 512, height: 512, provider: "huggingface" }),
        callWorker(
          "/chat",
          buildChatPayload({
            message: lastMsg,
            mode: effectiveMode,
            type: contentType,
            model: "groq",
            fastMode: true,
            userId: effectiveUserId,
            history,
          }),
        ),
      ]);
      const media = extractMediaUrl(imageData2);
      if (media) results.imageUrl = media.url;
      results.text = extractText(chatData) || extractText(imageData2) || "";

    } else if (contentType === "video") {
      const [videoData, chatData] = await Promise.all([
        callWorker("/video", { prompt: lastMsg, duration: 5, aspectRatio: "16:9" }),
        callWorker(
          "/chat",
          buildChatPayload({
            message: lastMsg,
            mode: effectiveMode,
            type: contentType,
            model: "groq",
            fastMode: true,
            userId: effectiveUserId,
            history,
          }),
        ),
      ]);
      const media = extractMediaUrl(videoData);
      if (media) results.videoUrl = media.url;
      results.text = extractText(chatData) || extractText(videoData) || "";

    } else if (contentType === "scrape") {
      const urlMatch = lastMsg.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const scrapeData = await callWorker("/scrape", { url: urlMatch[0], format: "markdown", provider: "firecrawl" });
        results.text = extractText(scrapeData) || scrapeData?.markdown || "Could not scrape the page.";
      } else {
        const chatData = await callWorker(
          "/chat",
          buildChatPayload({
            message: lastMsg,
            mode: effectiveMode,
            type: contentType,
            model: "groq",
            fastMode: true,
            userId: effectiveUserId,
            history,
          }),
        );
        results.text = extractText(chatData) || "";
      }

    } else if (contentType === "code") {
      // Code section: Mistral only
      const chatData = await callWorker(
        "/chat",
        buildChatPayload({
          message: lastMsg,
          mode: effectiveMode,
          type: "code",
          model: "mistral",
          userId: effectiveUserId,
          history,
        }),
      );
      results.text = extractText(chatData) || "⚠️ Coding response unavailable right now. Please try again.";

    } else {
      // Study / education / general modes: Groq
      const chatData = await callWorker(
        "/chat",
        buildChatPayload({
          message: lastMsg,
          mode: effectiveMode,
          type: contentType,
          model: "groq",
          fastMode: true,
          userId: effectiveUserId,
          history,
        }),
      );
      if (chatData) {
        const media = extractMediaUrl(chatData);
        if (media) {
          if (media.type === "video") results.videoUrl = media.url;
          else results.imageUrl = media.url;
        }
        results.text = extractText(chatData) || "";
      }
    }

    // Build final response
    let finalContent = "";
    if (results.videoUrl) finalContent += `🎬 **Video Generated!**\n\n<video>${results.videoUrl}</video>\n\n`;
    if (results.imageUrl) finalContent += `🖼️ **Image Generated!**\n\n![Generated Image](${results.imageUrl})\n\n`;
    if (results.text) finalContent += results.text;

    if (finalContent.trim()) return textToSSE(finalContent.trim());

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