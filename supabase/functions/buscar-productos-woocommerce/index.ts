import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export default {
  fetch: withSupabase({ auth: "publishable" }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      const body = await req.json().catch(() => ({}));
      const { query, category, limit = 10 } = body;

      let dbQuery = ctx.supabaseAdmin
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (category) {
        dbQuery = dbQuery.eq("category", category);
      }

      if (query?.trim()) {
        dbQuery = dbQuery.ilike("name", `%${query.trim()}%`);
      }

      const { data: products, error } = await dbQuery;

      if (error) throw error;

      return new Response(
        JSON.stringify({ products, count: products?.length ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message || "Unknown error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }),
};
