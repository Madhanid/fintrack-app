"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

interface SummaryCardProps {
  title: string;
  amount: string;
  change: string;
  isPositive: boolean;
  icon: any;
  gradient: string;
}

const SummaryCard = ({ title, amount, change, isPositive, icon: Icon, gradient }: SummaryCardProps) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-6 overflow-hidden relative group"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>
    
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 group-hover:text-white transition-colors`}>
        <Icon size={20} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </div>
    </div>
    
    <div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white tracking-tight">{amount}</p>
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

const SummaryGrid = ({ summary }: { summary: any }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SummaryCard 
        title="Total Balance" 
        amount={`₹${summary?.totalBalance?.toLocaleString() || '0'}`} 
        change="+2.5%" 
        isPositive={true} 
        icon={Wallet} 
        gradient="from-blue-500 to-cyan-400"
      />
      <SummaryCard 
        title="Monthly Budget" 
        amount={`₹${summary?.monthlyBudget?.toLocaleString() || '0'}`} 
        change="-0.4%" 
        isPositive={false} 
        icon={Target} 
        gradient="from-purple-500 to-pink-500"
      />
      <SummaryCard 
        title="Total Income" 
        amount={`₹${summary?.totalIncome?.toLocaleString() || '0'}`} 
        change="+12.2%" 
        isPositive={true} 
        icon={TrendingUp} 
        gradient="from-emerald-500 to-teal-400"
      />
      <SummaryCard 
        title="Total Expenses" 
        amount={`₹${summary?.totalExpenses?.toLocaleString() || '0'}`} 
        change="+4.1%" 
        isPositive={false} 
        icon={TrendingDown} 
        gradient="from-rose-500 to-orange-400"
      />
    </div>
  );
};

export default SummaryGrid;
