"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles, Loader2 } from "lucide-react";

export default function SexyChat({ roadmapId, userId, businessData }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messages = useQuery(api.messages.list, { roadmapId });
  const sendMessage = useMutation(api.messages.send);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, isTyping]);

  const handleChat = async () => {
    if (!input || isTyping) return;
    const msg = input; 
    setInput("");
    setIsTyping(true);

    try {
        // 1. Send user message to Convex
        await sendMessage({ roadmapId, userId, content: msg, role: "user" });

        // 2. Call AI API
        const response = await fetch("/api/chat", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg, roadmapId, userId, businessData }) 
        });

        if (!response.ok) throw new Error("AI failed to respond");

    } catch (err) {
        console.error("Chat error:", err);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-12 right-12 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[400px] h-[640px] bg-white border border-stone-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[3rem] flex flex-col overflow-hidden"
          >
            {/* HEADER */}
            <div className="p-8 pb-6 flex justify-between items-center bg-white border-b border-stone-50">
              <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-900">Vigyapan Concierge</span>
                    <span className="text-[8px] font-bold text-stone-400">Online & Ready to Execute</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all"
              >
                <X size={14}/>
              </button>
            </div>

            {/* MESSAGES AREA */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth bg-[#FDFDFF]">
              {messages?.map((m: any, i: number) => (
                <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[90%] leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-indigo-600 shadow-lg shadow-indigo-100 text-white px-6 py-4 rounded-3xl rounded-tr-none text-xs font-medium' 
                    : 'text-stone-700 text-[13px] font-medium whitespace-pre-line bg-white border border-stone-100 p-6 rounded-3xl rounded-tl-none shadow-sm'
                  }`}>
                    {m.role === 'assistant' ? (
                      <div className="space-y-4">
                        {m.content.split('\n').map((line: string, idx: number) => {
                          // Handle Bold
                          let content = line;
                          const boldRegex = /\*\*(.*?)\*\*/g;
                          
                          // Handle Bullet Points
                          if (line.trim().startsWith('-')) {
                            return (
                                <div key={idx} className="flex gap-3 pl-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    <span className="text-stone-600">{line.replace('-', '').trim()}</span>
                                </div>
                            );
                          }

                          // Handle Pro Tip
                          if (line.includes('PRO TIP')) {
                            return (
                                <div key={idx} className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 font-bold text-xs mt-4">
                                    {line}
                                </div>
                            );
                          }

                          // Handle Section Headers
                          if (line.includes('**')) {
                            return (
                                <h4 key={idx} className="text-stone-900 font-black uppercase text-[10px] tracking-[0.2em] pt-4 first:pt-0">
                                    {line.replaceAll('**', '')}
                                </h4>
                            );
                          }

                          return <p key={idx}>{line}</p>;
                        })}
                      </div>
                    ) : m.content}
                  </div>
                  <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mt-2 px-2">
                    {m.role === 'user' ? 'You' : 'Vigyapan AI'}
                  </span>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full w-fit">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Reasoning...</span>
                </motion.div>
              )}
            </div>

            {/* INPUT AREA */}
            <div className="p-8 pt-4 bg-white border-t border-stone-50">
               <div className="flex items-center gap-3 bg-stone-50 p-2 pl-6 rounded-[2rem] border border-stone-100 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all duration-300">
                  <input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="Ask bhaiya for marketing help..." 
                    className="flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-stone-300 py-3"
                  />
                  <button 
                    onClick={handleChat} 
                    disabled={isTyping}
                    className="bg-indigo-600 text-white p-4 rounded-3xl hover:bg-stone-900 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING TRIGGER */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative group group w-20 h-20 bg-stone-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-500 active:scale-95 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <AnimatePresence mode="wait">
            {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <X size={28} />
                </motion.div>
            ) : (
                <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="flex flex-col items-center">
                    <Sparkles size={28} />
                </motion.div>
            )}
        </AnimatePresence>
      </button>
    </div>
  );
}
