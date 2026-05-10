"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { useRealtime, RTEvent } from '@/contexts/RealtimeContext';

interface FeedEntry {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  isNew?: boolean;
}

const categoryColors: Record<string, string> = {
  Food: 'from-orange-500 to-amber-400',
  Bills: 'from-blue-500 to-cyan-400',
  Entertainment: 'from-purple-500 to-pink-500',
  Income: 'from-emerald-500 to-teal-400',
  General: 'from-gray-500 to-slate-400',
  Transport: 'from-yellow-500 to-orange-400',
  Health: 'from-rose-500 to-red-400',
};

const LiveExFeedItem = ({ entry, isNew }: { entry: FeedEntry; isNew: boolean }) => {
  const gradient = categoryColors[entry.category] || 'from-gray-500 to-slate-400';
  const isIncome = entry.amount > 0;

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -30, scale: 0.95 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all group ${
        isNew
          ? 'bg-neonPink/10 border-neonPink/30 shadow-lg shadow-neonPink/10'
          : 'bg-white/5 border-white/5 hover:border-white/10'
      }`}
    >
      {isNew && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-neonPink text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full"
        >
          <Zap size={7} /> LIVE
        </motion.div>
      )}

      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
        {entry.category[0]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{entry.description}</p>
        <p className="text-[10px] text-gray-500">{entry.date} · {entry.category}</p>
      </div>

      <p className={`text-sm font-bold shrink-0 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isIncome ? (
          <span className="flex items-center gap-0.5"><ArrowUpRight size={12} />₹{entry.amount.toFixed(0)}</span>
        ) : (
          <span className="flex items-center gap-0.5"><ArrowDownRight size={12} />₹{Math.abs(entry.amount).toFixed(0)}</span>
        )}
      </p>
    </motion.div>
  );
};

const LiveExpenseFeed = ({ initialTransactions }: { initialTransactions: any[] }) => {
  const { subscribe } = useRealtime();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const counterRef = useRef(0);

  // Populate from initial HTTP load
  useEffect(() => {
    const mapped: FeedEntry[] = initialTransactions.slice(0, 8).map(tx => ({
      id: String(tx.id),
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      date: tx.date,
      isNew: false,
    }));
    setEntries(mapped);
  }, [initialTransactions]);

  // Stream new transactions via WebSocket
  useEffect(() => {
    const unsubscribe = subscribe((event: RTEvent) => {
      if (event.type === 'new_transaction' && event.payload) {
        const id = `live-${Date.now()}-${counterRef.current++}`;
        const newEntry: FeedEntry = {
          id,
          description: event.payload.description,
          amount: event.payload.amount,
          category: event.payload.category,
          date: event.payload.date,
          isNew: true,
        };

        setEntries(prev => [newEntry, ...prev].slice(0, 12));
        setNewIds(prev => new Set(prev).add(id));

        // Mark as no-longer-new after 3s
        setTimeout(() => {
          setNewIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 3000);
      }

      if (event.type === 'transaction_deleted' && event.payload?.id) {
        setEntries(prev => prev.filter(e => e.id !== String(event.payload.id)));
      }
    });
    return unsubscribe;
  }, [subscribe]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="text-neonPink" size={18} />
          <h3 className="text-lg font-bold">Live Activity Feed</h3>
        </div>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Real-time
        </motion.div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="popLayout" initial={false}>
          {entries.map(entry => (
            <LiveExFeedItem
              key={entry.id}
              entry={entry}
              isNew={newIds.has(entry.id)}
            />
          ))}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-sm">
            <Activity size={28} className="mx-auto mb-2 opacity-20" />
            No transactions yet. Add one to see the live feed.
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveExpenseFeed;
