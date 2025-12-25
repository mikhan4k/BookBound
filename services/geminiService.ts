
import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    // Only attempt to initialize if we have access to process.env.API_KEY
    try {
      const apiKey = process.env.API_KEY;
      if (apiKey) {
        aiInstance = new GoogleGenAI({ apiKey });
      }
    } catch (e) {
      console.warn("AI initialization delayed: process.env.API_KEY not yet available.");
    }
  }
  return aiInstance;
};

/**
 * Provides personalized reading advice using the Gemini 3 Flash model.
 */
export const getReadingAdvice = async (title: string, pagesLeft: number, pace: number) => {
  const ai = getAi();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I am reading a book titled "${title}". I have ${pagesLeft} pages left and I plan to read ${pace} pages per day. Can you give me a short, motivating reading tip or an interesting fact about reading habits? Keep it under 100 words.`,
      config: {
        temperature: 0.7,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error fetching reading advice:", error);
    return null;
  }
};
