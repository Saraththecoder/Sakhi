import React, { useState, useRef, useEffect } from 'react';
import { Message, UserProfile } from '../types';
import { Send, Mic, Sparkles, StopCircle, ChevronLeft, Calendar, X } from 'lucide-react';
import { sendMessageToGemini, initializeChat } from '../services/geminiService';
import { saveMessages } from '../services/storageService';

// --- Type Definitions for Web Speech API ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}
// -------------------------------------------

interface ChatInterfaceProps {
  initialMessages: Message[];
  userProfile: UserProfile;
  onProfileUpdate?: () => void;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialMessages, userProfile, onProfileUpdate, onBack }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Calculate days since last period for prompt logic
  const lastDate = new Date(userProfile.lastPeriodDate);
  const today = new Date();
  lastDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  const diffTime = today.getTime() - lastDate.getTime();
  const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentCycleDay = daysSince + 1;

  useEffect(() => {
    scrollToBottom();
  }, [messages, showLogPrompt]);

  // Initialize Chat
  useEffect(() => {
    initializeChat(messages, userProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Check if we should show period prompt
  useEffect(() => {
    // Show prompt if we are within 2 days of cycle end or overdue
    if (currentCycleDay >= userProfile.cycleLength - 2) {
        setShowLogPrompt(true);
    } else {
        setShowLogPrompt(false);
    }
  }, [userProfile.lastPeriodDate, userProfile.cycleLength, currentCycleDay]);

  // Reset textarea height when input clears
  useEffect(() => {
      if (inputText === '' && textareaRef.current) {
          textareaRef.current.style.height = 'auto';
      }
  }, [inputText]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-IN'; // Indian English for better accent recognition

        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputText((prev) => prev ? prev + " " + transcript : transcript);
            setIsRecording(false);
            // Trigger auto-resize after voice input
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
                }
            }, 0);
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };
    }
  }, []);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(textToSend);
      
      const sakhiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'sakhi',
        timestamp: new Date()
      };
      
      const updatedMessages = [...newMessages, sakhiMsg];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
      
      if (onProfileUpdate) onProfileUpdate();

    } catch (error) {
      console.error("Failed to send", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (text: string) => {
      handleSend(text);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
        alert("Voice input is not supported in this browser. Please try Chrome or Safari.");
        return;
    }

    if (isRecording) {
        recognitionRef.current.stop();
    } else {
        setIsRecording(true);
        recognitionRef.current.start();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative z-30">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b flex items-center gap-3 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="w-10 h-10 bg-sakhi-100 rounded-full flex items-center justify-center text-lg shadow-sm border border-sakhi-200">
            🌸
        </div>
        <div>
            <h2 className="font-bold text-gray-800">Sakhi</h2>
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-xs text-green-600 font-medium">Online</p>
            </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-sakhi-100 mb-2">
                    <Sparkles size={32} className="text-sakhi-400" />
                </div>
                <p className="font-medium text-gray-500">Ask me anything about your health!</p>
                <div className="flex gap-2 mt-4 flex-wrap justify-center px-4">
                    <button 
                        onClick={() => handleQuickAction("What should I eat today?")} 
                        className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-sakhi-50 hover:border-sakhi-200 hover:text-sakhi-600 transition-all shadow-sm"
                    >
                        🥗 Diet Tips
                    </button>
                    <button 
                        onClick={() => handleQuickAction("I have cramps, what should I do?")} 
                        className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-sakhi-50 hover:border-sakhi-200 hover:text-sakhi-600 transition-all shadow-sm"
                    >
                        💊 Pain Relief
                    </button>
                    <button 
                        onClick={() => handleQuickAction("My period started today")} 
                        className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-sakhi-50 hover:border-sakhi-200 hover:text-sakhi-600 transition-all shadow-sm"
                    >
                        📅 Log Period
                    </button>
                </div>
            </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 px-4 text-[15px] shadow-sm whitespace-pre-wrap leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-sakhi-500 text-white rounded-br-none shadow-sakhi-200'
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-4 rounded-bl-none border border-gray-100 flex gap-1.5 items-center shadow-sm">
              <span className="w-1.5 h-1.5 bg-sakhi-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-sakhi-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-1.5 h-1.5 bg-sakhi-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area & Prompts */}
      <div className="bg-white border-t border-gray-100 safe-bottom relative shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] z-20">
        {/* Period Prompt Banner */}
        {showLogPrompt && (
            <div className="absolute bottom-full left-0 w-full px-4 pb-2 bg-gradient-to-t from-gray-50 to-transparent pt-4">
                <div className="bg-white border border-sakhi-200 rounded-xl shadow-lg p-3 flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in duration-300">
                     <div className="flex items-center gap-3">
                        <div className="bg-sakhi-50 p-2 rounded-full text-sakhi-500">
                             <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">Period due soon?</p>
                            <p className="text-[10px] text-gray-500">Cycle Day {currentCycleDay}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                         <button 
                            onClick={() => setShowLogPrompt(false)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                         >
                            <X size={16} />
                         </button>
                         <button 
                            onClick={() => {
                                handleQuickAction("My period started today");
                                setShowLogPrompt(false);
                            }}
                            className="bg-sakhi-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm active:scale-95 transition-transform hover:bg-sakhi-600"
                         >
                            Yes, Log Today
                         </button>
                     </div>
                </div>
            </div>
        )}

        <div className="p-3 sm:p-4 pb-6">
            <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-[26px] p-1.5 focus-within:ring-2 focus-within:ring-sakhi-100 focus-within:border-sakhi-300 transition-all">
                <button 
                    onClick={toggleRecording}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 flex-shrink-0 ${
                        isRecording 
                        ? 'bg-red-500 text-white shadow-md animate-pulse' 
                        : 'text-gray-400 hover:text-sakhi-600 hover:bg-white hover:shadow-sm'
                    }`}
                    title="Voice Input"
                >
                    {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                </button>
                
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputResize}
                    onKeyDown={handleKeyPress}
                    placeholder={isRecording ? "Listening..." : "Message Sakhi..."}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] py-2.5 px-1 resize-none text-gray-700 placeholder:text-gray-400 max-h-[120px] min-h-[44px] leading-normal"
                    rows={1}
                />

                <button 
                    onClick={() => handleSend()}
                    disabled={!inputText.trim() || isLoading}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 flex-shrink-0 ${
                        inputText.trim() 
                            ? 'bg-sakhi-500 text-white shadow-md hover:bg-sakhi-600 hover:scale-105 active:scale-95' 
                            : 'bg-gray-200 text-gray-400 cursor-default'
                    }`}
                >
                    <Send size={18} className={inputText.trim() ? "ml-0.5" : ""} />
                </button>
            </div>
            {isRecording && (
                <p className="text-[10px] text-center text-red-500 mt-2 animate-pulse font-medium">
                    Listening... tap microphone to stop
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;