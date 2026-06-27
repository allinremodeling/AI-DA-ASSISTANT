import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";
import { searchAnalysisContext, searchInspirationReferences, matchPortfolio, ALLIN_PORTFOLIO } from "../_shared/trends.ts";
import { extractDesignKeywords } from "../_shared/keywords.ts";
import { analyzeImageWithOpenAI } from "../_shared/vision.ts";
import { matchEcosystemServices } from "../_shared/ecosystem.ts";
import { searchSmartSlabListings } from "../_shared/smartslab.ts";
import { parseProjectDimensions, formatDimensionsForContext } from "../_shared/dimensions.ts";
import { orchestrateChatResponse } from "../_shared/orchestrator.ts";
import { buildFullConversationContext, type ChatHistoryTurn } from "../_shared/history.ts";

const GUEST_TURN_LIMIT = 3;

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
  history?: ChatHistoryTurn[];
  guestTurn?: number;
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

      const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
      const guestTurn = guest ? Math.min(body.guestTurn ?? 1, GUEST_TURN_LIMIT) : undefined;
      const fullContext = buildFullConversationContext(message, history);

      const dimensions = parseProjectDimensions(fullContext);
      const dimensionsText = formatDimensionsForContext(dimensions);

      let visionAnalysis = "";
      if (body.imageBase64) {
        visionAnalysis = await analyzeImageWithOpenAI(body.imageBase64, fullContext.slice(0, 800), lang);
      }

      const contextQuery = `${fullContext} ${visionAnalysis}`.slice(0, 800);

      const productQuery =
        message.match(/cuarzo|quartz|gabinete|cabinet|shaker|encimera|counter|calacatta|granite|granito|vanity|isla|island/i)?.[0]
        || message.slice(0, 40);

      const designKeywords = extractDesignKeywords(message, visionAnalysis, fullContext);

      const [analysisWeb, smartslabListings, products, portfolio] = await Promise.all([
        searchAnalysisContext(contextQuery, searchDate, lang),
        searchSmartSlabListings(contextQuery, 1, dimensions.requiredSqft),
        searchProducts(ctx.supabaseAdmin, productQuery),
        Promise.resolve(matchPortfolio(contextQuery, 1)),
      ]);

      const portfolioItem = portfolio[0] || ALLIN_PORTFOLIO[0];
      const inspirationExcludeUrls = [
        String((products[0] as Record<string, unknown> | undefined)?.image_url || ''),
        portfolioItem.imageUrl,
      ].filter(Boolean);

      const inspirationWeb = await searchInspirationReferences(contextQuery, lang, {
        keywords: designKeywords,
        excludeUrls: inspirationExcludeUrls,
        lang,
      });

      const services = matchEcosystemServices(`${message} ${visionAnalysis}`, 4);

      const { intro, blocks, followUp } = await orchestrateChatResponse({
        message,
        guest,
        guestTurn,
        guestTurnLimit: GUEST_TURN_LIMIT,
        history,
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
