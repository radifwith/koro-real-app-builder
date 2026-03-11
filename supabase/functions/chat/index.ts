import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WORKER_URL = "https://newairaxzen.radidmondal.workers.dev";

// Detect what type of request the user is making
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

// Call the Cloudflare Worker
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
    // For binary responses (audio, images), return as base64
    const buffer = await resp.arrayBuffer();
    return { _binary: true, data: btoa(String.fromCharCode(...new Uint8Array(buffer))), contentType };
  } catch (e) {
    console.error(`Worker ${endpoint} failed:`, e);
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

// Convert text to SSE stream for frontend consumption
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
    const { messages, mode } = await req.json();
    const lastMsg = messages[messages.length - 1]?.content || "";
    const effectiveMode = mode || "chat";
    const contentType = detectContentType(lastMsg, effectiveMode);

    console.log(`Mode: ${effectiveMode}, Type: ${contentType}, Msg: ${lastMsg.slice(0, 80)}`);

    // Route to the correct Cloudflare Worker endpoint
    const results: { text?: string; imageUrl?: string; videoUrl?: string } = {};

    if (contentType === "search") {
      // Use /search endpoint for search queries
      const [searchData, chatData] = await Promise.all([
        callWorker("/search", {
          query: lastMsg,
          maxResults: 5,
          provider: "tavily",
        }),
        callWorker("/chat", {
          message: lastMsg,
          mode: effectiveMode,
          type: contentType,
        }),
      ]);
      
      // Combine search results with AI summary
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
      // Add AI commentary
      const aiText = extractText(chatData);
      if (aiText) {
        results.text = (results.text || "") + "\n\n" + aiText;
      }

    } else if (contentType === "image") {
      // Use /image-generate for image creation
      const [imageData, chatData] = await Promise.all([
        callWorker("/image-generate", {
          prompt: lastMsg,
          width: 512,
          height: 512,
          provider: "huggingface",
        }),
        callWorker("/chat", {
          message: lastMsg,
          mode: effectiveMode,
          type: contentType,
        }),
      ]);
      
      const media = extractMediaUrl(imageData);
      if (media) results.imageUrl = media.url;
      results.text = extractText(chatData) || extractText(imageData) || "";

    } else if (contentType === "video") {
      // Use /video for video generation
      const [videoData, chatData] = await Promise.all([
        callWorker("/video", {
          prompt: lastMsg,
          duration: 5,
          aspectRatio: "16:9",
        }),
        callWorker("/chat", {
          message: lastMsg,
          mode: effectiveMode,
          type: contentType,
        }),
      ]);
      
      const media = extractMediaUrl(videoData);
      if (media) results.videoUrl = media.url;
      results.text = extractText(chatData) || extractText(videoData) || "";

    } else if (contentType === "scrape") {
      // Use /scrape for web scraping
      const urlMatch = lastMsg.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const scrapeData = await callWorker("/scrape", {
          url: urlMatch[0],
          format: "markdown",
          provider: "firecrawl",
        });
        results.text = extractText(scrapeData) || (scrapeData?.markdown) || "Could not scrape the page.";
      } else {
        const chatData = await callWorker("/chat", {
          message: lastMsg,
          mode: effectiveMode,
          type: contentType,
        });
        results.text = extractText(chatData) || "";
      }

    } else {
      // Default: /chat for all text, code, study, quiz, deep, file modes
      const chatData = await callWorker("/chat", {
        message: lastMsg,
        mode: effectiveMode,
        type: contentType,
        model: effectiveMode === "code" ? "groq" : "groq",
        fastMode: true,
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
      return textToSSE(finalContent.trim());
    }

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
