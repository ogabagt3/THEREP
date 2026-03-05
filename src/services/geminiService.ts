import { GoogleGenAI, Type } from "@google/genai";
import { NewsHeadline } from "./marketDataService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  impact: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface PairAnalysis {
  pair: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  change: string; // e.g. "+0.14%"
  keyFactors: string[];
  summary: string;
  news: NewsItem[];
  insights: string[];
  lastUpdate: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetry(
  pair: string, 
  currentPrice?: { price: string, change: string, changePercent: string },
  onRetry?: (attempt: number, delay: number) => void, 
  attempt = 0
): Promise<string> {
  const MAX_RETRIES = 5;
  const INITIAL_DELAY = 3000; // 3 seconds

  const priceContext = currentPrice 
    ? `The current market price for ${pair} is ${currentPrice.price} with a 24h change of ${currentPrice.change} (${currentPrice.changePercent}).`
    : `Analyze the current financial market bias for ${pair}.`;

  const prompt = `${priceContext}
  Provide:
  1. Overall bias (bullish, bearish, or neutral).
  2. Confidence level (0-100).
  3. Current approximate 24h change percentage (use the provided data if available, otherwise estimate).
  4. 2-3 key bullet point factors driving this bias. IMPORTANT: Each factor must be very concise, maximum 2 lines of text.
  5. A brief summary.
  6. A list of 3 key recent news items. For each news item, analyze the sentiment as "positive", "negative", or "neutral" and its "impact" (high, medium, low).
  7. "Insights": 3-4 bullet points that simplify the fundamental jargon for a complete beginner. Explain why the pair is strong or weak in plain English, avoiding complex terms or explaining them simply.
  
  Return the data in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pair: { type: Type.STRING },
            bias: { type: Type.STRING, enum: ["bullish", "bearish", "neutral"] },
            confidence: { type: Type.NUMBER },
            change: { type: Type.STRING },
            keyFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  source: { type: Type.STRING },
                  url: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  sentiment: { type: Type.STRING, enum: ["positive", "negative", "neutral"] }
                },
                required: ["title", "summary", "source", "impact", "sentiment"]
              }
            }
          },
          required: ["pair", "bias", "confidence", "change", "keyFactors", "summary", "news", "insights"]
        }
      }
    });
    return response.text || "{}";
  } catch (error: any) {
    const isRateLimit = error?.message?.includes("429") || error?.status === 429 || error?.code === 429;
    
    if (isRateLimit && attempt < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`Rate limit hit for ${pair}. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
      if (onRetry) onRetry(attempt + 1, delay);
      await sleep(delay);
      return callGeminiWithRetry(pair, currentPrice, onRetry, attempt + 1);
    }
    throw error;
  }
}

export async function analyzeMarket(
  pair: string, 
  currentPrice?: { price: string, change: string, changePercent: string },
  onRetry?: (attempt: number, delay: number) => void
): Promise<PairAnalysis> {
  try {
    const text = await callGeminiWithRetry(pair, currentPrice, onRetry);
    const data = JSON.parse(text);
    return {
      ...data,
      lastUpdate: new Date().toLocaleTimeString()
    };
  } catch (e) {
    console.error(`Failed to analyze market data for ${pair}:`, e);
    throw e;
  }
}

export interface NewsHeadlineWithSentiment extends NewsHeadline {
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
}

export async function analyzeHeadlines(headlines: NewsHeadline[]): Promise<NewsHeadlineWithSentiment[]> {
  if (headlines.length === 0) return [];

  const prompt = `Analyze the sentiment and market impact of the following financial news headlines. 
  For each headline, provide:
  1. Sentiment (positive, negative, or neutral)
  2. Impact (high, medium, or low)
  
  Headlines:
  ${headlines.map((h, i) => `${i + 1}. ${h.title}`).join('\n')}
  
  Return the results as a JSON array of objects with "sentiment" and "impact" properties, in the same order as the input.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sentiment: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
              impact: { type: Type.STRING, enum: ["high", "medium", "low"] }
            },
            required: ["sentiment", "impact"]
          }
        }
      }
    });

    const analysis = JSON.parse(response.text || "[]");
    return headlines.map((h, i) => ({
      ...h,
      sentiment: analysis[i]?.sentiment || 'neutral',
      impact: analysis[i]?.impact || 'low'
    }));
  } catch (error) {
    console.error("Failed to analyze headlines:", error);
    return headlines.map(h => ({ ...h, sentiment: 'neutral', impact: 'low' }));
  }
}
