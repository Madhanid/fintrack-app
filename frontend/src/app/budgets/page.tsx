"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight,
  Sparkles,
  Wallet,
  ArrowUpRight
} from 'lucide-react';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: '', target: '' });

  const fetchBudgets = async () => {
    try {
      const res = await axios.get('/api/budgets');
      setBudgets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/budgets', {
        category: newBudget.category,
        target: parseFloat(newBudget.target),
        current: 0
      });
      setNewBudget({ category: '', target: '' });
      setIsAdding(false);
      fetchBudgets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Budget Goals</h2>
          <p className="text-gray-500 text-sm mt-1">Set targets and track your saving progress effectively.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-neonPink hover:bg-accentPink text-white px-6 py-2.5 rounded-xl transition-all glow-pink"
        >
          <Plus size={18} /> New Goal
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-6 border-neonPink/30"
              >
                <form onSubmit={handleAddBudget} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-gray-500 uppercase">Category</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Vacation, Car, Emergency"
                      value={newBudget.category}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-neonPink"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-gray-500 uppercase">Target Amount</label>
                    <input 
                      required
                      type="number" 
                      placeholder="0.00"
                      value={newBudget.target}
                      onChange={(e) => setNewBudget({ ...newBudget, target: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-neonPink"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-neonPink text-white text-sm font-bold shadow-lg shadow-neonPink/20"
                    >
                      Save Goal
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {budgets.map((budget) => {
              const percent = Math.min((budget.current / budget.target) * 100, 100);
              return (
                <motion.div 
                  key={budget.id}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card p-6 border-white/5 hover:border-neonPink/20 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neonPink group-hover:bg-neonPink group-hover:text-white transition-all">
                      <Target size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-tighter mb-1">Target</p>
                      <p className="text-lg font-bold text-white">₹{budget.target.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-1">{budget.category}</h3>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-gray-500">₹{budget.current.toLocaleString()} saved</p>
                    <p className="text-xs font-bold text-neonPink">{Math.round(percent)}%</p>
                  </div>

                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      className="h-full bg-neonPink shadow-[0_0_10px_rgba(255,0,127,0.4)]"
                    />
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 group-hover:text-white transition-all">
                    View Details <ChevronRight size={14} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-6 bg-gradient-to-br from-neonPink/10 to-transparent border-neonPink/20">
            <Sparkles className="text-neonPink mb-4" size={24} />
            <h3 className="text-xl font-bold mb-2">Smart Savings Advice</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Based on your current spending, you can reach your "Vacation" goal 2 weeks earlier if you reduce dining out by 10%.
            </p>
            <button 
              onClick={() => alert('Strategy successfully applied! Budget goals have been optimized.')}
              className="w-full py-3 rounded-xl bg-neonPink text-white text-sm font-bold glow-pink"
            >
              Apply Strategy
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-6">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Monthly Velocity</p>
                  <p className="text-sm font-bold text-white">+₹520.00 / mo</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Locked</p>
                  <p className="text-sm font-bold text-white">₹4,250.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
