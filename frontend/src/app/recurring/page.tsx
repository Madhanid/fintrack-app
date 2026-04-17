"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Calendar, 
  CreditCard, 
  Zap,
  Music,
  Tv2,
  Trash2,
  Edit2,
  Plus
} from 'lucide-react';

const subscriptions = [
  { name: 'Netflix', amount: 15.99, date: 'Next: Oct 28', icon: Tv2, color: 'text-rose-500' },
  { name: 'Spotify', amount: 9.99, date: 'Next: Nov 02', icon: Music, color: 'text-emerald-500' },
  { name: 'AWS Cloud', amount: 42.50, date: 'Next: Oct 30', icon: Zap, color: 'text-orange-500' },
  { name: 'Gym Membership', amount: 30.00, date: 'Next: Nov 15', icon: RefreshCw, color: 'text-blue-500' },
];

export default function RecurringPage() {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Recurring Expenses</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your subscriptions and automated payments in one place.</p>
        </div>
        <button 
          onClick={() => alert('Subscription creation modal will be implemented here soon!')}
          className="flex items-center gap-2 bg-neonPink hover:bg-accentPink text-white px-6 py-2.5 rounded-xl transition-all glow-pink"
        >
          <Plus size={18} /> Add Subscription
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptions.map((sub, idx) => {
          const Icon = sub.icon;
          return (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="glass-card p-6 border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl bg-white/5 ${sub.color}`}>
                  <Icon size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500"><Edit2 size={14} /></button>
                  <button className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1">{sub.name}</h3>
              <p className="text-2xl font-black text-white mb-4">₹{sub.amount.toFixed(2)}<span className="text-[10px] text-gray-500 font-normal ml-1">/ mo</span></p>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest bg-white/5 py-1 px-3 rounded-full w-fit">
                <Calendar size={12} /> {sub.date}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="glass-card p-8">
        <h3 className="text-xl font-bold mb-6">Predicted Monthly Burn</h3>
        <div className="flex items-end gap-2 mb-8">
          <span className="text-4xl font-black text-white">₹98.48</span>
          <span className="text-sm text-gray-500 mb-1">Total Fixed Expenses</span>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
            <div className="h-full bg-rose-500" style={{ width: '15%' }}></div>
            <div className="h-full bg-emerald-500" style={{ width: '10%' }}></div>
            <div className="h-full bg-orange-500" style={{ width: '45%' }}></div>
            <div className="h-full bg-blue-500" style={{ width: '30%' }}></div>
          </div>
          <div className="flex flex-wrap gap-6">
            {subscriptions.map((sub, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${sub.color.replace('text', 'bg')}`}></div>
                <span className="text-[10px] text-gray-500 uppercase font-bold">{sub.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
