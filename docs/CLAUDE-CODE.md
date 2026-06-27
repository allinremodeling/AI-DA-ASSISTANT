# Claude Code — AI-DA

Claude Code está instalado **en este proyecto** como dependencia de desarrollo.

## Requisitos

- Node.js 18+
- Cuenta Anthropic (Claude Pro/Max) o `ANTHROPIC_API_KEY`

## Uso

```powershell
cd f:\Proyectos\AI-DA-ASSISTANT

# Primera vez: autenticación
npx claude auth login

# Sesión interactiva en el proyecto
npm run claude
# o
npx claude

# Verificar instalación
npm run claude:doctor
```

## Configuración del proyecto

| Archivo | Propósito |
|---------|-----------|
| [`CLAUDE.md`](../CLAUDE.md) | Contexto del repo (stack, deploy, convenciones) |
| [`.claude/settings.json`](../.claude/settings.json) | Permisos compartidos del equipo |
| [`.claude/settings.local.json`](../.claude/settings.local.json) | Overrides locales (no commitear) |
| [`.mcp.json`](../.mcp.json) | MCP Supabase (`nchzvkvinhpnowopqbfb`) |
| [`.claude/skills/`](../.claude/skills/) | Skills Supabase (opcional) |
| [`.claudeignore`](../.claudeignore) | Archivos excluidos del contexto |

## Windows — PowerShell

Si `npm` falla por *execution policy*:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run claude
```

O usa `npm.cmd run claude`.

## Instalador nativo (opcional)

Anthropic recomienda el instalador nativo en lugar de npm global:

```powershell
irm https://claude.ai/install.ps1 | iex
claude --version
```

El paquete local `@anthropic-ai/claude-code` sigue disponible vía `npx claude`.

## Docs oficiales

https://docs.anthropic.com/en/docs/claude-code/overview
