import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
// IMPORTANT: In production, never hardcode API keys in the client. Use a backend or secure .env
const API_KEY = "AIzaSyBlK4Fg29oz8EKdqdQ3z0KZ_i02x8KE7MA";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Sends a base64 encoded image to Gemini to extract ingredients.
 * @param base64Image The base64 string of the image
 * @param mimeType The mime type of the image (e.g. 'image/jpeg')
 * @returns Array of ingredient strings
 */
export const scanFridge = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "You are a professional chef. Look at this image of a fridge or pantry. Identify all the edible food ingredients visible. Return ONLY a valid JSON array of strings containing the ingredient names. Example: [\"eggs\", \"milk\", \"tomatoes\"]";

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse the JSON array from the response
    try {
      // Find the first '[' and last ']' to extract just the array in case of markdown formatting
      const startIndex = text.indexOf('[');
      const endIndex = text.lastIndexOf(']');
      if (startIndex !== -1 && endIndex !== -1) {
        const jsonString = text.substring(startIndex, endIndex + 1);
        return JSON.parse(jsonString);
      }
      return [];
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON output:", text);
      return [];
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

/**
 * Prompts Gemini to generate a recipe based on ingredients or parse a URL.
 */
export const parseRecipeText = async (textToParse: string): Promise<any> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Extract recipe information from the following text/url. Return ONLY valid JSON in this format: {"title": "Recipe Name", "ingredients": ["ing1", "ing2"], "steps": ["step1", "step2"], "calories": 400, "cookTime": "20 min", "difficulty": "Medium"}. Text: ${textToParse}`;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonString = text.substring(startIndex, endIndex + 1);
          return JSON.parse(jsonString);
        }
        return null;
    } catch (e) {
        console.error("Error parsing recipe text", e);
        return null;
    }
}
