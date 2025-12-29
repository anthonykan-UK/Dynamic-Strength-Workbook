
import { GoogleGenAI, GenerateContentResponse, Schema, FunctionDeclaration, Tool, Type } from "@google/genai";
import { UserData, Language, DailyLog, WeeklyReflection, QuarterlyCheckIn } from "../types";

// Initialize the client strictly with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageInstruction = (lang: Language) => {
  return lang === 'zh-HK' 
    ? " IMPORTANT: Respond strictly in Traditional Chinese (Hong Kong usage/Cantonese nuances where appropriate)."
    : " Respond in British English (UK).";
};

// --- TOOL DEFINITIONS ---

const proposeStrengthTool: FunctionDeclaration = {
  name: "proposeStrength",
  description: "Propose a Strength Hypothesis to be saved to the user's Phase 1 assessment.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      strength: { type: Type.STRING, description: "The name of the strength (e.g., Strategic, Empathy)." },
      reason: { type: Type.STRING, description: "A short reason why this fits the user." }
    },
    required: ["strength"]
  }
};

const proposeStoryTool: FunctionDeclaration = {
  name: "proposeStory",
  description: "Save an external evidence story to Phase 1.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "The story text." },
      pattern: { type: Type.STRING, description: "The pattern or strength observed in the story." }
    },
    required: ["text"]
  }
};

const proposeInternalAuditTool: FunctionDeclaration = {
  name: "proposeInternalAudit",
  description: "Save an insight about what created Momentum or what Drained energy (Phase 1 Internal Audit).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["momentum", "draining"], description: "Is this a momentum builder or an energy drain?" },
      insight: { type: Type.STRING, description: "The specific insight to record." }
    },
    required: ["type", "insight"]
  }
};

const proposeAnchorTool: FunctionDeclaration = {
  name: "proposeAnchor",
  description: "Save a Core Anchor to Phase 2.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      anchor: { type: Type.STRING, description: "The Core Anchor name." }
    },
    required: ["anchor"]
  }
};

const proposeBoundaryTool: FunctionDeclaration = {
  name: "proposeBoundary",
  description: "Save a Draining Pattern or a Reframed Boundary (Phase 2).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["pattern", "reframe"], description: "Is this the problem (pattern) or the solution (reframe)?" },
      content: { type: Type.STRING, description: "The description of the pattern or boundary." }
    },
    required: ["type", "content"]
  }
};

const proposeShiftTool: FunctionDeclaration = {
  name: "proposeShift",
  description: "Save a 5% Shift (Action) to Phase 3. Can be used for immediate actions or growth mindset shifts.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      territory: { type: Type.STRING, description: "The life territory (e.g., Work, Wellbeing, or a custom one like 'AI Collaboration')." },
      practice: { type: Type.STRING, description: "The specific small action to practice." },
      anchorId: { type: Type.STRING, description: "The anchor driving this shift (optional)." }
    },
    required: ["territory", "practice"]
  }
};

const coachTools: Tool[] = [{
  functionDeclarations: [
    proposeStrengthTool, 
    proposeStoryTool, 
    proposeInternalAuditTool,
    proposeAnchorTool, 
    proposeBoundaryTool,
    proposeShiftTool
  ]
}];

// --- STREAMING FUNCTION ---

