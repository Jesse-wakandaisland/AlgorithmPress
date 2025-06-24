import { OpenAI } from "openai";

export async function generateAiData(prompt: string, rowCount: number) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });

    // Create a system prompt that instructs the AI to generate structured data
    const systemPrompt = `You are a data generation assistant. Generate ${rowCount} rows of realistic, structured data based on the user's request. 
    Return ONLY valid JSON array with objects that have consistent keys across all items. 
    Do not include any explanations or markdown, just the raw JSON array.`;

    // Enhance the user prompt to be more specific about the format
    const enhancedPrompt = `I need a dataset with ${rowCount} rows of data with the following characteristics:
    ${prompt}
    
    Please generate this as a JSON array of objects with consistent keys across all items.`;

    // Generate the data using the OpenAI API
    const response = await openai.chat.completions.create({
      model: "o4-mini-2025-04-16",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: enhancedPrompt },
      ],
      temperature: 1,
    });

    const text = response.choices[0]?.message?.content || "[]";

    // Parse the response as JSON
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedText = text
        .trim()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const data = JSON.parse(cleanedText);

      // Validate that we got an array of objects
      if (!Array.isArray(data)) {
        throw new Error("AI did not return an array");
      }

      // Ensure we have the requested number of rows (approximately)
      const actualRowCount = data.length;
      if (actualRowCount < rowCount * 0.5) {
        throw new Error(
          `AI only generated ${actualRowCount} rows, expected at least ${
            rowCount * 0.5
          }`
        );
      }

      // Return the data, limiting to the requested row count
      return data.slice(0, rowCount);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Failed to parse AI-generated data");
    }
  } catch (error) {
    console.error("Error in AI data generation:", error);
    throw error;
  }
}
