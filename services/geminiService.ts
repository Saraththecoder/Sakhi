import { GoogleGenAI, Type, FunctionDeclaration, Content, Part, GenerateContentResponse, Chat } from "@google/genai";
import { SAKHI_SYSTEM_INSTRUCTION } from "../constants";
import { UserProfile, Message } from "../types";
import { addPeriodDate, logSymptom } from "./storageService";

const API_KEY = process.env.API_KEY;

// Using Gemini 2.0 Flash for speed and tool capabilities
const MODEL_NAME = "gemini-2.0-flash";

let chatSession: Chat | null = null;
let currentUserProfile: UserProfile | null = null;

// --- Tool Definitions ---

const updatePeriodDateTool: FunctionDeclaration = {
  name: "updatePeriodDate",
  description: "Update the user's period start date when they report their period has started.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: "The start date of the period in YYYY-MM-DD format. If user says 'today', use today's date.",
      },
    },
    required: ["date"],
  },
};

const logSymptomTool: FunctionDeclaration = {
  name: "logSymptom",
  description: "Log a health symptom reported by the user (e.g., headache, cramps, bloating).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symptomName: {
        type: Type.STRING,
        description: "The specific name of the symptom (e.g., 'Cramps', 'Headache', 'Fatigue').",
      },
    },
    required: ["symptomName"],
  },
};

// --- Helper Functions ---

const buildSystemContext = (profile: UserProfile): string => {
  const recentSymptoms = profile.symptomHistory
    ? profile.symptomHistory.slice(0, 5).map((s) => `${s.symptom} (Day ${s.cycleDay || "?"})`).join(", ")
    : "None logged yet";

  return `
    ${SAKHI_SYSTEM_INSTRUCTION}
    
    CURRENT USER CONTEXT:
    - Language Preference: ${profile.language || "English"} (Reply in this language, using appropriate script or Hinglish/Code-mixed style for Indian languages if that is natural for chat).
    - Last Period Date: ${profile.lastPeriodDate}
    - Cycle Length: ${profile.cycleLength} days
    - Diet: ${profile.dietPreference}
    - Recent Symptoms: ${recentSymptoms}
    - Today's Date: ${new Date().toLocaleDateString("en-IN")}
    
    If the user reports a symptom, acknowledge it, give advice, and assume I will log it for them using the tool.
  `;
};

/**
 * Initializes or resets the Gemini Chat session.
 * call this when the component mounts or when profile changes.
 */
export const initializeChat = async (history: Message[], userProfile: UserProfile) => {
  if (!API_KEY) {
    console.error("API Key is missing");
    return;
  }

  currentUserProfile = userProfile;
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = buildSystemContext(userProfile);

  // Convert app's internal message format to Gemini's Content format
  const geminiHistory: Content[] = history.map(msg => ({
      role: msg.sender === 'sakhi' ? 'model' : 'user',
      parts: [{ text: msg.text }]
  }));

  try {
    chatSession = ai.chats.create({
      model: MODEL_NAME,
      history: geminiHistory,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [updatePeriodDateTool, logSymptomTool] }]
      }
    });
  } catch (error) {
    console.error("Failed to initialize chat session", error);
  }
};

/**
 * Sends a message to Gemini and handles any tool calls (Function Calling).
 */
export const sendMessageToGemini = async (text: string): Promise<string> => {
  if (!API_KEY) {
    return "Configuration Error: API Key is missing. Please ensure process.env.API_KEY is set.";
  }

  // Auto-initialize if session was lost (e.g. hot reload), though initializeChat should be called by UI
  if (!chatSession && currentUserProfile) {
     // We might lack history here if not explicitly passed, but we can try to recover or fail gracefully
     // Ideally initializeChat is called before this.
     return "Chat session expired. Please refresh the page. 🌸";
  }
  
  if (!chatSession) {
      return "I'm warming up! Please wait a moment...";
  }

  try {
    let response: GenerateContentResponse = await chatSession.sendMessage({ 
        message: text 
    });

    // Loop to handle potential multiple function calls
    // The model might want to call a function, get the result, and then reply.
    while (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponseParts: Part[] = [];

        for (const call of response.functionCalls) {
            const name = call.name;
            const args = call.args as any;
            let result: any = { status: "ok" };
            
            console.log(`[Sakhi] Calling tool: ${name}`, args);

            if (name === "updatePeriodDate") {
                addPeriodDate(args.date);
                result = { message: "Period date updated successfully." };
            } else if (name === "logSymptom") {
                logSymptom(args.symptomName);
                result = { message: `Symptom '${args.symptomName}' logged successfully.` };
            } else {
                result = { error: "Function not found" };
            }

            // Construct the response part to send back to the model
            functionResponseParts.push({
                functionResponse: {
                    name: name,
                    response: result,
                    id: call.id // Pass back the ID if provided to match the call
                }
            });
        }
        
        // Send the function execution results back to the model
        // The model will then generate a text response incorporating this info
        response = await chatSession.sendMessage({ 
            message: functionResponseParts 
        });
    }

    return response.text || "I heard you, but I'm not sure what to say. 🌸";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I'm having trouble connecting to the cloud right now. Please check your internet connection. 💙";
  }
};