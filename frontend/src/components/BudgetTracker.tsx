"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { useRealtime, RTEvent, BudgetAlert } from '@/contexts/RealtimeContext';
import { useToast } from '@/contexts/ToastContext';

interface BudgetGoal {
  id: number;
  category: string;
  target: number;
  current: number;
}

const BudgetTracker = ({ budgets: initialBudgets }: { budgets: BudgetGoal[] }) => {
  const { subscribe } = useRealtime();
  const { addToast } = useToast();
  const [budgets, setBudgets] = useState<BudgetGoal[]>(initialBudgets);
  const alertedRef = useRef<Set<string>>(new Set());

  // Sync from parent (initial HTTP load)
  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  useEffect(() => {
    const unsubscribe = subscribe((event: RTEvent) => {
      // Live budget alert: fire toast if threshold crossed
      if (event.type === 'budget_alert' && Array.isArray(event.payload)) {
        (event.payload as BudgetAlert[]).forEach(alert => {
          const key = `${alert.category}-${Math.floor(alert.percent / 10) * 10}`;
          if (!alertedRef.current.has(key)) {
            alertedRef.current.add(key);
            addToast({
              variant: alert.percent >= 100 ? 'alert' : 'warning',
              title: alert.percent >= 100
                ? `🚨 ${alert.category} Budget Exceeded!`
                : `⚠️ ${alert.category} Budget at ${alert.percent}%`,
              message: `Spent ₹${alert.current.toFixed(0)} of ₹${alert.target.toFixed(0)} budget.`,
              duration: 7000,
            });
          }
        });
      }

      // Refresh budgets when they're updated
      if (event.type === 'budgets_updated') {
        fetch('/api/budgets')
          .then(r => r.json())
          .then(data => setBudgets(data))
          .catch(() => {});
      }
    });
    return unsubscribe;
  }, [subscribe, addToast]);

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
          const percent     = Math.min((budget.current / budget.target) * 100, 100);
          const isOverLimit = percent >= 80;
          const isCritical  = percent >= 100;
          const shadowColor = isCritical
            ? 'rgba(244,63,94,0.5)'
            : isOverLimit
            ? 'rgba(245,158,11,0.4)'
            : 'rgba(255,0,127,0.3)';
          const barColor = isCritical
            ? 'from-rose-600 to-rose-400'
            : isOverLimit
            ? 'from-amber-500 to-yellow-400'
            : 'from-neonPink to-accentPink';

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-200">{budget.category}</p>
                    {isCritical && (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <AlertTriangle size={12} className="text-rose-400" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                    ₹{budget.current.toLocaleString()} of ₹{budget.target.toLocaleString()}
                  </p>
                </div>
                <div className={`text-xs font-bold ${
                  isCritical ? 'text-rose-400' : isOverLimit ? 'text-amber-400' : 'text-neonPink'
                }`}>
                  {Math.round(percent)}%
                </div>
              </div>

              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${barColor} transition-all`}
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
          <p className="text-[10px] text-neonPink font-bold uppercase mb-1">Live Status</p>
          <p className="text-xs text-gray-300">
            Alerts fire automatically when any budget hits <span className="text-white font-bold">80%</span> or more.
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetTracker;
