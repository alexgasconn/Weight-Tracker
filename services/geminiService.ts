import { GoogleGenAI, Type } from "@google/genai";
import { WeightRecord, AiInsight } from '../types';

export const analyzeWeightTrend = async (data: WeightRecord[]): Promise<AiInsight> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare data summary (last 30 entries to save tokens and focus on recent trends)
  const recentData = data.slice(-30).map(r => `${r.originalDateString}: ${r.weight}kg`).join('\n');
  const totalChange = (data[data.length - 1].weight - data[0].weight).toFixed(1);

  const prompt = `
    Actua com un nutricionista i entrenador personal expert que parla català.
    Analitza les següents dades de pes d'un usuari (dels últims 30 registres).
    El canvi total des de l'inici ha estat de ${totalChange}kg.
    
    Dades (Dia: Pes):
    ${recentData}

    Proporciona una resposta en format JSON amb els següents camps:
    - summary: Un resum breu de la tendència actual (màxim 2 frases).
    - advice: Un consell motivador o acció recomanada basada en les dades (màxim 2 frases).
    - trend: "positive" (si el pes baixa o s'estabilitza saludablement), "negative" (si puja ràpidament sense control), o "stable". Nota: Si l'objectiu és perdre pes, baixar és "positive". Assumeix que l'usuari vol controlar o baixar pes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            advice: { type: Type.STRING },
            trend: { type: Type.STRING, enum: ["positive", "negative", "stable"] }
          },
          required: ["summary", "advice", "trend"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AiInsight;

  } catch (error) {
    console.error("Gemini analysis failed", error);
    return {
      summary: "No s'ha pogut analitzar les dades en aquest moment.",
      advice: "Continua registrant el teu pes diàriament per obtenir millors resultats.",
      trend: "stable"
    };
  }
};