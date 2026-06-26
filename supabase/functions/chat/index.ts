import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { searchDesignTrends, matchPortfolio, ALLIN_PORTFOLIO } from "../_shared/trends.ts";
import { analyzeImageWithClaude } from "../_shared/vision.ts";
import { matchEcosystemServices, buildActionPlanSteps } from "../_shared/ecosystem.ts";
import { searchSmartSlabListings, type SmartSlabRow } from "../_shared/smartslab.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  imageBase64?: string;
  guest?: boolean;
}

interface DesignBlock {
  type: string;
  title: string;
  text: string;
  imageUrl?: string;
  source?: string;
  tags?: string[];
  steps?: { step: number; title: string; description: string }[];
  ctaLabel?: string;
  ctaType?: string;
}

async function searchProducts(admin: Parameters<Parameters<typeof withSupabase>[1]>[1]["supabaseAdmin"], query: string) {
  const { data } = await admin.from("products").select("*").ilike("name", `%${query}%`).limit(4);
  return (data || []) as Record<string, unknown>[];
}

async function polishIntroAndTexts(message: string, visionAnalysis: string, blocks: DesignBlock[]) {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey || openaiKey.includes("your-key")) {
    return {
      intro: "Tu consulta AI-DA está lista. Revisa cada sección y al final el plan para hablar con un asesor All In.",
      followUp: "¿Listo para agendar consulta virtual o recibir cotización?",
    };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_CHAT_MODEL") || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: 'Responde JSON {"intro":"...","followUp":"..."} en español para AI-DA / All In Remodeling.',
          },
          {
            role: "user",
            content: `Consulta: ${message}\nVision: ${visionAnalysis || "N/A"}\nBloques: ${blocks.map((b) => b.title).join(", ")}`,
          },
        ],
        max_tokens: 300,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return JSON.parse(data.choices?.[0]?.message?.content);
    }
  } catch { /* fallback */ }

  return {
    intro: "Análisis completo del ecosistema All In — listo para conectar con un asesor.",
    followUp: "¿Quieres que un asesor te contacte para cotización detallada?",
  };
}

function buildFourPillarBlocks(
  message: string,
  hasImage: boolean,
  guest: boolean,
  visionAnalysis: string,
  externalTrend: { title: string; text: string; imageUrl: string; source: string },
  portfolioItem: (typeof ALLIN_PORTFOLIO)[0],
  smartslab: SmartSlabRow,
  products: Record<string, unknown>[],
  services: { brand: string; name: string; url: string }[],
): DesignBlock[] {
  const productLine = products.length > 0
    ? `Productos: ${products.map((p) => `${p.name} ($${p.price})`).join(", ")}. `
    : "";
  const serviceLine = services.map((s) => `${s.name} (${s.brand})`).join(" · ");

  return [
    {
      type: "visual_analysis",
      title: hasImage ? "Análisis de tu espacio" : "Evaluación inicial",
      text: visionAnalysis || `Evaluamos: "${message.slice(0, 100)}"`,
      tags: ["Claude Vision", "AI-DA"],
    },
    {
      type: "external_inspiration",
      title: externalTrend.title,
      text: `${externalTrend.text} Referencia embebida — sin salir del chat.`,
      imageUrl: externalTrend.imageUrl,
      source: externalTrend.source,
      tags: ["tendencia"],
    },
    {
      type: "ecosystem",
      title: `${portfolioItem.title} + SmartSlab ${smartslab.name}`,
      text: `${portfolioItem.text} · ${portfolioItem.location}. Slab: ${smartslab.name} (${smartslab.material}) desde $${smartslab.price}. ${productLine}Servicios: ${serviceLine}.`,
      imageUrl: portfolioItem.imageUrl,
      source: "All In Remodeling · SmartSlab",
      tags: ["ecosistema"],
    },
    {
      type: "action_plan",
      title: "Plan con All In — hablar con un asesor",
      text: "Pasos para concretar tu remodelación con nuestro equipo.",
      steps: buildActionPlanSteps(guest),
      ctaLabel: guest ? "Crear cuenta y agendar" : "Agendar consulta gratuita",
      ctaType: guest ? "estimate" : "virtual",
      tags: ["asesor"],
    },
  ];
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
      const message = body.message?.trim() || "Consulta de diseño";
      const hasImage = Boolean(body.imageBase64);
      const guest = Boolean(body.guest);

      let visionAnalysis = "";
      if (body.imageBase64) {
        visionAnalysis = await analyzeImageWithClaude(body.imageBase64, message);
      }

      const contextQuery = `${message} ${visionAnalysis}`.slice(0, 500);
      const [trends, portfolio, smartslabListings] = await Promise.all([
        searchDesignTrends(contextQuery),
        Promise.resolve(matchPortfolio(contextQuery, 2)),
        searchSmartSlabListings(contextQuery, 3),
      ]);

      const productQuery =
        message.match(/cuarzo|quartz|gabinete|cabinet|shaker|encimera|counter|calacatta/i)?.[0]
        || message.slice(0, 40);
      const products = await searchProducts(ctx.supabaseAdmin, productQuery);

      const externalTrend = trends[0] || {
        title: "Tendencia 2026: Calacatta & Waterfall",
        text: "Islas con cascada en cuarzo Calacatta.",
        imageUrl: ALLIN_PORTFOLIO[1].imageUrl,
        source: "Design trend",
      };

      const blocks = buildFourPillarBlocks(
        message,
        hasImage,
        guest,
        visionAnalysis,
        externalTrend,
        portfolio[0] || ALLIN_PORTFOLIO[0],
        smartslabListings[0],
        products,
        matchEcosystemServices(`${message} ${visionAnalysis}`, 3),
      );

      const { intro, followUp } = await polishIntroAndTexts(message, visionAnalysis, blocks);

      return new Response(
        JSON.stringify({
          intro,
          blocks,
          products,
          smartslabListings,
          followUp: guest
            ? "Modo invitado: crea cuenta AI-DA para continuar con un asesor All In."
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
