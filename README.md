# AI-DA · Artificial Intelligence Design Assistant

Producto digital de **[ALL IN Builders LLC](https://www.allinbuilders.us/en)** y **[All In Remodeling](https://allinremodeling.us)** — asistente de diseño con IA para cocinas y baños en Georgia.

Integrado con **[SmartSlab](https://smartslab.app)** marketplace de slabs y remanentes.

**Live:** [ai-da-assistant.netlify.app](https://ai-da-assistant.netlify.app/)  
**cPanel:** [allinremodeling.us/ai/](https://allinremodeling.us/ai/)

**Deploy cPanel (archivo listo):** [`deploy-cpanel-ai.zip`](deploy-cpanel-ai.zip) — generar con `npm run deploy:cpanel`. Guía completa: [`DEPLOY-CPANEL.md`](DEPLOY-CPANEL.md).

---

## Modo express (invitado)

La landing por defecto es **consulta express** — no requiere cuenta.

| Característica | Detalle |
|----------------|---------|
| Turnos | **3 consultas** por sesión (primera + 2 refinamientos) |
| Contexto | Cada mensaje envía `history[]` al Edge Function; GPT ajusta las 5 tarjetas según feedback |
| Límite agotado | Invita a **Iniciar sesión** para continuar con asesor All In |
| Persistencia | No guarda historial en localStorage (solo sesión en memoria) |

Flujo típico: describe cocina → recibe análisis → “cambia a granito negro” → “agranda la isla” → crear cuenta para seguir.

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
| 2 | **Inspiration** | Tavily + keywords del análisis | Imagen **externa** (Houzz/Pinterest/web) según palabras clave destacadas — nunca repite la foto de recomendación All In |
| 3 | **AI-DA Recommendation** | Catálogo ALL IN | Servicios y productos específicos de All In Remodeling y All In Builders relevantes al proyecto |
| 4 | **Smart Slab Marketplace** | SmartSlab API en tiempo real | Slabs disponibles filtrados por material, color, acabado y dimensiones detectadas |
| 5 | **Plan de acción** | CTA ALL IN | Pasos concretos + botones para cotización, llamada y consulta con asesor |

Objetivo: el usuario debe sentir que AI-DA **entendió su proyecto, investigó en Internet, encontró inspiración real, verificó el inventario** y lo conectó con un asesor All In.

---

## UI/UX — mobile y desktop

Optimizado para tráfico desde **redes sociales e in-app browsers** (Instagram, Facebook, Safari/Chrome móvil):

| Área | Comportamiento |
|------|----------------|
| **Viewport** | `100dvh` + `viewport-fit=cover` + safe-area en input |
| **Express landing** | Primera pantalla sin login; contador 3 turnos visible |
| **Touch** | Botones ≥44px, `font-size: 16px` en input (evita zoom iOS), scroll suave con `overscroll-behavior` |
| **Tarjetas** | Grid 1 col móvil / 2 col desktop; badges “Inspiración web” vs “All In” |
| **Imágenes** | Placeholder si URL rota; inspiración y recomendación visualmente distintas |
| **Intro / follow-up** | Markdown `**negritas**` renderizado en welcome y refinamiento express |

---

## Inspiración web (Card 2)

1. Extrae **keywords** del mensaje, visión OpenAI y tokens `**destacados**` del análisis (`keywords.ts`).
2. Busca en Tavily con queries orientadas a Houzz/Pinterest/fotos de interiores.
3. **Excluye** URLs de portfolio All In y la imagen de la Card 3 (recomendación).
4. Fallback: banco de imágenes externas (Unsplash) emparejadas por estilo — no portfolio All In.

Requiere `TAVILY_API_KEY` en Supabase para resultados web en vivo.

---

## Idiomas

AI-DA detecta automáticamente el idioma del usuario y responde íntegramente en ese idioma.

- El frontend envía `navigator.language` (ej. `"en"`, `"es"`, `"pt"`) al Edge Function
- El Edge Function propaga `lang` a todos los módulos: análisis de imagen, búsqueda web, recomendaciones y plan de acción
- El modelo (GPT-4o-mini como orquestador) recibe `lang` explícito en el contexto y responde en ese idioma
- **No** se hardcodea español — cada bloque de cada card se genera en el idioma del usuario

## Análisis de imagen

V1.5.0 usa **OpenAI Vision** (`gpt-4o-mini`) con `OPENAI_API_KEY`. Si la key no está configurada en Supabase, la Card 1 usa solo el texto del usuario (modo demo local en el frontend).

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
| `VITE_AUTH_REDIRECT_URL` | Redirect post-login (prod: `https://allinremodeling.us/ai/`) |
| `VITE_CHAT_API_URL` | Opcional — override de la URL del chat |

### Supabase secrets (`supabase secrets set ...`)

| Secret | Descripción |
|--------|-------------|
| `OPENAI_API_KEY` | **Obligatorio** — visión + orquestador GPT |
| `TAVILY_API_KEY` | Búsqueda web de tendencias (recomendado) |
| `SMARTSLAB_BROWSE_URL` | Opcional — override feed browse (default: smart-slab-app.vercel.app/browse) |
| `SMARTSLAB_SUPABASE_URL` / `SMARTSLAB_SUPABASE_SECRET_KEY` | Listings SmartSlab (opcional) |
| `SMARTSLAB_API_URL` | API alternativa JSON (opcional) |

Los productos WooCommerce usan la conexión admin del mismo proyecto Supabase (`products`).

---

## Deploy cPanel + Supabase

Guía paso a paso: **[`DEPLOY-CPANEL.md`](DEPLOY-CPANEL.md)**

### Resumen rápido

```powershell
cd f:\Proyectos\AI-DA-ASSISTANT

# 1. Backend (Supabase Edge Function chat + secrets)
npx supabase login
npx supabase link --project-ref nchzvkvinhpnowopqbfb
npx supabase secrets set OPENAI_API_KEY=sk-... TAVILY_API_KEY=tvly-...
npm run deploy:chat

# 2. Frontend — genera deploy-cpanel-ai.zip
npm run deploy:cpanel
```

Sube **`deploy-cpanel-ai.zip`** a cPanel → `public_html/ai/` → Extract.  
Build actual: `assets/index-DgQqzdfy.js`.

### Verificar

- `https://allinremodeling.us/ai/` abre en modo express (contador 0/3)
- DevTools → Network: `POST .../functions/v1/chat` → 200, `blocks[]`, `followUp`
- Turno 2+: el request incluye `history` y `guestTurn`

---

## Scripts

```bash
npm install
npm run dev
npm run build            # Netlify legacy (base /)
npm run build:cpanel     # cPanel allinremodeling.us/ai/
npm run deploy:cpanel    # build:cpanel + deploy-cpanel-ai.zip
npm run deploy:chat      # supabase functions deploy chat
npx netlify dev          # Solo si usas Netlify functions en local
```

---

## Changelog

### v1.5.0 — 2026-06-26

Merge del **Prompt Maestro AI-DA** — rediseño completo del flujo de respuesta:

- **Consulta express (3 turnos)**: landing sin login; historial conversacional para refinar diseño antes de crear cuenta
- **UI/UX mobile + desktop**: safe-area, touch targets, avatares consistentes, intro/follow-up con negritas
- **Inspiración web única**: búsqueda Tavily por keywords del análisis; sin duplicar imagen de recomendación All In
- **5 Cards**: Analysis, Inspiration, AI-DA Recommendation, Smart Slab (1 full slab), Action Plan con CTAs All In
- **Detección de idioma**: `navigator.language` → `lang` en todo el pipeline Edge Function
- **OpenAI Vision** (`gpt-4o-mini`) para análisis de fotos
- **SmartSlab feed** desde `/browse` + scoring por keywords y medidas del proyecto
- **Deploy cPanel**: `npm run deploy:cpanel` → `deploy-cpanel-ai.zip` (ver [`DEPLOY-CPANEL.md`](DEPLOY-CPANEL.md))
- **Documentación**: [`docs/V1-5-0.md`](docs/V1-5-0.md)

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
