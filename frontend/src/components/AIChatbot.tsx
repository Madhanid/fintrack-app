"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, MessageSquare, Sparkles, TrendingDown } from 'lucide-react';
import axios from 'axios';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/ai/chat');
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch chat history", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg = { role: 'user', content: inputValue, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: userMsg.content });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.response, timestamp: new Date().toISOString() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to my brain right now.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-[400px] h-[600px] glass-card border-neonPink/30 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-neonPink/20 to-accentPink/20 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neonPink/20 flex items-center justify-center text-neonPink">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white leading-none">FinTrack AI</h3>
                  <span className="text-[10px] text-neonPink font-bold uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={8} /> Financial Assistant
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
              {messages.length === 0 && !isTyping && (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-4 border border-white/5">
                    <MessageSquare size={32} />
                  </div>
                  <h4 className="font-bold text-gray-200 mb-2">How can I help you?</h4>
                  <p className="text-xs text-gray-500">Ask me to analyze your spending or for advice on how to save money.</p>
                  
                  <div className="grid grid-cols-1 gap-2 mt-6 w-full">
                    <button 
                      onClick={() => { setInputValue('Analyze my spending'); }}
                      className="text-left p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-400 hover:border-neonPink/30 transition-all flex items-center justify-between group"
                    >
                      Analyze my spending
                      <TrendingDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-neonPink text-white rounded-tr-none' 
                      : 'bg-white/10 text-gray-200 border border-white/10 rounded-tl-none'
                  }`}>
                    {msg.content}
                    <p className="text-[8px] opacity-50 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none border border-white/10 flex gap-1">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/40">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-neonPink outline-none transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="p-2.5 bg-neonPink hover:bg-accentPink text-white rounded-xl transition-all shadow-lg shadow-neonPink/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-matteBlack border border-white/10 text-neonPink' : 'bg-neonPink text-white glow-pink'
        }`}
      >
        <Bot size={32} />
      </motion.button>
    </div>
  );
};

export default AIChatbot;
