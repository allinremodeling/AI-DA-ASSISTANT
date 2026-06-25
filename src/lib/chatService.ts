import { createThread, sendMessage } from './openai';
import type { ChatMessage } from './types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const HAS_OPENAI_KEY = !!OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-your-key';

let openaiThreadId: string | null = null;

export function hasOpenAIKey(): boolean {
  return HAS_OPENAI_KEY;
}

export async function ensureOpenAIThread(): Promise<string> {
  if (openaiThreadId) return openaiThreadId;
  openaiThreadId = await createThread();
  return openaiThreadId;
}

export async function sendChatMessage(
  _threadId: string,
  content: string,
  imageBase64?: string,
  onProgress?: (status: string) => void,
): Promise<ChatMessage> {
  if (HAS_OPENAI_KEY) {
    try {
      const oaiThread = await ensureOpenAIThread();
      onProgress?.('Enviando mensaje...');
      const response = await sendMessage(oaiThread, content, imageBase64);
      onProgress?.('Procesando respuesta...');
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        products: response.products.length > 0 ? response.products : undefined,
      };
    } catch (err) {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}.\n\nPor favor verifica que tu API key de OpenAI esté configurada correctamente.`,
        isError: true,
      };
    }
  }

  // Fallback: mock response
  await new Promise((r) => setTimeout(r, 1500));
  onProgress?.('Analizando...');
  await new Promise((r) => setTimeout(r, 1000));
  return buildMockResponse(content, imageBase64);
}

function buildMockResponse(content: string, imageBase64?: string): ChatMessage {
  const isImage = !!imageBase64;
  const isLayout = /\d+/.test(content) && /pulgada|inch|ft|pie|layout|medida|dimension/i.test(content);
  const isProduct = /producto|cuarzo|gabinete|shaker|quartz|cabinet|buscar|find|search/i.test(content);
  const isInspire = /inspira|render|imagen|diseno|concepto|visual|concept|design/i.test(content);

  if (isImage) {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `## Analisis Visual de tu Cocina

He analizado la imagen de tu espacio. Aqui estan mis observaciones:

**Estilo detectado:** Cocina tradicional con gabinetes de madera oscura y encimeras de granito.
**Colores dominantes:** Tonos calidos, madera oscura, beige.
**Iluminacion:** Iluminacion natural moderada, podria beneficiarse de luz LED bajo los gabinetes.

**Puntos de mejora:**
1. Los gabinetes oscuros absorben mucha luz - considerar cambiar a blanco shaker para ampliar visualmente
2. El granito actual puede actualizarse a cuarzo Calacatta con vetas dramaticas
3. El hardware (tiradores) parece desactualizado - recomiendo negro mate moderno
4. La iluminacion pendiente sobre la isla (si hay) podria modernizarse

**Recomendaciones:**
- Gabinetes: White Shaker (SKU: CAB-001 a CAB-005)
- Cuarzo: Calacatta White (SKU: QZ-001, QZ-002)
- Hardware: Negro mate o dorado cepillado

Quieres que busque estos productos en nuestro inventario o que genere un render conceptual del diseno propuesto?`,
    };
  }

  if (isLayout) {
    const dims = content.match(/(\d+(?:\.\d+)?)/g);
    const w = dims ? parseFloat(dims[0]) : 120;
    const l = dims ? parseFloat(dims[1] || dims[0]) : 108;
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `## Layout Calculado para tu Espacio

**Dimensiones:** ${w}" x ${l}" (${Math.round((w * l) / 144)} sq ft)
**Layout recomendado:** ${w >= 144 ? 'U con isla' : w >= 120 ? 'en L' : 'en L compacto'}

**Gabinetes necesarios:**
- ${Math.ceil(w / 24)}x Base Cabinet (estandar 24-36")
- ${Math.ceil(w / 30)}x Wall Cabinet (estandar 30-36")
- 1x Quartz Countertop ${w >= 120 ? '96"x22"' : w >= 96 ? '72"x22"' : '55"x22"'}

**Estimacion de costo:** $${(Math.ceil(w / 24) * 300 + Math.ceil(w / 30) * 200 + (w >= 120 ? 1500 : w >= 96 ? 1200 : 900)).toFixed(2)}

**Notas:**
- El espacio de circulacion minimo recomendado es 36" entre frentes de trabajo
- ${w >= 144 ? 'Tu espacio admite una isla de 36"x60" perfectamente' : w >= 120 ? 'Una isla pequena (30"x48") podria funcionar si optimizas el flujo' : 'Isla no recomendada - el espacio es limitado'}

Quieres que busque los productos especificos para este layout?`,
    };
  }

  if (isProduct) {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `He encontrado productos en nuestro inventario que coinciden con tu busqueda. Aqui estan las opciones disponibles:

**Nota:** Estos son productos reales de nuestro catalogo. Haz clic en "Ver" para ver mas detalles en nuestra tienda.`,
    };
  }

  if (isInspire) {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `Aqui tienes un concepto visual de diseno para inspirarte.

**Prompt generado:** Modern kitchen with white shaker cabinets, Calacatta white quartz countertops with dramatic gray veining, stainless steel appliances, pendant lights over island, dark matte hardware.

Puedo generar renders con diferentes combinaciones:
- Gabinetes blanco + Cuarzo Calacatta (clasico elegante)
- Gabinetes navy + Cuarzo blanco (contraste moderno)
- Gabinetes gris + Cuarzo Arabescato (tonos neutros)

Que combinacion te gustaria ver?`,
      generatedImage: 'https://images.unsplash.com/photo-1556911220-e15b0be4e00c?w=800',
    };
  }

  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: `Hola! Soy tu Asistente de Diseno de All In Remodeling.

Puedo ayudarte con:

**Analisis Visual** - Sube una foto de tu cocina y te dare recomendaciones expertas sobre estilo, colores, iluminacion y puntos de mejora.

**Diseno de Layouts** - Dame las medidas (ancho x largo en pulgadas) y calculo la distribucion optima (L, U, lineal, con isla) con presupuesto estimado.

**Consulta de Inventario** - Busco productos reales de nuestro catalogo: gabinetes shaker modernos, encimeras de cuarzo premium, accesorios.

**Inspiracion Visual** - Genero renders conceptuales con las combinaciones de gabinetes y cuarzo que prefieras.

Que te gustaria hacer? Puedes escribir, subir una foto, o elegir una de las sugerencias de arriba.`,
  };
}
