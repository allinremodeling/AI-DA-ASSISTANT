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

## Respuesta del chat — 5 Cards

Cada consulta genera **5 tarjetas** dentro del chat. La IA primero muestra un indicador de análisis ("🔎 Analizando tu proyecto...") mientras procesa la imagen, busca tendencias y verifica inventario antes de responder.

| # | Card | Fuente | Descripción |
|---|------|--------|-------------|
| 1 | **Analysis** | IA + imagen + web | Confirma que AI-DA entendió el proyecto; parafrasea la intención del usuario e incorpora contexto de tendencias actuales |
| 2 | **Inspiration** | Tavily web search | Referencias estilo Pinterest/Houzz/ArchDaily embebidas en el chat — sin salir de la app |
| 3 | **AI-DA Recommendation** | Catálogo ALL IN | Servicios y productos específicos de All In Remodeling y All In Builders relevantes al proyecto |
| 4 | **Smart Slab Marketplace** | SmartSlab API en tiempo real | Slabs disponibles filtrados por material, color, acabado y dimensiones detectadas |
| 5 | **Plan de acción** | CTA ALL IN | Pasos concretos + botones para cotización, llamada y consulta con asesor |

Objetivo: el usuario debe sentir que AI-DA **entendió su proyecto, investigó en Internet, encontró inspiración real, verificó el inventario** y lo conectó con un asesor All In.

---

## Idiomas

AI-DA detecta automáticamente el idioma del usuario y responde íntegramente en ese idioma.

- El frontend envía `navigator.language` (ej. `"en"`, `"es"`, `"pt"`) al Edge Function
- El Edge Function propaga `lang` a todos los módulos: análisis de imagen, búsqueda web, recomendaciones y plan de acción
- El modelo (GPT-4o-mini como orquestador) recibe `lang` explícito en el contexto y responde en ese idioma
- **No** se hardcodea español — cada bloque de cada card se genera en el idioma del usuario

## Vision Fallback

El análisis de imágenes sigue una cadena de fallback:

1. **Claude Vision** (`claude-sonnet-4-*`) — si `ANTHROPIC_API_KEY` está configurado
2. **GPT-4o vision** (`gpt-4o-mini`) — fallback automático usando el mismo `OPENAI_API_KEY`
3. **Sin análisis** — si ambas keys están ausentes, la Card 1 usa solo el texto del usuario

Esto garantiza que la experiencia no se interrumpa aunque Claude Vision no esté disponible.

---

## Arquitectura (cPanel + Supabase)

| Capa | Dónde | Qué hace |
|------|-------|----------|
| **Frontend** | cPanel `public_html/ai/` | React SPA en `allinremodeling.us/ai` |
| **Chat API** | Supabase Edge Function `chat` | OpenAI Vision, Tavily, SmartSlab, GPT orchestrator |
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

### v1.5.0 — 2026-06-26

Merge del **Prompt Maestro AI-DA** — rediseño completo del flujo de respuesta:

- **5 Cards**: estructura migrada de 4 pilares a 5 tarjetas explícitas (Analysis, Inspiration, AI-DA Recommendation, Smart Slab Marketplace, Action Plan)
- **Detección de idioma**: `navigator.language` desde el frontend → `lang` propagado a todos los módulos del Edge Function → respuesta íntegra en el idioma del usuario
- **Vision fallback**: Claude Vision → GPT-4o vision → vacío; nunca interrumpe el flujo por falta de API key
- **SmartSlab como Card 4 dedicada**: el marketplace pasa de ser un listado flotante a una tarjeta estructurada dentro del flujo de 5 cards
- **Thinking state**: mensaje de carga actualizado a `"🔎 Analizando tu proyecto..."` antes de mostrar resultados
- **Tone personalizado**: el orquestador GPT-4o recibe `lang` explícito para evitar respuestas genéricas y variar por proyecto
- **Documentación**: [`docs/V1-5-0.md`](docs/V1-5-0.md) — release notes, limitaciones y checklist de deploy

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
