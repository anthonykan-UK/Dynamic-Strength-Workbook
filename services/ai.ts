import { GoogleGenAI, GenerateContentResponse, Schema } from "@google/genai";
import { UserData, Language, DailyLog } from "../types";

// Initialize the client strictly with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageInstruction = (lang: Language) => {
  return lang === 'zh-HK' 
    ? " IMPORTANT: Respond strictly in Traditional Chinese (Hong Kong usage/Cantonese nuances where appropriate)."
    : " Respond in British English (UK).";
};

// ... (Existing streamCoachResponse function remains the same, assuming it's here) ...

export const streamCoachResponse = async (
  message: string,
  userData: UserData,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  language: Language
) => {
  // Construct a context summary string from userData
  const contextSummary = `
    User Name: ${userData.name || 'Friend'}
    Phase 1 Strengths: ${userData.assessmentStrengths.filter(s => s).join(', ')}
    Core Anchors: ${userData.coreAnchors.filter(a => a).join(', ')}
    Active Shifts: ${userData.shifts.map(s => `${s.practice} (using ${s.territory})`).join('; ')}
  `;

  const systemInstruction = `
You are the **Dynamic Strength Assistant**, a non-judgmental, action-oriented coach. 
Your primary goal is to help the user build self-understanding, clarify their strengths, and create momentum through small, observable behavior shifts.

**Methodology:**
Follow the "Modified Strength Playbook Workbook" structure:
1. Phase 1: Externalize (Gather evidence)
2. Phase 2: Spotting & Boundary Check (Deconstruct stories, set anchors)
3. Phase 3: 5% Shift (Small daily practices)

**Guiding Principles:**
1. **Anchor in Evidence:** Always refer the user back to their external evidence (assessment results, peer stories).
2. **Focus on Direction:** Emphasize directional intentions and the 5% Shift over rigid goals.
3. **Action over Overthinking:** Prompt the user to move, test, and adjust ("Clarity comes from movement").
4. **Self-Reliance:** Remind the user they are the expert.

**Tone:** High-Support, Practical, Encouraging. Concise.
${getLanguageInstruction(language)}

**Current User Context:**
${contextSummary}
`;

  const modelId = 'gemini-3-flash-preview'; 

  try {
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history,
    });

    const result = await chat.sendMessageStream({
      message: message,
    });

    return result;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
};

/**
 * Generates a "Strength Spark" - immediate 1-sentence validation for a daily log.
 */
export const generateDailySpark = async (anchor: string, reflection: string, language: Language) => {
    const langPrompt = language === 'zh-HK' 
      ? "Output in Traditional Chinese (Hong Kong). Tone: Encouraging, concise, warm." 
      : "Output in British English. Tone: Encouraging, concise, warm.";
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `The user just logged a daily practice using the strength anchor "${anchor}".
        Their reflection: "${reflection}"
        
        Provide a "Strength Spark": A single, powerful sentence validating their effort or highlighting a nuance of that strength they demonstrated. 
        Do not ask questions. Just a statement of recognition.
        ${langPrompt}`,
        config: {
            responseMimeType: "text/plain",
        }
      });
      
      return response.text || "";
    } catch (error) {
      console.error("Spark Error:", error);
      return "";
    }
};

/**
 * Summarizes the last 7 days of logs to pre-fill the Weekly Review.
 */
export const summarizeWeek = async (logs: DailyLog[], language: Language) => {
    const langPrompt = language === 'zh-HK' 
      ? "Output in Traditional Chinese (Hong Kong)." 
      : "Output in British English.";
    
    const logsText = logs.map(l => `[${l.anchorUsed}]: ${l.reflection} (Energy: ${l.energyLevel}/5)`).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these 7 days of strength logs:
        ${logsText}
        
        Generate a JSON object with:
        1. "wins": What created momentum? (Summarize patterns of high energy/success)
        2. "challenges": What needs adjustment? (Note any low energy or struggle)
        3. "theme": A creative 2-3 word title for this week (e.g. "Week of Resilience").
        
        ${langPrompt}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT" as any,
            properties: {
              wins: { type: "STRING" as any },
              challenges: { type: "STRING" as any },
              theme: { type: "STRING" as any }
            }
          }
        }
      });
  
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Weekly Summary Error:", error);
      throw error;
    }
};

// ... (Existing analyzeStoryWithAI, suggestShiftsWithAI, discoverStrengthsWithAI remain) ...

export const analyzeStoryWithAI = async (storyText: string, language: Language) => {
  const langPrompt = language === 'zh-HK' 
    ? "Output the values in Traditional Chinese (Hong Kong)." 
    : "Output the values in British English.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following story about a person's strength. 
      Deconstruct it into three parts:
      1. Action: What specific action did they take?
      2. Feeling: What was the likely emotional state or energy?
      3. Pattern: What is the underlying strength or talent at play?
      
      ${langPrompt}
      
      Story: "${storyText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT" as any,
          properties: {
            action: { type: "STRING" as any },
            feeling: { type: "STRING" as any },
            pattern: { type: "STRING" as any },
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const suggestShiftsWithAI = async (territory: string, anchor: string, language: Language) => {
  const langPrompt = language === 'zh-HK' 
    ? "Suggest in Traditional Chinese (Hong Kong)." 
    : "Suggest in British English.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I want to apply my strength "${anchor}" in the area of "${territory}".
      Suggest 3 very small, concrete, observable "5% shift" practices.
      These should be micro-actions, not big goals. Keep them concise (under 15 words).
      ${langPrompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT" as any,
          properties: {
            suggestions: {
              type: "ARRAY" as any,
              items: { type: "STRING" as any }
            }
          }
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    return data.suggestions || [];
  } catch (error) {
    console.error("Suggestion Error:", error);
    throw error;
  }
};

export const discoverStrengthsWithAI = async (reflection: string, language: Language) => {
  const langPrompt = language === 'zh-HK' 
    ? "Output strengths in Traditional Chinese (Hong Kong)." 
    : "Output strengths in British English.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following user notes, which may describe multiple different situations (work, personal life, challenges, wins). 
      Look for recurring patterns, underlying talents, or distinct capabilities across these stories. 
      Identify the top 5 likely strength themes (single words or short phrases) that appear to be driving their success or flow state.
      ${langPrompt}
      
      Reflection Notes: "${reflection}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT" as any,
          properties: {
            strengths: {
              type: "ARRAY" as any,
              items: { type: "STRING" as any }
            }
          }
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    return data.strengths || [];
  } catch (error) {
    console.error("Discovery Error:", error);
    throw error;
  }
};