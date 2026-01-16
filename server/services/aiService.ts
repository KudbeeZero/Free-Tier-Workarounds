import { openai } from "../replit_integrations/audio/client";
import { getAIHeuristics } from "../private/aiHeuristics";

export const aiService = {
  async getTrendRecommendation(trendId: number, trendScore: number, percentile: number, label: string) {
    // AI receives sanitized data only
    const summarizedSignals = {
      score: trendScore,
      percentile,
      label
    };
    
    const heuristic = getAIHeuristics(summarizedSignals);
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: "You are a trend analyst. Provide a brief recommendation based on the summarized data provided." },
        { role: "user", content: `Data Summary: ${heuristic}. Score: ${trendScore}, Market Condition: ${label}.` }
      ],
      max_completion_tokens: 100
    });

    return response.choices[0]?.message?.content || "No recommendation available.";
  }
};
