
import React, { useState, useRef, useEffect } from 'react';
import { Message, UserProfile } from '../types';
import { Send, Mic, ArrowLeft, MoreVertical, Phone, Video, Smile, Paperclip, Camera, Sparkles, Activity } from 'lucide-react';
import { sendMessageToGemini, initializeChat } from '../services/geminiService';
import { saveMessages } from '../services/storageService';
import { LANGUAGES } from '../constants';

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
  initialInput?: string;
  onProfileUpdate?: () => void;
  onBack: () => void;
  onOpenDashboard: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialMessages, userProfile, initialInput = '', onProfileUpdate, onBack, onOpenDashboard }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState(initialInput);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Chat
  useEffect(() => {
    initializeChat(messages, userProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Initialize input height if there is initial input
  useEffect(() => {
      if (initialInput && textareaRef.current) {
         textareaRef.current.style.height = 'auto';
         textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
  }, [initialInput]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        const langConfig = LANGUAGES.find(l => l.code === userProfile.language);
        recognitionRef.current.lang = langConfig ? langConfig.speechCode : 'en-IN';

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
  }, [userProfile.language]);

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

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
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
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

  const toggleRecording = () => {
    if (!recognitionRef.current) {
        alert("Voice input is not supported in this browser.");
        return;
    }

    if (isRecording) {
        recognitionRef.current.stop();
    } else {
        setIsRecording(true);
        recognitionRef.current.start();
    }
  };

  // Helper to format time for bubbles
  const formatTime = (date: Date) => {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex flex-col h-full bg-[#EFE7DE] relative">
      {/* WhatsApp Header */}
      <div className="bg-wa-teal p-2 flex items-center justify-between shadow-sm sticky top-0 z-20 text-white safe-top">
        <div className="flex items-center gap-1">
            <button onClick={onBack} className="p-1 rounded-full hover:bg-white/10">
                <ArrowLeft size={24} />
            </button>
            <button onClick={onOpenDashboard} className="flex items-center gap-2 hover:bg-white/10 p-1 rounded-lg transition-colors">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-lg border border-gray-100 overflow-hidden relative">
                    <span className="z-10">🌸</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-base leading-tight">Sakhi 🌸</span>
                    <span className="text-[11px] opacity-90 truncate w-24">Business Account</span>
                </div>
            </button>
        </div>
        <div className="flex items-center gap-4 pr-1">
            <Video size={22} className="opacity-90" />
            <Phone size={20} className="opacity-90" />
            <MoreVertical size={20} className="opacity-90" />
        </div>
      </div>

      {/* Chat Background & Messages */}
      <div className="flex-1 overflow-y-auto wa-doodle-bg p-3 relative">
        {/* Encryption Notice */}
        <div className="flex justify-center mb-4">
            <div className="bg-[#FFF5C4] text-[#5e5e5e] text-[10px] px-3 py-1.5 rounded-lg shadow-sm text-center max-w-[85%]">
                <p>Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.</p>
            </div>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex mb-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-2 px-3 text-[14.5px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative leading-[1.3] pb-4 min-w-[80px] ${
                msg.sender === 'user'
                  ? 'bg-wa-chat-out rounded-tr-none text-gray-900'
                  : 'bg-wa-chat-in rounded-tl-none text-gray-900'
              }`}
            >
              {msg.text}
              <span className="absolute bottom-1 right-2 text-[9px] text-gray-500 flex items-center gap-1">
                 {formatTime(msg.timestamp)}
                 {msg.sender === 'user' && (
                     <span className="text-blue-400">✓✓</span>
                 )}
              </span>
              
              {/* Triangle Tail */}
              {msg.sender === 'user' ? (
                  <div className="absolute top-0 -right-[8px] w-0 h-0 border-t-[0px] border-l-[10px] border-r-[0px] border-b-[10px] border-solid border-l-wa-chat-out border-b-transparent border-t-transparent filter drop-shadow-[1px_0_0_rgba(0,0,0,0.05)]"></div>
              ) : (
                  <div className="absolute top-0 -left-[8px] w-0 h-0 border-t-[0px] border-l-[0px] border-r-[10px] border-b-[10px] border-solid border-r-wa-chat-in border-b-transparent border-t-transparent filter drop-shadow-[-1px_0_0_rgba(0,0,0,0.05)]"></div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
            <div className="flex justify-start mb-2">
                <div className="bg-white rounded-lg p-3 rounded-tl-none shadow-sm flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#F0F2F5] px-2 py-1.5 flex items-end gap-2 safe-bottom z-20 sticky bottom-0">
         <div className="flex-1 bg-white rounded-[24px] flex items-end px-3 py-2 shadow-sm border border-gray-100 min-h-[44px]">
             <button className="text-gray-400 mr-2 hover:text-gray-600 mb-1">
                <Smile size={24} />
             </button>
             <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInputResize}
                onKeyDown={handleKeyPress}
                placeholder="Message"
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-700 placeholder:text-gray-400 resize-none max-h-[120px] py-1 leading-relaxed"
             />
             <div className="flex items-center gap-3 ml-2 mb-1">
                 <button className="text-gray-400 hover:text-gray-600">
                    <Paperclip size={20} className="rotate-45" />
                 </button>
                 <button onClick={onOpenDashboard} className="text-gray-400 hover:text-wa-teal transition-colors" title="Health Dashboard">
                    <Activity size={20} />
                 </button>
                 {!inputText && (
                     <button className="text-gray-400 hover:text-gray-600">
                        <Camera size={20} />
                     </button>
                 )}
             </div>
         </div>
         
         <button 
            onClick={inputText ? () => handleSend() : toggleRecording}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-sm transition-transform active:scale-95 mb-0.5 ${
                inputText || isRecording ? 'bg-wa-teal' : 'bg-wa-teal'
            }`}
         >
            {inputText ? <Send size={20} className="ml-0.5" /> : (
                isRecording ? <div className="w-3 h-3 bg-white rounded animate-pulse"></div> : <Mic size={20} />
            )}
         </button>
      </div>


    </div>
  );
};

export default ChatInterface;
