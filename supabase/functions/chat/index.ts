import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WORKER_URL = "https://newairaxzen.radidmondal.workers.dev";

function detectContentType(message: string, mode: string): string {
  const lower = message.toLowerCase();
  if (mode === "search" || /\b(search|find|latest|news|google|look.?up)\b/i.test(lower)) return "search";
  if (mode === "image" || /\b(photo|image|picture|draw|paint|illustration|generate.*image|create.*image|imagine)\b/i.test(lower)) return "image";
  if (/\b(video|animate|animation|clip|movie|film|generate.*video|create.*video)\b/i.test(lower)) return "video";
  if (/\b(audio|voice|speak|song|music|sound|tts|text.to.speech|বলো|বল)\b/i.test(lower)) return "tts";
  if (mode === "code" || /\b(code|function|program|script|debug|compile|algorithm|api|html|css|javascript|python|react)\b/i.test(lower)) return "code";
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
    // Convert base64 to binary
    const binaryStr = atob(base64);
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

    // ===== IMAGE UPLOAD ANALYSIS =====
    if (imageData && imageData.imageBase64) {
      console.log(`Image analysis for user: ${effectiveUserId}`);
      
      // Step 1: Send image to /image endpoint (Imagga)
      const imaggaResult = await analyzeImage(imageData.imageBase64, imageData.imageType || "image/jpeg", effectiveUserId);
      
      if (!imaggaResult || !imaggaResult.success) {
        return textToSSE("❌ Image analysis failed. Please try again.");
      }

      // Step 2: Extract tags from Imagga result
      const tags = imaggaResult.result || [];
      const tagSummary = tags
        .slice(0, 15)
        .map((t: any) => `${t.tag?.en || t.tag} (${Math.round(t.confidence)}%)`)
        .join(", ");

      // Step 3: Send tags + user question to AI (Groq) for a natural description
      const userQuestion = lastMsg || "Describe this image in detail.";
      const aiPrompt = `An image was analyzed. The detected tags are: ${tagSummary}. 

Based on these tags, provide a detailed, natural description of what's in the image. Also answer the user's question if any: "${userQuestion}"

Reply in a friendly, conversational way. If the user spoke in Bengali/Bangla, reply in Bengali.`;

      const chatData = await callWorker("/chat", {
        message: aiPrompt,
        model: "groq",
        fastMode: true,
        userId: effectiveUserId,
        history: [],
      });

      const aiDescription = extractText(chatData) || `📸 Image detected: ${tagSummary}`;
      return textToSSE(`📷 **Image Analyzed!**\n\n${aiDescription}`);
    }

    // ===== NORMAL ROUTING =====
    const contentType = detectContentType(lastMsg, effectiveMode);
    console.log(`Mode: ${effectiveMode}, Type: ${contentType}, User: ${effectiveUserId}, Msg: ${lastMsg.slice(0, 80)}`);

    const results: { text?: string; imageUrl?: string; videoUrl?: string } = {};

    if (contentType === "search") {
      const [searchData, chatData] = await Promise.all([
        callWorker("/search", { query: lastMsg, maxResults: 5, provider: "tavily" }),
        callWorker("/chat", { message: lastMsg, mode: effectiveMode, type: contentType, userId: effectiveUserId, history: messages.slice(-10) }),
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
        callWorker("/chat", { message: lastMsg, mode: effectiveMode, type: contentType, userId: effectiveUserId, history: messages.slice(-10) }),
      ]);
      const media = extractMediaUrl(imageData2);
      if (media) results.imageUrl = media.url;
      results.text = extractText(chatData) || extractText(imageData2) || "";

    } else if (contentType === "video") {
      const [videoData, chatData] = await Promise.all([
        callWorker("/video", { prompt: lastMsg, duration: 5, aspectRatio: "16:9" }),
        callWorker("/chat", { message: lastMsg, mode: effectiveMode, type: contentType, userId: effectiveUserId, history: messages.slice(-10) }),
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
        const chatData = await callWorker("/chat", { message: lastMsg, mode: effectiveMode, type: contentType, userId: effectiveUserId, history: messages.slice(-10) });
        results.text = extractText(chatData) || "";
      }

    } else if (contentType === "code") {
      // Code mode: Try Mistral → SambaNova → Groq
      let chatData = await callWorker("/chat", {
        message: lastMsg, mode: effectiveMode, type: "code",
        model: "mistral", userId: effectiveUserId, history: messages.slice(-10),
      });
      if (!chatData || !extractText(chatData)) {
        console.log("Mistral failed, trying SambaNova...");
        chatData = await callWorker("/chat", {
          message: lastMsg, mode: effectiveMode, type: "code",
          model: "sambanova", userId: effectiveUserId, history: messages.slice(-10),
        });
      }
      if (!chatData || !extractText(chatData)) {
        console.log("SambaNova failed, trying Groq...");
        chatData = await callWorker("/chat", {
          message: lastMsg, mode: effectiveMode, type: "code",
          model: "groq", fastMode: true, userId: effectiveUserId, history: messages.slice(-10),
        });
      }
      results.text = extractText(chatData) || "";

    } else {
      // Default chat: Groq
      const chatData = await callWorker("/chat", {
        message: lastMsg, mode: effectiveMode, type: contentType,
        model: "groq", fastMode: true,
        userId: effectiveUserId, history: messages.slice(-10),
      });
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