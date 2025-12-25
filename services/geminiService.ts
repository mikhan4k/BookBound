
import { GoogleGenAI } from "@google/genai";

// Always initialize the client using a named parameter with the API key directly from the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Provides personalized reading advice using the Gemini 3 Flash model.
 * @param title The book title
 * @param pagesLeft Number of pages remaining
 * @param pace Targeted reading pace (pages per day)
 * @returns A motivating tip or fact string
 */
export const getReadingAdvice = async (title: string, pagesLeft: number, pace: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I am reading a book titled "${title}". I have ${pagesLeft} pages left and I plan to read ${pace} pages per day. Can you give me a short, motivating reading tip or an interesting fact about reading habits? Keep it under 100 words.`,
      config: {
        temperature: 0.7,
      },
    });
    // Accessing .text as a property as required by the SDK guidelines.
    return response.text;
  } catch (error) {
    console.error("Error fetching reading advice:", error);
    return null;
  }
};
