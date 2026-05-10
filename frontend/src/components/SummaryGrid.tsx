"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { useRealtime, RTEvent } from '@/contexts/RealtimeContext';

// ── Animated Number ───────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, prefix = '' }: { value: number; prefix?: string }) => {
  const [displayVal, setDisplayVal] = useState(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (value === displayVal) return;
    setFlash(true);
    // Smooth count-up/down
    const steps = 20;
    const diff  = value - displayVal;
    const step  = diff / steps;
    let current = displayVal;
    let count   = 0;

    const interval = setInterval(() => {
      count++;
      current += step;
      setDisplayVal(count === steps ? value : current);
      if (count === steps) {
        clearInterval(interval);
        setTimeout(() => setFlash(false), 600);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [value]); // eslint-disable-line

  return (
    <span className={`transition-colors duration-300 ${flash ? 'text-neonPink' : ''}`}>
      {prefix}{Math.abs(displayVal).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
    </span>
  );
};

// ── Summary Card ──────────────────────────────────────────────────────────────
interface SummaryCardProps {
  title: string;
  amount: number;
  change: string;
  isPositive: boolean;
  icon: any;
  gradient: string;
  prefix?: string;
}

const SummaryCard = ({
  title, amount, change, isPositive, icon: Icon, gradient, prefix = '₹'
}: SummaryCardProps) => {
  const [prevAmount, setPrevAmount] = useState(amount);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (amount !== prevAmount) {
      setPulse(true);
      setPrevAmount(amount);
      setTimeout(() => setPulse(false), 1000);
    }
  }, [amount]); // eslint-disable-line

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`glass-card p-6 overflow-hidden relative group ${
        pulse ? 'ring-1 ring-neonPink/40' : ''
      } transition-all`}
    >
      {pulse && (
        <motion.div
          initial={{ opacity: 0.4, scale: 0.8 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 rounded-2xl bg-neonPink/10 pointer-events-none"
        />
      )}

      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 group-hover:text-white transition-colors">
          <Icon size={20} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white tracking-tight">
          <AnimatedNumber value={amount} prefix={prefix} />
        </p>
      </div>

      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: isPositive ? '70%' : '40%' }}
          className={`h-full bg-gradient-to-r ${gradient} shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
        />
      </div>
    </motion.div>
  );
};

// ── Connection Indicator ──────────────────────────────────────────────────────
const ConnectionDot = ({ connected }: { connected: boolean }) => (
  <motion.div
    animate={connected ? { opacity: [1, 0.4, 1] } : {}}
    transition={{ repeat: Infinity, duration: 2 }}
    className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-gray-600'}`}
    title={connected ? 'Live updates active' : 'Reconnecting...'}
  />
);

// ── Main SummaryGrid ──────────────────────────────────────────────────────────
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

const SummaryGrid = ({ summary: initialSummary }: { summary: any }) => {
  const { subscribe, isConnected } = useRealtime();
  const [summary, setSummary] = useState(initialSummary);

  // Accept fresh props (first load)
  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  // Live updates via WebSocket
  useEffect(() => {
    const unsubscribe = subscribe((event: RTEvent) => {
      if (event.type === 'summary_updated' && event.payload) {
        setSummary(event.payload);
      }
    });
    return unsubscribe;
  }, [subscribe]);

  return (
    <div className="space-y-3 mb-8">
      {/* Live indicator */}
      <div className="flex items-center gap-2 justify-end">
        <ConnectionDot connected={isConnected} />
        <span className="text-xs text-gray-500">
          {isConnected ? 'Live' : 'Reconnecting...'}
        </span>
        {isConnected && <Zap size={10} className="text-neonPink" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Balance"
          amount={summary?.totalBalance || 0}
          change="+2.5%"
          isPositive={true}
          icon={Wallet}
          gradient="from-blue-500 to-cyan-400"
        />
        <SummaryCard
          title="Monthly Budget"
          amount={summary?.monthlyBudget || 0}
          change="-0.4%"
          isPositive={false}
          icon={Target}
          gradient="from-purple-500 to-pink-500"
        />
        <SummaryCard
          title="Total Income"
          amount={summary?.totalIncome || 0}
          change="+12.2%"
          isPositive={true}
          icon={TrendingUp}
          gradient="from-emerald-500 to-teal-400"
        />
        <SummaryCard
          title="Total Expenses"
          amount={summary?.totalExpenses || 0}
          change="+4.1%"
          isPositive={false}
          icon={TrendingDown}
          gradient="from-rose-500 to-orange-400"
        />
      </div>
    </div>
  );
};

export default SummaryGrid;
