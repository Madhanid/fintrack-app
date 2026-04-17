"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';

interface BudgetGoal {
  id: number;
  category: string;
  target: number;
  current: number;
}

const BudgetTracker = ({ budgets }: { budgets: BudgetGoal[] }) => {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="text-neonPink" size={20} />
          <h3 className="text-lg font-bold">Budget Goals</h3>
        </div>
        <button className="text-xs text-neonPink hover:underline">Manage</button>
      </div>

      <div className="space-y-6">
        {budgets.length > 0 ? budgets.map((budget) => {
          const percent = Math.min((budget.current / budget.target) * 100, 100);
          const shadowColor = percent > 90 ? 'rgba(244,63,94,0.3)' : 'rgba(255,0,127,0.3)';
          const barColor = percent > 90 ? 'bg-rose-500' : 'bg-neonPink';

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-bold text-gray-200">{budget.category}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                    ₹{budget.current.toLocaleString()} of ₹{budget.target.toLocaleString()}
                  </p>
                </div>
                <div className={`text-xs font-bold ${percent > 90 ? 'text-rose-400' : 'text-neonPink'}`}>
                  {Math.round(percent)}%
                </div>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  className={`h-full ${barColor} transition-all`}
                  style={{ boxShadow: `0 0 10px ${shadowColor}` }}
                />
              </div>
            </div>
          );
        }) : (
          <div className="py-8 text-center text-gray-500">
            <TrendingUp size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">No budget goals set yet.</p>
          </div>
        )}
      </div>

      {budgets.length > 0 && (
        <div className="mt-8 p-4 bg-neonPink/5 border border-neonPink/10 rounded-xl">
          <p className="text-[10px] text-neonPink font-bold uppercase mb-1">Status</p>
          <p className="text-xs text-gray-300">You are on track to save <span className="text-white font-bold">₹420</span> this month!</p>
        </div>
      )}
    </div>
  );
};

export default BudgetTracker;
