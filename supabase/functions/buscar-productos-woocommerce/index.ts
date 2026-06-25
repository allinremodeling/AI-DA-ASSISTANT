import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { query, category, limit = 10 } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    let searchQuery = supabaseUrl + "/rest/v1/products?select=*&order=created_at.desc&limit=" + limit;

    if (category) {
      searchQuery += "&category=eq." + encodeURIComponent(category);
    }

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      searchQuery += "&name=ilike.*" + encodeURIComponent(q) + "*";
    }

    const response = await fetch(searchQuery, {
      headers: {
        "apikey": supabaseServiceKey,
        "Authorization": "Bearer " + supabaseServiceKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Database query failed: " + response.statusText);
    }

    const products = await response.json();

    return new Response(JSON.stringify({ products, count: products.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
