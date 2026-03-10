import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const draftNoticeContent = async (topic: string, type: string): Promise<string> => {
  if (!ai) {
    return "La funcionalidad de IA no está configurada (Falta API Key).";
  }

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Actúa como un asistente secretario para una gran familia (Apellido MAZ).
      Escribe un borrador de un anuncio familiar breve, educado y cálido en español.
      
      Tipo de anuncio: ${type}
      Tema principal: ${topic}
      
      El tono debe ser familiar pero respetuoso. No uses marcadores de posición.
      Devuelve solo el texto del cuerpo del mensaje.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "No se pudo generar el contenido.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "Error al conectar con el asistente inteligente.";
  }
};