import { GoogleGenAI, GenerateContentResponse, Schema } from "@google/genai";
import { UserData } from "../types";

// Initialize the client strictly with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_TEMPLATE = `
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

**Current User Context:**
{{USER_CONTEXT}}
`;

export const streamCoachResponse = async (
  message: string,
  userData: UserData,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) => {
  // Construct a context summary string from userData
  const contextSummary = `
    User Name: ${userData.name || 'Friend'}
    Phase 1 Strengths: ${userData.assessmentStrengths.filter(s => s).join(', ')}
    Core Anchors: ${userData.coreAnchors.filter(a => a).join(', ')}
    Active Shifts: ${userData.shifts.map(s => `${s.practice} (using ${s.territory})`).join('; ')}
  `;

  const systemInstruction = SYSTEM_INSTRUCTION_TEMPLATE.replace('{{USER_CONTEXT}}', contextSummary);

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
 * Analyzes a verbatim story to extract Action, Feeling, and Pattern.
 */
export const analyzeStoryWithAI = async (storyText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following story about a person's strength. 
      Deconstruct it into three parts:
      1. Action: What specific action did they take?
      2. Feeling: What was the likely emotional state or energy?
      3. Pattern: What is the underlying strength or talent at play?
      
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

/**
 * Suggests 5% Shift practices based on territory and anchor.
 */
export const suggestShiftsWithAI = async (territory: string, anchor: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I want to apply my strength "${anchor}" in the area of "${territory}".
      Suggest 3 very small, concrete, observable "5% shift" practices.
      These should be micro-actions, not big goals. Keep them concise (under 15 words).`,
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