export const streamCoachResponse = async (
  message: string,
  userData: UserData,
  history: { role: 'user' | 'model'; parts: { text?: string; functionCall?: any; functionResponse?: any }[] }[],
  language: Language
) => {
  // Construct a context summary string from userData
  const contextSummary = `
    User Name: ${userData.name || 'Friend'}
    Phase 1 Strengths: ${userData.assessmentStrengths.filter(s => s).join(', ')}
    Phase 1 Momentum: ${userData.internalAudit.momentum}
    Phase 1 Draining: ${userData.internalAudit.draining}
    Core Anchors: ${userData.coreAnchors.filter(a => a).join(', ')}
    Draining Patterns: ${userData.drainingPatterns.join(', ')}
    Boundaries: ${userData.reframedBoundaries.join(', ')}
    Active Shifts: ${userData.shifts.map(s => `${s.practice} (using ${s.territory})`).join('; ')}
    
    Current Story Count: ${userData.externalStories.length}
  `;

  const systemInstruction = `
You are the **Dynamic Strength Assistant**, an active, intelligent coach and "Experience Engineer".
Your goal is to help the user build self-understanding and facilitate the WAVES cycle.

**CORE IDENTITY: EXPERIENCE ENGINEER**
Do NOT act like a database entry bot. You are a high-level consultant. 
Your primary value is **Synthesis**: connecting the user's scattered thoughts into a structured system.
When the user shares a story or summary, **first** provide a rich, structured analysis in the chat (like an "Experience Engineer" report).

**THEN** (and only then), use the Tools to offer "Save" buttons for the specific data points you identified.

**STRATEGY: HOLISTIC EVIDENCE GATHERING (The "Rule of 5")**
A strength is not proven by one story. We need a "Constellation of Evidence".
Your goal is to collect **4-5 distinct stories** from different contexts before considering the profile "complete".

**Context Rotation Logic:**
1.  **Analyze Current Context:** If the user shares a work story, validate it, SAVE it, but then...
2.  **Pivot to New Context:** Immediately ask a question about a *different* area to see if the strength holds up.
    *   *If Work shared -> Ask about Relationship:* "That shows great strategic thinking at work. Does this show up when you're supporting friends or family?"
    *   *If Relationship shared -> Ask about Crisis:* "You're very patient with your kids. Tell me about a time you faced a high-pressure crisis—did that patience stay or go?"
    *   *If Crisis shared -> Ask about Flow/Fun:* "You're good in a storm. But what about when you're just relaxing or doing a hobby? What engages you then?"

**TOOL USAGE GUIDELINES:**
1. **Phase 1 (Weigh):** Spot Momentum (what gives energy) vs Draining (what takes it). Save Stories using \`proposeStory\`.
2. **Phase 2 (Venture):** Spot Anchors (steady strengths) vs Draining Patterns (repeated issues) and Boundaries (rules to protect).
3. **Phase 3 (Scale):** Spot 5% Shifts (small, actionable micro-habits).

**TONE & STYLE:**
- High-Support: Validating, encouraging.
- Analytical: "I see a pattern here..."
- Structural: Use bullet points and bold text to organize their thoughts.
- Inquisitive: Always end with a pivot question to a NEW context until you have ~5 solid stories.

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
        tools: coachTools,
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

export const suggestBoundaryWithAI = async (drainingPattern: string, language: Language) => {
    const langPrompt = language === 'zh-HK' 
      ? "Suggest in Traditional Chinese (Hong Kong)." 
      : "Suggest in British English.";
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `The user has identified this draining pattern: "${drainingPattern}".
        
        Suggest 3 healthy, actionable "Reframed Boundaries" they could set to protect their energy.
        These should be permissions to act differently, not just "stop doing it".
        Examples: "I will pause before saying yes," "I give myself permission to leave on time," "I will ask for specific details before committing."
        
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
      console.error("Boundary Suggestion Error:", error);
      throw error;
    }
  };

