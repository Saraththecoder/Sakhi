import { GoogleGenAI, Chat, FunctionDeclaration, Type, GenerateContentResponse, Part, Content } from "@google/genai";
import { SAKHI_SYSTEM_INSTRUCTION } from "../constants";
import { UserProfile, Message } from "../types";
import { addPeriodDate, logSymptom } from "./storageService";

let chatSession: Chat | null = null;
let currentUserProfile: UserProfile | null = null;

// --- Helper to safely retrieve API Key from various environments ---
const getApiKey = (): string | undefined => {
  // 1. Try standard process.env (Node/Webpack/CRA)
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.API_KEY) return process.env.API_KEY;
      if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
      if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    }
  } catch (e) {
    // process might not be defined in strict browser environments
  }

  // 2. Try import.meta.env (Vite/Modern Bundlers)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
      // @ts-ignore
      if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // import.meta might not be supported
  }

  return undefined;
};

// --- Tool Definitions ---
const updatePeriodTool: FunctionDeclaration = {
  name: 'updatePeriodDate',
  description: 'Update the user\'s period start date when they report their period has started.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: 'The start date of the period in YYYY-MM-DD format. If user says "today", use today\'s date.',
      },
    },
    required: ['date'],
  },
};

const logSymptomTool: FunctionDeclaration = {
  name: 'logSymptom',
  description: 'Log a health symptom reported by the user (e.g., headache, cramps, bloating).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      symptomName: {
        type: Type.STRING,
        description: 'The specific name of the symptom (e.g., "Cramps", "Headache", "Fatigue").',
      },
    },
    required: ['symptomName'],
  },
};

const buildSystemContext = (profile: UserProfile) => {
    // Format recent symptoms for context
    const recentSymptoms = profile.symptomHistory 
        ? profile.symptomHistory.slice(0, 5).map(s => `${s.symptom} (Day ${s.cycleDay || '?'})`).join(', ') 
        : 'None logged yet';

    return `
    ${SAKHI_SYSTEM_INSTRUCTION}
    
    CURRENT USER CONTEXT:
    - Language Preference: ${profile.language || 'English'} (Reply in this language, using appropriate script or Hinglish/Code-mixed style for Indian languages if that is natural for chat).
    - Last Period Date: ${profile.lastPeriodDate}
    - Cycle Length: ${profile.cycleLength} days
    - Diet: ${profile.dietPreference}
    - Recent Symptoms: ${recentSymptoms}
    - Today's Date: ${new Date().toLocaleDateString('en-IN')}
    
    If the user reports a symptom, acknowledge it, give advice, and assume I will log it for them using the tool.
    If the user says "voice message" or similar, keep your response concise.
  `;
};

export const initializeChat = async (history: Message[], userProfile: UserProfile) => {
  const apiKey = getApiKey();
  if (!apiKey) {
      console.warn("API Key missing during initialization. Chat will fail if attempted.");
      return;
  }

  currentUserProfile = userProfile;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const validHistory = history.filter(h => h.text && h.text.trim() !== '');
    
    const geminiHistory: Content[] = validHistory.slice(-15).map(msg => ({
      role: msg.sender === 'sakhi' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const systemContext = buildSystemContext(userProfile);

    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: geminiHistory,
      config: {
        systemInstruction: systemContext,
        tools: [{ functionDeclarations: [updatePeriodTool, logSymptomTool] }],
      },
    });
  } catch (error) {
    console.error("Failed to initialize chat session:", error);
    try {
        chatSession = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: buildSystemContext(userProfile),
                tools: [{ functionDeclarations: [updatePeriodTool, logSymptomTool] }],
            }
        });
    } catch (e) {
        console.error("Critical error creating chat session", e);
    }
  }
};

export const sendMessageToGemini = async (text: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "Configuration Error: API Key is missing. If you are using Vite, try naming it 'VITE_API_KEY' in your .env file.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Auto-recover session if missing
  if (!chatSession) {
    const context = currentUserProfile 
        ? buildSystemContext(currentUserProfile) 
        : SAKHI_SYSTEM_INSTRUCTION;

    try {
        chatSession = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { 
              systemInstruction: context,
              tools: [{ functionDeclarations: [updatePeriodTool, logSymptomTool] }]
            }
        });
    } catch (e) {
        console.error("Failed to create chat session during sendMessage", e);
        return "I'm having trouble starting our conversation. Please try refreshing the page.";
    }
  }

  try {
    let response: GenerateContentResponse = await chatSession.sendMessage({ message: text });
    
    // Handle Function Calls (Loop for chained tools)
    let functionCalls = response.functionCalls;
    
    while (functionCalls && functionCalls.length > 0) {
      const parts: Part[] = [];
      
      for (const call of functionCalls) {
        let functionResult: any = {};
        
        try {
            if (call.name === 'updatePeriodDate') {
               const args = call.args as { date: string };
               console.log("Executing tool updatePeriodDate with", args);
               addPeriodDate(args.date);
               functionResult = { result: "Period date updated successfully. Cycle length recalculated." };
            } else if (call.name === 'logSymptom') {
               const args = call.args as { symptomName: string };
               console.log("Executing tool logSymptom with", args);
               logSymptom(args.symptomName);
               functionResult = { result: `Symptom '${args.symptomName}' logged successfully for today.` };
            } else {
               functionResult = { error: `Function ${call.name} not found` };
            }
        } catch (err: any) {
             console.error(`Error executing ${call.name}:`, err);
             functionResult = { error: err.message };
        }

        parts.push({
             functionResponse: {
               name: call.name,
               id: call.id,
               response: functionResult
             }
        });
      }

      if (parts.length > 0) {
         response = await chatSession.sendMessage({ message: parts });
         functionCalls = response.functionCalls;
      } else {
         break;
      }
    }

    return response.text || "I processed that, but I'm not sure what to say. 🌸";
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    const errStr = String(error);
    if (errStr.includes("429") || errStr.includes("quota")) {
        return "I'm a bit overwhelmed right now (Quota Limit). Please try again in a minute! ⏳";
    }
    
    chatSession = null; 
    return "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again. 💙";
  }
};