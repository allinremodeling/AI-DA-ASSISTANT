# All In Remodeling · AI Design Assistant

Asistente de diseño con IA para cocinas y baños de [All In Remodeling](https://allinremodeling.us) — gabinetes premium, cuarzo Calacatta y remodelaciones en Georgia.

**Live:** [ai-da-assistant.netlify.app](https://ai-da-assistant.netlify.app/)  
**Producción cPanel:** [allinremodeling.us/ai/](https://allinremodeling.us/ai/)

---

## Características

- **Análisis visual con Claude Vision** — sube una foto y recibe observaciones específicas sobre gabinetes, encimeras, iluminación y oportunidades de mejora
- **Referencias reales** — imágenes del portfolio de All In Remodeling (Calacatta Alpharetta, Golden Carrara, vanidades spa, etc.)
- **Tendencias de diseño** — búsqueda web opcional (Tavily) + curación de tendencias 2026
- **Tarjetas visuales JSON** — respuestas estructuradas con imagen, texto, fuente y tags
- **Modo invitado** — 1 consulta express sin cuenta ni historial guardado
- **Inventario** — productos desde Supabase vinculados a [allinremodeling.us](https://allinremodeling.us)
- **Auth Supabase** — login/registro para conversaciones completas

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| Auth & DB | Supabase (Auth, Postgres, Edge Functions) |
| IA | Claude Vision (Anthropic) + GPT-4o (OpenAI) |
| Deploy | Netlify (SPA + Functions), cPanel subpath `/ai/` |

---

## Variables de entorno

### Netlify (Site settings → Environment variables)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `ANTHROPIC_API_KEY` | **Sí** (visión) | Análisis de fotos con Claude Vision |
| `OPENAI_API_KEY` | **Sí** (chat) | Respuestas estructuradas JSON |
| `VITE_SUPABASE_URL` | Sí | Auth cliente |
| `VITE_SUPABASE_ANON_KEY` | Sí | Auth cliente |
| `SUPABASE_URL` | Recomendada | Inventario en función serverless |
| `SUPABASE_SECRET_KEY` | Recomendada | Buscar productos (server-side) |
| `TAVILY_API_KEY` | Opcional | Búsqueda web de tendencias |
| `CLAUDE_VISION_MODEL` | Opcional | Default: `claude-sonnet-4-20250514` |
| `OPENAI_CHAT_MODEL` | Opcional | Default: `gpt-4o` |

### Local (`.env.local`)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Las claves `OPENAI_*` y `ANTHROPIC_*` van **solo en Netlify** (serverless), no en `VITE_*`.

---

## Scripts

```bash
npm install
npm run dev              # Frontend local (mock si no hay Netlify dev)
npm run build            # Build Netlify (base /)
npm run build:cpanel     # Build cPanel (base /ai/)
npx netlify dev          # Frontend + functions locales
```

---

## Deploy

### Netlify

Conectado a `main`. Cada push redeploya automáticamente.

```bash
git push origin main
```

### cPanel (`/ai/`)

```bash
npm run build:cpanel
# Subir contenido de dist/ a public_html/ai/
```

---

## Changelog

### v1.2.0 — 2026-06-26

- Análisis de fotos con **Claude Vision** (Anthropic)
- Imágenes de referencia del **portfolio real** de allinremodeling.us (sin Unsplash genérico)
- Branding alineado: Playfair Display, acento dorado, tagline *Cabinets · Countertops · Georgia*
- GPT-4o para respuestas JSON estructuradas
- Búsqueda Tavily opcional con fallback a portfolio + tendencias curadas
- README y documentación de variables de entorno

### v1.1.0 — 2026-06-25

- Fix deploy Netlify (`base: '/'` vs `/ai/`)
- Modo **invitado** (consulta express, 1 mensaje)
- Tarjetas visuales JSON (`blocks[]` con imagen + texto)
- Netlify Function `chat` (OpenAI + Supabase)
- Script `build:cpanel` para allinremodeling.us/ai/

### v1.0.0 — 2026-06-24

- Chat con OpenAI Assistants + visión
- Auth Supabase (login/registro)
- Product cards desde inventario
- Sidebar de conversaciones (localStorage)
- Drizzle ORM + migraciones Supabase

### v0.1.0

- Scaffold React + Vite + TypeScript

---

## Contacto

**All In Remodeling** · Atlanta, GA  
Tel: [(470) 733-0461](tel:4707330461)  
Web: [allinremodeling.us](https://allinremodeling.us)
