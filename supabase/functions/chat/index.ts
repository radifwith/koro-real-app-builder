import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLOUDFLARE_WORKER_URL = "https://newairaxzen.radidmondal.workers.dev/chat";

const modeSystemPrompts: Record<string, string> = {
  chat: "You are Raxzen AI, a friendly and helpful assistant. Keep answers clear, concise and helpful. Use markdown formatting when appropriate.",
  search: "You are Raxzen AI in Search mode. Provide well-structured search results with bullet points, links context, and key facts. Format results clearly with headers.",
  deep: "You are Raxzen AI in Deep Research mode. Provide comprehensive, detailed analysis with multiple perspectives, citations, and thorough explanations. Use markdown headers, bullet points, and structured formatting.",
  image: "You are Raxzen AI in Image mode. Describe what the requested image would look like in vivid detail. Since you cannot generate images directly, provide a detailed creative description.",
  study: "You are Raxzen AI in Study mode. Break down topics into structured learning sections with headers, key concepts, examples, and summaries. Make complex topics easy to understand.",
  quiz: "You are Raxzen AI in Quiz mode. Generate quiz questions based on the topic. Format each question with: the question, 4 options (A-D), and the correct answer with explanation. Use markdown formatting.",
  code: "You are Raxzen AI in Code mode. Provide clean, well-commented code solutions. Explain the logic, suggest best practices, and include examples. Use code blocks with language tags.",
  file: "You are Raxzen AI in File Analysis mode. Analyze the provided file content and give detailed insights, summaries, and key findings.",
};

async function tryCloudflareWorker(message: string, mode: string): Promise<string | null> {
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
    // Try common response fields
    return data.response || data.reply || data.text || data.content || data.answer || data.result || (typeof data === "string" ? data : null);
  } catch (e) {
    console.error("Cloudflare Worker failed:", e);
    return null;
  }
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

// Convert a plain text response into SSE stream format so frontend can handle uniformly
function textToSSEStream(text: string): Response {
  // Simulate SSE streaming by sending text in chunks
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
      }, 20); // ~20ms per word for smooth streaming feel
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
    const cfResponse = await tryCloudflareWorker(lastUserMsg, mode || "chat");
    
    if (cfResponse) {
      // Got response from Cloudflare Worker — stream it as SSE
      return textToSSEStream(cfResponse);
    }

    // Fallback: Use Lovable AI
    console.log("Cloudflare Worker failed, falling back to Lovable AI");
    return await streamFromLovableAI(messages, mode || "chat");
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
