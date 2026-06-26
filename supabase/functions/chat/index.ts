import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { searchAnalysisContext, searchInspirationReferences, matchPortfolio, ALLIN_PORTFOLIO } from "../_shared/trends.ts";
import { analyzeImageWithOpenAI } from "../_shared/vision.ts";
import { matchEcosystemServices } from "../_shared/ecosystem.ts";
import { searchSmartSlabListings } from "../_shared/smartslab.ts";
import { parseProjectDimensions, formatDimensionsForContext } from "../_shared/dimensions.ts";
import { orchestrateChatResponse } from "../_shared/orchestrator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  imageBase64?: string;
  guest?: boolean;
  lang?: string;
}

async function searchProducts(
  admin: Parameters<Parameters<typeof withSupabase>[1]>[1]["supabaseAdmin"],
  query: string,
) {
  const { data } = await admin.from("products").select("*").ilike("name", `%${query}%`).limit(4);
  return (data || []) as Record<string, unknown>[];
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
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
      const body = (await req.json()) as ChatRequest;
      const message = body.message?.trim() || "Design consultation";
      const hasImage = Boolean(body.imageBase64);
      const guest = Boolean(body.guest);
      const lang = (body.lang || 'es').slice(0, 2).toLowerCase();
      const searchDate = new Date().toISOString().slice(0, 10);

      const dimensions = parseProjectDimensions(message);
      const dimensionsText = formatDimensionsForContext(dimensions);

      let visionAnalysis = "";
      if (body.imageBase64) {
        visionAnalysis = await analyzeImageWithOpenAI(body.imageBase64, message, lang);
      }

      const contextQuery = `${message} ${visionAnalysis}`.slice(0, 500);

      const productQuery =
        message.match(/cuarzo|quartz|gabinete|cabinet|shaker|encimera|counter|calacatta|granite|granito|vanity|isla|island/i)?.[0]
        || message.slice(0, 40);

      const [analysisWeb, inspirationWeb, smartslabListings, products, portfolio] = await Promise.all([
        searchAnalysisContext(contextQuery, searchDate, lang),
        searchInspirationReferences(contextQuery, lang),
        searchSmartSlabListings(contextQuery, 4, dimensions.requiredSqft),
        searchProducts(ctx.supabaseAdmin, productQuery),
        Promise.resolve(matchPortfolio(contextQuery, 1)),
      ]);

      const services = matchEcosystemServices(`${message} ${visionAnalysis}`, 4);
      const portfolioItem = portfolio[0] || ALLIN_PORTFOLIO[0];

      const { intro, blocks, followUp } = await orchestrateChatResponse({
        message,
        guest,
        hasImage,
        lang,
        visionAnalysis,
        searchDate,
        dimensions,
        dimensionsText,
        analysisWeb,
        inspirationWeb,
        products,
        services,
        smartslabListings,
        portfolioItem,
      });

      return new Response(
        JSON.stringify({
          intro,
          blocks,
          products,
          smartslabListings,
          followUp: guest
            ? followUp || (lang === 'es'
              ? "Modo invitado: crea tu cuenta AI-DA para continuar con un asesor All In."
              : "Guest mode: create an AI-DA account to continue with an All In advisor.")
            : followUp,
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
  }),
};
