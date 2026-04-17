"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SummaryGrid from '@/components/SummaryGrid';
import DashboardCharts from '@/components/DashboardCharts';
import AIInsights from '@/components/AIInsights';
import BudgetTracker from '@/components/BudgetTracker';
import AddEntryModal from '@/components/AddEntryModal';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    summary: {},
    transactions: [],
    budgets: []
  });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('John');

  useEffect(() => {
    const loadName = () => {
      const saved = localStorage.getItem('profile_name');
      if (saved) setProfileName(saved.split(' ')[0]);
    };
    loadName();
    window.addEventListener('profileUpdated', loadName);
    return () => window.removeEventListener('profileUpdated', loadName);
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, txRes, budgetRes] = await Promise.all([
        axios.get('/api/summary'),
        axios.get('/api/transactions'),
        axios.get('/api/budgets')
      ]);
      
      setData({
        summary: summaryRes.data,
        transactions: txRes.data,
        budgets: budgetRes.data
      });
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 glass-card"></div>)}
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-80 glass-card"></div>
          <div className="h-80 glass-card"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Financial Overview</h2>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {profileName}! Here's what's happening today.</p>
      </header>

      <SummaryGrid summary={data.summary} />
      
      <div className="flex justify-end gap-4 mb-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-neonPink hover:bg-accentPink text-white px-6 py-2.5 rounded-xl transition-all glow-pink"
          >
            <Plus size={18} /> New Transaction
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <DashboardCharts transactions={data.transactions} />
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-6">Recent Transactions</h3>
            <div className="space-y-3">
              {data.transactions.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-neonPink transition-colors">
                      <span className="text-xs font-bold uppercase">{tx.category[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tx.description}</p>
                      <p className="text-[10px] text-gray-500">{tx.date} • {tx.category}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <BudgetTracker budgets={data.budgets} />
          <AIInsights />
        </div>
      </div>

      <AddEntryModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />
    </motion.div>
  );
}
