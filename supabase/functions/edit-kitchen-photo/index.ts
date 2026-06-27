import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { buildInpaintPrompt, editKitchenPhoto } from "../_shared/editPhoto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EditRequest {
  imageBase64?: string;
  imageUrl?: string;
  prompt?: string;
  lang?: string;
}

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = (await req.json()) as EditRequest;
      let imageBase64 = body.imageBase64 || "";

      if (!imageBase64 && body.imageUrl) {
        const imgRes = await fetch(body.imageUrl);
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          imageBase64 = `data:image/jpeg;base64,${btoa(binary)}`;
        }
      }

      if (!imageBase64) {
        return new Response(JSON.stringify({ error: "imageBase64 or imageUrl required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const lang = (body.lang || "es").slice(0, 2);
      const prompt = body.prompt?.trim()
        || buildInpaintPrompt("kitchen remodel visualization", "", lang);

      const result = await editKitchenPhoto({ imageBase64, prompt });

      return new Response(
        JSON.stringify({
          editedImageUrl: result.editedImageUrl,
          prompt,
          error: result.error,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
