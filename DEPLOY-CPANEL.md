# Despliegue cPanel — allinremodeling.us/ai

Guía paso a paso para publicar **AI-DA V1.5.0** en tu hosting cPanel.

> Documentación completa de la release: [`docs/V1-5-0.md`](docs/V1-5-0.md)

---

## Estado de versiones (última revisión)

| Entorno | Versión | Cómo verificar |
|---------|---------|----------------|
| GitHub `main` | **V1.5.0** (`b6e3e91+`) | Repo actualizado |
| Build local | **V1.5.0** | `deploy-cpanel-ai.zip` en raíz |
| [allinremodeling.us/ai/](https://allinremodeling.us/ai/) | ⚠️ **Anterior** | DevTools → `index-BZu9LrRK.js` = desactualizado |
| Tras deploy | **V1.5.0** | DevTools → `index-B7yE_QLu.js` (o hash nuevo) |

**Acción requerida:** subir el ZIP nuevo a cPanel y ejecutar `npm run deploy:chat` en Supabase.

---

## Resumen

| Paso | Qué | Dónde |
|------|-----|--------|
| 1 | Edge Function `chat` + secrets IA | Supabase |
| 2 | Build del frontend + ZIP | Tu PC |
| 3 | Subir y extraer ZIP | cPanel `public_html/ai/` |

**Archivo listo para subir:** `deploy-cpanel-ai.zip` (raíz del proyecto)

---

## Paso 1 — Supabase (API del chat)

Abre PowerShell en la carpeta del proyecto:

```powershell
cd f:\Proyectos\AI-DA-ASSISTANT
npx supabase login
npx supabase link --project-ref nchzvkvinhpnowopqbfb
```

Configura los secrets (solo una vez):

```powershell
npx supabase secrets set `
  OPENAI_API_KEY=sk-TU_KEY `
  TAVILY_API_KEY=tvly-TU_KEY

# Opcional — inventario SmartSlab en vivo:
npx supabase secrets set `
  SMARTSLAB_SUPABASE_URL=https://xxx.supabase.co `
  SMARTSLAB_SUPABASE_SECRET_KEY=sb_secret_...
```

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
```

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
3. Clic en **Consulta express sin cuenta**
4. Escribe una pregunta (o sube foto de cocina)
5. DevTools (F12) → Network:
   - `POST .../functions/v1/chat` → **200**
   - Respuesta con `blocks[]` (5 tarjetas: análisis, inspiración, recomendación, SmartSlab, plan de acción)

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

## v1.5.0 — Qué incluye esta versión

- **5 tarjetas dinámicas:** análisis → inspiración → recomendación → SmartSlab → plan con asesor
- **OpenAI Vision** para fotos (sin Claude)
- **Multilingüe** — responde en el idioma del usuario
- **SmartSlab** filtrado por medidas del proyecto
- UI login mejorada + grid 2×2 en respuestas del chat
