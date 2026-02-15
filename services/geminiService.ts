import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { SAKHI_SYSTEM_INSTRUCTION } from "../constants";
import { UserProfile, Message } from "../types";
import { addPeriodDate, logSymptom } from "./storageService";

// Use the provided API key by default, allow override via environment variable
const DEFAULT_API_KEY = "AIzaSyDveSfzNqkIkFp-m1zrlXi4O80c6DCxlZU";
let apiKey = DEFAULT_API_KEY;

// Safe access to process.env.API_KEY
if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
  apiKey = process.env.API_KEY;
}

if (!apiKey) {
    console.warn("API Key not found. Chat will be disabled.");
}

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;
let currentUserProfile: UserProfile | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// Tool Definitions
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
  if (!ai) return;
  currentUserProfile = userProfile;

  try {
    // Transform internal message format to Gemini format
    // Filter out potential bad states (e.g. empty text)
    const validHistory = history.filter(h => h.text && h.text.trim() !== '');
    
    const recentHistory = validHistory.slice(-15).map(msg => ({
      role: msg.sender === 'sakhi' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const systemContext = buildSystemContext(userProfile);

    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: recentHistory,
      config: {
        systemInstruction: systemContext,
        temperature: 0.7,
        tools: [{ functionDeclarations: [updatePeriodTool, logSymptomTool] }],
      },
    });
  } catch (error) {
    console.error("Failed to initialize chat session:", error);
    // Fallback: Try creating session without history if history was corrupt
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
  if (!ai) return "Configuration Error: API Key is missing or invalid.";

  // Auto-recover session if missing
  if (!chatSession) {
    const context = currentUserProfile 
        ? buildSystemContext(currentUserProfile) 
        : SAKHI_SYSTEM_INSTRUCTION;

    chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { 
          systemInstruction: context,
          tools: [{ functionDeclarations: [updatePeriodTool, logSymptomTool] }]
        }
    });
  }

  try {
    let response = await chatSession.sendMessage({ message: text });
    
    // Handle Function Calls
    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const parts = [];
      
      for (const call of functionCalls) {
        if (call.name === 'updatePeriodDate') {
           const args = call.args as { date: string };
           console.log("Executing tool updatePeriodDate with", args);
           
           addPeriodDate(args.date);
           
           parts.push({
             functionResponse: {
               name: call.name,
               id: call.id,
               response: { result: "Period date updated successfully. Cycle length recalculated." }
             }
           });
        } else if (call.name === 'logSymptom') {
           const args = call.args as { symptomName: string };
           console.log("Executing tool logSymptom with", args);
           
           logSymptom(args.symptomName);

           parts.push({
             functionResponse: {
               name: call.name,
               id: call.id,
               response: { result: `Symptom '${args.symptomName}' logged successfully for today.` }
             }
           });
        }
      }

      if (parts.length > 0) {
         // Send the function execution result back to the model
         response = await chatSession.sendMessage({
           message: parts
         });
      }
    }

    return response.text || "I processed that, but I'm not sure what to say. 🌸";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Reset session on fatal error to prevent stuck state
    chatSession = null; 
    return "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again. 💙";
  }
};