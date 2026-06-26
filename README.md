# AI-DA · Artificial Intelligence Design Assistant

Producto digital de **[ALL IN Builders LLC](https://www.allinbuilders.us/en)** y **[All In Remodeling](https://allinremodeling.us)** — asistente de diseño con IA para cocinas y baños en Georgia.

Integrado con **[SmartSlab](https://smartslab.app)** marketplace de slabs y remanentes.

**Live:** [ai-da-assistant.netlify.app](https://ai-da-assistant.netlify.app/)  
**cPanel:** [allinremodeling.us/ai/](https://allinremodeling.us/ai/)

---

## Ecosistema

| Marca | Rol | URL |
|-------|-----|-----|
| **AI-DA** | Asistente de diseño IA | Este producto |
| **All In Remodeling** | Gabinetes, cuarzo, remodelación | [allinremodeling.us](https://allinremodeling.us) |
| **All In Builders** | Construcción y framing | [allinbuilders.us](https://www.allinbuilders.us/en) |
| **SmartSlab** | Marketplace slabs/remnants | [smartslab.app](https://smartslab.app) · [app](https://smart-slab-app.vercel.app) |

---

## Respuesta del chat — 4 pilares

Cada consulta genera **4 secciones** dentro del chat (sin salir a referencias externas):

1. **Análisis visual** — Claude Vision analiza la foto del usuario
2. **Inspiración externa** — tendencia web embebida (Tavily) con imagen en el chat
3. **Ecosistema All In** — portfolio real, productos WooCommerce, slabs SmartSlab
4. **Plan de acción** — pasos + botones para cotización, llamada y consulta con asesor

Objetivo: dejar al usuario **listo para hablar con un asesor** y concretar la remodelación.

---

## Arquitectura (cPanel + Supabase)

| Capa | Dónde | Qué hace |
|------|-------|----------|
| **Frontend** | cPanel `public_html/ai/` | React SPA en `allinremodeling.us/ai` |
| **Chat API** | Supabase Edge Function `chat` | Claude Vision, tendencias, SmartSlab, productos |
| **Auth** | Supabase Auth | Login / registro usuarios AI-DA |

El frontend **no** lleva API keys de OpenAI/Anthropic — solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

---

## Variables de entorno

### Cliente (`.env.local` — solo públicas, van al build de cPanel)

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key (auth + llamada a Edge Functions) |
| `VITE_CHAT_API_URL` | Opcional — override de la URL del chat |

### Supabase secrets (`supabase secrets set ...`)

| Secret | Descripción |
|--------|-------------|
| `ANTHROPIC_API_KEY` | Claude Vision — análisis de fotos |
| `OPENAI_API_KEY` | Copy y personalización de textos |
| `TAVILY_API_KEY` | Búsqueda web de tendencias (opcional) |
| `SMARTSLAB_SUPABASE_URL` / `SMARTSLAB_SUPABASE_SECRET_KEY` | Listings SmartSlab (opcional) |
| `SMARTSLAB_API_URL` | API alternativa (default: smart-slab-app.vercel.app) |

Los productos WooCommerce usan la conexión admin del mismo proyecto Supabase (`products`).

---

## Deploy cPanel + Supabase

### 1. Secrets y Edge Function

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF

supabase secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  OPENAI_API_KEY=sk-... \
  TAVILY_API_KEY=tvly-...

supabase functions deploy chat
```

La función queda en: `https://TU_PROJECT.supabase.co/functions/v1/chat`  
(`verify_jwt = false` — acceso invitado + usuarios con anon key.)

### 2. Build frontend para `/ai/`

```powershell
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

npm install
npm run build:cpanel
```

Sube **todo el contenido** de `dist/` a `public_html/ai/` (incluye `.htaccess` para SPA).

### 3. Verificar

- `https://allinremodeling.us/ai/` carga la app
- En DevTools → Network, `POST .../functions/v1/chat` responde 200 con JSON `blocks[]`

---

## Scripts

```bash
npm install
npm run dev
npm run build            # Netlify legacy (base /)
npm run build:cpanel     # cPanel allinremodeling.us/ai/
npx netlify dev          # Solo si usas Netlify functions en local
```

---

## Changelog

### v1.4.0 — 2026-06-25

- Chat API migrado a **Supabase Edge Function** (`functions/chat`)
- Frontend en cPanel `allinremodeling.us/ai` llama a Supabase (sin Netlify Functions)
- Secrets de IA en Supabase, no en el build del cliente

### v1.3.0 — 2026-06-26

- **AI-DA** como producto de marca (ALL IN Builders + All In Remodeling)
- Integración **SmartSlab** marketplace (slabs/remnants)
- Respuesta estructurada en **4 pilares** + plan de acción con CTAs de asesor
- Logos oficiales All In Builders + SmartSlab
- Branding naranja All In Builders (`#e85d04`)
- Servicios ecosistema: builders, remodeling, smartslab

### v1.2.0 — 2026-06-26

- Claude Vision, portfolio allinremodeling.us, GPT-4o

### v1.1.0 — 2026-06-25

- Modo invitado, tarjetas JSON, Netlify Function, fix deploy

### v1.0.0 — 2026-06-24

- Chat OpenAI, auth Supabase, product cards

---

## Contacto

**ALL IN Builders LLC** · **All In Remodeling**  
Tel: [(470) 733-0461](tel:4707330461) · [(678) 725-6233](tel:6787256233)  
Email: allinremodelingcompany@gmail.com
