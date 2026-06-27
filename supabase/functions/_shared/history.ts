export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Merge prior turns + latest message for search, dimensions and GPT context. */
export function buildFullConversationContext(message: string, history: ChatHistoryTurn[] = []): string {
  if (!history.length) return message.trim();
  const lines = history
    .filter((h) => h.content.trim())
    .map((h) => `${h.role === 'user' ? 'Usuario' : 'AI-DA'}: ${h.content.trim()}`);
  lines.push(`Usuario: ${message.trim()}`);
  return lines.join('\n').slice(0, 2200);
}

export function guestTurnsRemaining(guestTurn: number, limit = 3): number {
  return Math.max(0, limit - guestTurn);
}

export function guestRefinementFollowUp(lang: string, remaining: number, opts?: { hasEditedPhoto?: boolean; guestTurn?: number }): string {
  if (remaining <= 0) {
    return lang === 'es'
      ? 'Has usado tus **3 consultas express** gratuitas. Crea una cuenta gratis para guardar tu diseño, seguir editando fotos y hablar con un asesor All In.'
      : 'You have used your **3 free express consultations**. Create a free account to save your design, keep editing photos, and talk with an All In advisor.';
  }

  if (opts?.hasEditedPhoto && opts.guestTurn === 2 && remaining === 1) {
    return lang === 'es'
      ? '¿Te gusta cómo se ve? **Crea una cuenta gratis** para guardar este diseño y seguir probando opciones con nuestro diseñador.'
      : 'Do you like how it looks? **Create a free account** to save this design and keep trying options with our designer.';
  }

  const templates: Record<string, string> = {
    es: remaining === 1
      ? '¿Quieres ajustar materiales, estilo o medidas? Te queda **1 consulta express** para afinar el diseño.'
      : `¿Quieres cambiar algo del resultado? Te quedan **${remaining} consultas express** para refinar tu proyecto.`,
    en: remaining === 1
      ? 'Want to adjust materials, style, or dimensions? You have **1 express turn** left to refine the design.'
      : `Want to change something? You have **${remaining} express turns** left to refine your project.`,
  };
  return templates[lang] || templates.en;
}
