# AI-DA — Claude Code context

## WHY
Asistente de diseño de interiores (cocinas/baños) para **All In Remodeling** + **SmartSlab**, desplegado en `allinremodeling.us/ai/` con backend Supabase Edge Function `chat`.

## WHAT (stack)
- **Frontend:** React 19 + Vite + Tailwind → cPanel `/ai/` (`npm run deploy:cpanel`)
- **Backend:** `supabase/functions/chat` — Vision, Tavily, SmartSlab, orquestador LLM (`npm run deploy:chat`)
- **Versión actual:** V1.5.1 — express 3 turnos, 5 cards, inspiración web única

## HOW (convenciones)
- No commitear `.env.local`, secrets ni `deploy-cpanel-ai.zip`
- Cambios UI → `npm run deploy:cpanel`; cambios Edge Function → `npm run deploy:chat`
- Orquestador: `supabase/functions/_shared/orchestrator.ts` + `llm.ts` (Anthropic → OpenAI)
- Inspiración Card 2: `trends.ts` + `keywords.ts` — imagen externa, distinta a recomendación All In
- UI chat: `src/components/ChatInterface.tsx`, `DesignBlocks.tsx`
- Docs deploy: `DEPLOY-CPANEL.md`, release notes `docs/V1-5-1.md`

## Comandos frecuentes
```powershell
cd f:\Proyectos\AI-DA-ASSISTANT
npm run dev
npm run deploy:cpanel
npm run deploy:chat
npx claude          # sesión Claude Code en este repo
```

## Supabase
- Project ref: `nchzvkvinhpnowopqbfb`
- MCP: `.mcp.json` (Supabase HTTP MCP)
- Secrets: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`

## Respuesta al usuario
Tono de **asesor virtual** fluido (español por defecto). Express: 3 consultas con `history[]` antes de pedir cuenta.
