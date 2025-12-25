
import { GoogleGenAI } from "@google/genai";

// Robust check for the API key in various deployment environments
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const getReadingAdvice = async (title: string, pagesLeft: number, pace: number) => {
  if (!getApiKey()) return "Set an API key to get personalized reading tips!";
  
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
    return "Keep going! Every page turned is a step closer to completing your journey through this book.";
  }
};
