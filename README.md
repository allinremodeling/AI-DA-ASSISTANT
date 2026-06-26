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

## Variables de entorno (Netlify)

| Variable | Descripción |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude Vision — análisis de fotos |
| `OPENAI_API_KEY` | Copy y personalización de textos |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Auth cliente |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | Productos All In Remodeling |
| `SMARTSLAB_SUPABASE_URL` / `SMARTSLAB_SUPABASE_SECRET_KEY` | Listings SmartSlab (opcional) |
| `SMARTSLAB_API_URL` | API alternativa (default: smart-slab-app.vercel.app) |
| `TAVILY_API_KEY` | Búsqueda web de tendencias (opcional) |

---

## Scripts

```bash
npm install
npm run dev
npm run build            # Netlify (base /)
npm run build:cpanel     # cPanel /ai/
npx netlify dev          # Frontend + functions
```

---

## Changelog

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
