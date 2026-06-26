# Despliegue cPanel — allinremodeling.us/ai

Guía paso a paso para publicar AI-DA en tu hosting cPanel.

---

## Resumen

| Paso | Qué | Dónde |
|------|-----|--------|
| 1 | Edge Function `chat` + secrets IA | Supabase |
| 2 | Build del frontend | Tu PC |
| 3 | Subir archivos | cPanel `public_html/ai/` |

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
  ANTHROPIC_API_KEY=sk-ant-TU_KEY `
  OPENAI_API_KEY=sk-TU_KEY `
  TAVILY_API_KEY=tvly-TU_KEY
```

Despliega la función:

```powershell
npm run deploy:chat
```

Verifica en el navegador (debe responder JSON, no 404):

`https://nchzvkvinhpnowopqbfb.supabase.co/functions/v1/chat`

---

## Paso 2 — Build local

Asegúrate de tener `.env.local` con:

```
VITE_SUPABASE_URL=https://nchzvkvinhpnowopqbfb.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Genera el build y el ZIP:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-cpanel.ps1
```

Esto crea **`deploy-cpanel-ai.zip`** en la raíz del proyecto.

---

## Paso 3 — Subir a cPanel

1. Entra a **cPanel → File Manager**
2. Ve a **`public_html/ai/`** (créala si no existe)
3. **Borra** archivos viejos dentro de `/ai/` (index.html antiguo, `/src/`, etc.)
4. Sube **`deploy-cpanel-ai.zip`**
5. Clic derecho → **Extract**
6. Confirma que existan:
   - `index.html`
   - `assets/` (JS y CSS)
   - `.htaccess` (SPA — rutas internas)
   - `brand/` (logos)

---

## Paso 4 — Probar

1. Abre **https://allinremodeling.us/ai/**
2. Debe cargar la app (no pantalla en blanco)
3. Clic en **Consulta express sin cuenta**
4. Escribe una pregunta → en DevTools (F12) → Network debe verse:
   - `POST https://nchzvkvinhpnowopqbfb.supabase.co/functions/v1/chat` → **200**

---

## Problemas frecuentes

### Pantalla en blanco
- Subiste código fuente (`/src/main.tsx`) en vez del build → vuelve a subir contenido de `dist/` o el ZIP
- Falta `.htaccess` → el ZIP lo incluye; no lo omitas

### Chat en modo demo (sin IA real)
- La Edge Function no está desplegada o faltan secrets en Supabase
- Ejecuta Paso 1 completo

### Error CORS / 401 en chat
- Revisa que `VITE_SUPABASE_ANON_KEY` en `.env.local` sea la publishable key correcta
- Vuelve a hacer build y subir el ZIP

---

## Actualizar después de cambios

```powershell
git pull
powershell -ExecutionPolicy Bypass -File scripts\deploy-cpanel.ps1
# Sube de nuevo deploy-cpanel-ai.zip a public_html/ai/
```

Si cambiaste la API del chat:

```powershell
npm run deploy:chat
```
