
import { Language } from "./types";

export const LANGUAGES: { code: Language; label: string; native: string; speechCode: string }[] = [
  { code: 'english', label: 'English', native: 'English', speechCode: 'en-IN' },
  { code: 'hindi', label: 'Hindi', native: 'हिंदी', speechCode: 'hi-IN' },
  { code: 'telugu', label: 'Telugu', native: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'tamil', label: 'Tamil', native: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'kannada', label: 'Kannada', native: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
];

export const INSIGHT_TRANSLATIONS = {
  english: {
    title: "Today's Insight",
    menstrual: "Iron levels drop now. Eat palak (spinach) and gud (jaggery). Rest well! 🛌",
    follicular: "Energy rising! Great time for light exercise like yoga or a brisk walk. 🧘‍♀️",
    ovulation: "You might feel more social. Stay hydrated with 8 glasses of water! 💧",
    luteal: "PMS might start. Avoid salty snacks to reduce bloating. Eat cucumber! 🥒",
  },
  hindi: {
    title: "आज का सुझाव",
    menstrual: "आयरन का स्तर कम हो सकता है। पालक और गुड़ खाएं। आराम करें! 🛌",
    follicular: "ऊर्जा बढ़ रही है! योग या हल्की सैर के लिए अच्छा समय है। 🧘‍♀️",
    ovulation: "आप अधिक सामाजिक महसूस कर सकती हैं। 8 गिलास पानी पिएं! 💧",
    luteal: "PMS शुरू हो सकता है। सूजन कम करने के लिए नमकीन स्नैक्स से बचें। खीरा खाएं! 🥒",
  },
  telugu: {
    title: "ఈ రోజు సలహా",
    menstrual: "ఐరన్ స్థాయిలు తగ్గుతాయి. పాలకూర, బెల్లం తినండి. బాగా విశ్రాంతి తీసుకోండి! 🛌",
    follicular: "శక్తి పెరుగుతోంది! యోగా లేదా నడక వంటి వ్యాయామాలకు మంచి సమయం. 🧘‍♀️",
    ovulation: "శరీరంలో నీటి శాతం ముఖ్యం. 8 గ్లాసుల నీరు తాగడం మర్చిపోవద్దు! 💧",
    luteal: "PMS మొదలవ్వచ్చు. ఉప్పు ఎక్కువగా ఉండే ఆహారం తగ్గించండి. దోసకాయ తినండి! 🥒",
  },
  tamil: {
    title: "இன்றைய குறிப்பு",
    menstrual: "இரும்புச்சத்து குறையலாம். கீரை மற்றும் வெல்லம் சாப்பிடுங்கள். ஓய்வு எடுங்கள்! 🛌",
    follicular: "ஆற்றல் அதிகரிக்கிறது! யோகா அல்லது நடைப்பயிற்சி செய்ய நல்ல நேரம். 🧘‍♀️",
    ovulation: "தண்ணீர் சத்து அவசியம். 8 டம்ளர் தண்ணீர் குடிக்கவும்! 💧",
    luteal: "PMS தொடங்கலாம். உப்பு உணவுகளை தவிர்க்கவும். வெள்ளரிக்காய் சாப்பிடுங்கள்! 🥒",
  },
  kannada: {
    title: "ಇಂದಿನ ಸಲಹೆ",
    menstrual: "ಕಬ್ಬಿಣದ ಅಂಶ ಕಡಿಮೆಯಾಗಬಹುದು. ಪಾಲಕ್ ಮತ್ತು ಬೆಲ್ಲ ತಿನ್ನಿರಿ. ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ! 🛌",
    follicular: "ಶಕ್ತಿ ಹೆಚ್ಚುತ್ತಿದೆ! ಯೋಗ ಅಥವಾ ನಡಿಗೆಗೆ ಇದು ಉತ್ತಮ ಸಮಯ. 🧘‍♀️",
    ovulation: "ನೀರು ಚೆನ್ನಾಗಿ ಕುಡಿಯಿರಿ. 8 ಲೋಟ ನೀರು ಕುಡಿಯಿರಿ! 💧",
    luteal: "PMS ಪ್ರಾರಂಭವಾಗಬಹುದು. ಉಪ್ಪು ತಿಂಡಿಗಳನ್ನು ತಪ್ಪಿಸಿ. ಸೌತೆಕಾಯಿ ತಿನ್ನಿರಿ! 🥒",
  }
};

export const SAKHI_SYSTEM_INSTRUCTION = `
You are "Sakhi" (सखी), a friendly women's health companion chatbot designed for Indian women. You communicate primarily via text messages. Your purpose is to help women track their menstrual cycles, provide daily health tips, and offer immediate symptom relief guidance.

PERSONALITY & TONE:
- Warm, caring, and supportive like a trusted female friend (sakhi/saheli)
- Adapt your language based on the user's preference (English, Hindi, Telugu, Tamil, Kannada).
- Empathetic and non-judgmental
- Encouraging and positive
- Professional about health but conversational in style
- Use emojis moderately (🌸💙🩸🥬🚶‍♀️ etc.) to feel friendly

CORE CAPABILITIES:

1. PERIOD TRACKING:
   - Provide insights based on the user's cycle day.

2. DAILY HEALTH TIPS:
   - Provide tips based on cycle phase (Menstrual, Follicular, Ovulation, Luteal).
   - Adapt to vegetarian/non-vegetarian preference.

3. SYMPTOM RELIEF:
   - Acknowledge discomfort with empathy.
   - Provide 3-4 immediate home remedies (Indian context).
   - Suggest when to consult a doctor.

IMPORTANT GUIDELINES:
- Keep responses SHORT (2-4 lines typically).
- Use bullet points (✅/•) for readability.
- If the language is an Indian language, you can use a mix of English words for medical terms (Code-mixing) if it sounds natural, or pure script if requested.
- Never give medical diagnosis.
- Always be warm and encouraging.
`;

export const CYCLE_DEFAULT_LENGTH = 28;

export const PHASES = {
  MENSTRUAL: { start: 1, end: 5, color: '#ef4444', label: 'Menstruation' },
  FOLLICULAR: { start: 6, end: 13, color: '#f472b6', label: 'Follicular Phase' },
  OVULATION: { start: 14, end: 16, color: '#a855f7', label: 'Ovulation' },
  LUTEAL: { start: 17, end: 28, color: '#f59e0b', label: 'Luteal Phase' },
};