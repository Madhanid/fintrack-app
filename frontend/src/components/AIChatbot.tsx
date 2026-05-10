"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, MessageSquare, Sparkles, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { useRealtime } from '@/contexts/RealtimeContext';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  streaming?: boolean;
}

// ── Typewriter renderer ───────────────────────────────────────────────────────
const TypewriterText = ({ text, onDone }: { text: string; onDone?: () => void }) => {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');

    const interval = setInterval(() => {
      if (idxRef.current < text.length) {
        setDisplayed(text.slice(0, ++idxRef.current));
      } else {
        clearInterval(interval);
        onDone?.();
      }
    }, 18); // ~18ms per char ≈ typewriter speed

    return () => clearInterval(interval);
  }, [text]); // eslint-disable-line

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="inline-block w-0.5 h-3.5 bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  );
};

// ── Main AIChatbot ────────────────────────────────────────────────────────────
const AIChatbot = () => {
  const { isConnected } = useRealtime();
  const [isOpen, setIsOpen]         = useState(false);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/chat');
      const data = await res.json();
      setMessages(data);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Placeholder streaming message
    const streamIdx = messages.length + 1;
    const placeholder: Message = {
      role: 'ai',
      content: '',
      timestamp: new Date().toISOString(),
      streaming: true,
    };
    setMessages(prev => [...prev, placeholder]);
    setStreamingId(streamIdx);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });

      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const token = line.slice(6);
            if (token === '[DONE]') continue;
            fullText += token;
            // Update last message in-place
            setMessages(prev => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: fullText,
                streaming: true,
              };
              return next;
            });
            scrollToBottom();
          }
        }
      }

      // Mark as done (stops typewriter cursor)
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: fullText,
          streaming: false,
        };
        return next;
      });
    } catch {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'ai',
          content: "Sorry, I'm having trouble connecting to my brain right now.",
          timestamp: new Date().toISOString(),
          streaming: false,
        };
        return next;
      });
    } finally {
      setIsLoading(false);
      setStreamingId(null);
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
            className="absolute bottom-20 right-0 w-[420px] h-[620px] glass-card border-neonPink/30 flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-neonPink/20 to-accentPink/20 border-b border-white/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neonPink/20 flex items-center justify-center text-neonPink">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white leading-none">FinTrack AI</h3>
                  <span className="text-[10px] text-neonPink font-bold uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={8} />
                    {isLoading ? 'Streaming response...' : 'Financial Assistant'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected
                  ? <Wifi size={14} className="text-emerald-400" />
                  : <WifiOff size={14} className="text-gray-500" />
                }
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-4 border border-white/5">
                    <MessageSquare size={32} />
                  </div>
                  <h4 className="font-bold text-gray-200 mb-2">How can I help you?</h4>
                  <p className="text-xs text-gray-500 mb-6">
                    Ask me to analyze your spending. Responses stream in real-time.
                  </p>
                  <div className="grid grid-cols-1 gap-2 w-full">
                    {['Analyze my spending', 'How can I save more?', 'Check my budget'].map(q => (
                      <button
                        key={q}
                        onClick={() => setInputValue(q)}
                        className="text-left p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-400 hover:border-neonPink/30 transition-all flex items-center justify-between group"
                      >
                        {q}
                        <TrendingDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-neonPink text-white rounded-tr-none'
                      : 'bg-white/10 text-gray-200 border border-white/10 rounded-tl-none'
                  }`}>
                    {msg.role === 'ai' && msg.streaming && msg.content !== '' ? (
                      <TypewriterText text={msg.content} />
                    ) : msg.role === 'ai' && msg.content === '' && msg.streaming ? (
                      /* Dots while waiting for first token */
                      <div className="flex gap-1 py-1">
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1, delay }}
                            className="w-1.5 h-1.5 rounded-full bg-gray-400"
                          />
                        ))}
                      </div>
                    ) : (
                      msg.content
                    )}
                    <p className="text-[8px] opacity-50 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/40 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your finances..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-neonPink outline-none transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !inputValue.trim()}
                  className="p-2.5 bg-neonPink hover:bg-accentPink text-white rounded-xl transition-all shadow-lg shadow-neonPink/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
              {isLoading && (
                <p className="text-[10px] text-neonPink mt-1.5 flex items-center gap-1">
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >●</motion.span>
                  AI is streaming a response...
                </p>
              )}
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
        {isLoading && (
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black"
          />
        )}
      </motion.button>
    </div>
  );
};

export default AIChatbot;
