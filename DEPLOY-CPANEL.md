# Despliegue cPanel — allinremodeling.us/ai

Guía paso a paso para publicar **AI-DA V1.5.1** en tu hosting cPanel.

> Release actual: [`docs/V1-5-1.md`](docs/V1-5-1.md) · Anterior: [`docs/V1-5-0.md`](docs/V1-5-0.md)

---

## Estado de versiones (última revisión)

| Entorno | Versión | Cómo verificar |
|---------|---------|----------------|
| GitHub `main` | **V1.5.1** | Repo actualizado |
| Build local | **V1.5.1** | `deploy-cpanel-ai.zip` en raíz |
| Asset JS actual | **V1.5.1** | DevTools → `index-C3qpciC7.js` |
| [allinremodeling.us/ai/](https://allinremodeling.us/ai/) | ✅ V1.5.1 | Debe cargar `index-C3qpciC7.js` |
| Supabase `chat` | ✅ Tras `npm run deploy:chat` | POST → 200 con `blocks[]` |

**Acción pendiente (solo cPanel):** subir **`deploy-cpanel-ai.zip`** a `public_html/ai/` y extraer. Backend V1.5.1 ya desplegado con `npm run deploy:chat`.

---

## Resumen

| Paso | Qué | Dónde |
|------|-----|--------|
| 1 | Edge Function `chat` + secrets IA | Supabase |
| 2 | Build del frontend + ZIP | Tu PC |
| 3 | Subir y extraer ZIP | cPanel `public_html/ai/` |

**Archivo listo para subir:** [`deploy-cpanel-ai.zip`](deploy-cpanel-ai.zip) (raíz del proyecto — regenerar con `npm run deploy:cpanel`)

**Build actual (V1.5.1):** `assets/index-C3qpciC7.js` · `assets/index-DPOOnIVn.css`

---

## Paso 1 — Supabase (API del chat)

Abre PowerShell en la carpeta del proyecto:

```powershell
cd f:\Proyectos\AI-DA-ASSISTANT
npx supabase login
npx supabase link --project-ref nchzvkvinhpnowopqbfb
npm run deploy:chat
```

> **Windows:** si PowerShell bloquea `npm` (*execution policy*), `deploy:chat` ya usa `ExecutionPolicy Bypass`. Alternativa: `npm.cmd run deploy:chat`.

Configura los secrets (solo una vez):

```powershell
npx supabase secrets set `
  OPENAI_API_KEY=sk-TU_KEY `
  TAVILY_API_KEY=tvly-TU_KEY

# Opcional — inventario SmartSlab en vivo:
npx supabase secrets set `
  SMARTSLAB_API_URL=https://smart-slab-app.vercel.app `
  SMARTSLAB_API_KEY=... `
  SMARTSLAB_SUPABASE_URL=https://xxx.supabase.co `
  SMARTSLAB_SUPABASE_SECRET_KEY=sb_secret_...
```

> **SmartSlab feed:** AI-DA lee inventario en vivo desde [`smart-slab-app.vercel.app/browse`](https://smart-slab-app.vercel.app/browse) (listings embebidos en la página). Opcional: `SMARTSLAB_BROWSE_URL` para override. Fallback: API JSON → Supabase → lista estática.

> **v1.5.0** usa **OpenAI Vision** (`gpt-4o-mini`) — ya no requiere `ANTHROPIC_API_KEY`.

Despliega la función:

```powershell
npm run deploy:chat
```

Verifica que responda (POST con JSON, no 404):

`https://nchzvkvinhpnowopqbfb.supabase.co/functions/v1/chat`

---

## Paso 2 — Generar ZIP para cPanel

Asegúrate de tener `.env.local` con:

```
VITE_SUPABASE_URL=https://nchzvkvinhpnowopqbfb.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_AUTH_REDIRECT_URL=https://allinremodeling.us/ai/
```

> `VITE_AUTH_REDIRECT_URL` evita que el correo de confirmación redirija a `localhost`.

Genera build + ZIP:

```powershell
npm run deploy:cpanel
```

Resultado: **`F:\Proyectos\AI-DA-ASSISTANT\deploy-cpanel-ai.zip`**

Contenido del ZIP:

| Archivo / carpeta | Función |
|-------------------|---------|
| `index.html` | Entrada SPA |
| `assets/` | JS y CSS compilados |
| `.htaccess` | Rutas SPA en `/ai/` |
| `brand/` | Logos All In + SmartSlab |

---

## Paso 3 — Subir a cPanel

1. **cPanel → File Manager**
2. Entra a **`public_html/ai/`** (créala si no existe)
3. **Borra** archivos viejos (`index.html`, `assets/`, `/src/` si quedó de antes)
4. Clic **Upload** → sube **`deploy-cpanel-ai.zip`**
5. Clic derecho en el ZIP → **Extract**
6. Confirma que los archivos queden **directamente** en `/ai/` (no en una subcarpeta extra)

---

## Paso 4 — Probar

1. Abre **https://allinremodeling.us/ai/**
2. **Ctrl + Shift + R** (recarga forzada)
3. Confirma en DevTools → Sources que cargue **`index-C0Y4eEkv.js`**
4. La primera pantalla es **modo express** (sin login): contador **0/3** en el header
5. Escribe una pregunta (o sube foto de cocina) → recibes 5 tarjetas
6. Envía un **segundo mensaje** refinando (ej. “prefiero vetas grises”) → GPT debe ajustar con contexto del turno anterior
7. DevTools (F12) → Network:
   - `POST .../functions/v1/chat` → **200**
   - Body incluye `history[]` y `guestTurn` en turnos 2 y 3
   - Respuesta con `blocks[]` y `followUp` indicando consultas restantes

---

## Problemas frecuentes

### Pantalla en blanco
- Subiste código fuente en vez del build → vuelve a subir el ZIP
- Falta `.htaccess` → incluido en el ZIP; no lo omitas

### Chat en modo demo (respuestas genéricas)
- Edge Function no desplegada o falta `OPENAI_API_KEY` en Supabase secrets
- Ejecuta Paso 1 completo y `npm run deploy:chat`

### Card 1 vacía o respuestas repetitivas
- Actualiza la función: `npm run deploy:chat` (v1.5.0+ usa orquestador GPT)

### Error CORS / 401 en chat
- Revisa `VITE_SUPABASE_ANON_KEY` en `.env.local`
- Regenera ZIP: `npm run deploy:cpanel` y vuelve a subir

### Logos rotos
- El build usa rutas `/ai/brand/...` — sube el ZIP completo, no archivos sueltos viejos

### Correo de confirmación abre `localhost:3000`
1. **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Site URL:** `https://allinremodeling.us/ai/`
3. **Redirect URLs** (añade todas):
   - `https://allinremodeling.us/ai/**`
   - `http://localhost:5173/**` (desarrollo local)
4. En `.env.local` define `VITE_AUTH_REDIRECT_URL=https://allinremodeling.us/ai/` y vuelve a ejecutar `npm run deploy:cpanel`
5. El usuario debe **crear cuenta de nuevo** o reenviar confirmación (el enlace viejo sigue apuntando a localhost)

---

## Actualizar después de cambios

```powershell
git pull
npm run deploy:cpanel
# Sube deploy-cpanel-ai.zip a public_html/ai/ y extrae
```

Si cambiaste solo la API del chat (backend):

```powershell
npm run deploy:chat
```

Si cambiaste frontend (UI, estilos):

```powershell
npm run deploy:cpanel
# Sube el nuevo ZIP a cPanel
```

---

## v1.5.1 — Qué incluye esta versión

- **Asistente virtual** con Anthropic/OpenAI — respuestas fluidas y refinamiento conversacional
- **Inspiración con imagen completa** — Card 2 siempre con foto web alineada al análisis (waterfall, estilo, materiales)
- **Consulta express (3 turnos)** + UI mobile/desktop optimizada
- **5 tarjetas** + plan de acción All In · SmartSlab

## v1.5.0 — histórico

- **Consulta express por defecto** — sin login; **3 turnos** con historial para refinar diseño (materiales, estilo, medidas)
- **5 tarjetas dinámicas:** análisis → inspiración → recomendación → SmartSlab (1 full slab) → plan con asesor
- **OpenAI Vision** para fotos (sin Claude)
- **Multilingüe** — responde en el idioma del usuario
- **SmartSlab** feed desde `/browse` + filtro por medidas del proyecto
- Logo All In en header · CTAs WhatsApp, teléfono y Google Calendar en plan de acción
- UI login opcional (“Iniciar sesión”) para historial y asesor completo