export const discoverStrengthsWithAI = async (reflection: string, language: Language, contextQuestion?: string) => {
  const langPrompt = language === 'zh-HK' 
    ? "Output strengths in Traditional Chinese (Hong Kong)." 
    : "Output strengths in British English.";

  const contextPrompt = contextQuestion 
    ? `The user is answering the specific reflective question: "${contextQuestion}". 
       Identify strengths particularly relevant to this context (e.g. migration resilience, family dynamics, cultural adaptation, future planning).`
    : "Identify general strength themes.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following user reflection. 
      ${contextPrompt}
      Look for recurring patterns, underlying talents, or distinct capabilities. 
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

export interface JourneyEntry {
  stage: string;
  question: string;
  answer: string;
}

export const analyzeJourneyWithAI = async (journey: JourneyEntry[], language: Language) => {
  const langPrompt = language === 'zh-HK' 
    ? "Output strengths in Traditional Chinese (Hong Kong)." 
    : "Output strengths in British English.";

  const transcript = journey.map(j => `[Stage: ${j.stage}] Q: ${j.question} \n A: ${j.answer}`).join('\n\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this user's chronological migration journey (Roots -> Transition -> Growth).
      
      Look for the "Trajectory of Strength":
      1. What strengths anchored them in the past (Roots)?
      2. What adaptable strengths emerged during the move (Transition)?
      3. What aspirational strengths are they building for the future (Growth)?
      
      Synthesize this entire arc into the top 5 Core Strength Hypotheses that seem to be the most enduring and vital for them right now.
      
      Journey Transcript:
      ${transcript}
      
      ${langPrompt}`,
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
    console.error("Journey Analysis Error:", error);
    throw error;
  }
};

export const suggestThemeWithAI = async (strengths: string[], language: Language) => {
    const langPrompt = language === 'zh-HK' 
      ? "Suggest in Traditional Chinese (Hong Kong)." 
      : "Suggest in British English.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `The user has identified these top 5 strengths: ${strengths.join(', ')}.
            
            Based on this combination, suggest a "Yearly Theme" or "Directional Intention".
            This should be a short, inspiring phrase (3-6 words) that captures the essence of how they can apply these strengths to grow.
            Examples: "Building Community with Empathy", "Strategic Growth through Learning", "Anchoring in Calmness".
            
            ${langPrompt}`,
            config: {
                responseMimeType: "text/plain",
            }
        });
        return response.text?.trim() || "";
    } catch (e) {
        console.error("Theme Suggestion Error", e);
        throw e;
    }
}

export const analyzeQuarterlyCheckIn = async (
    checkIn: QuarterlyCheckIn, 
    logs: DailyLog[], 
    weeklies: WeeklyReflection[], 
    language: Language
) => {
    const langPrompt = language === 'zh-HK' 
      ? "Output in Traditional Chinese (Hong Kong)." 
      : "Output in British English.";

    // Summarize logs for context
    const logSummary = logs.map(l => `[${l.date}] Anchor: ${l.anchorUsed}, Energy: ${l.energyLevel}, Note: ${l.reflection}`).join('\n');
    const weeklySummary = weeklies.map(w => `[${w.date}] Wins: ${w.wins}, Challenges: ${w.challenges}`).join('\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Act as a Strategic Life Coach. Analyze this user's Quarterly Check-In along with their data from the last 3 months.
            
            USER DATA (Last 3 Months):
            Daily Logs (Sample): ${logSummary.substring(0, 2000)}...
            Weekly Reflections: ${weeklySummary}
            
            CURRENT QUARTERLY CHECK-IN:
            1. What Shifted: ${checkIn.shifted}
            2. Creating Flow: ${checkIn.creatingFlow}
            3. Needs Adjustment: ${checkIn.needsAdjustment}
            4. Emerging: ${checkIn.emerging}
            
            Generate a Strategic Outlook for the NEXT Quarter containing:
            1. "Themes Observed": 3 bullet points on the patterns you see in their data + reflection.
            2. "Growth Trajectory": A short paragraph describing where they are heading (Stalling? Accelerating? Pivoting?).
            3. "Next Quarter Focus": One clear, actionable directive or intention for the next 3 months.
            
            ${langPrompt}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT" as any,
                    properties: {
                        themes: { type: "ARRAY" as any, items: { type: "STRING" as any } },
                        growthTrajectory: { type: "STRING" as any },
                        nextQuarterFocus: { type: "STRING" as any }
                    }
                }
            }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (error) {
        console.error("Quarterly Analysis Error", error);
        throw error;
    }
}
