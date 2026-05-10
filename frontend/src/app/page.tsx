"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SummaryGrid from '@/components/SummaryGrid';
import DashboardCharts from '@/components/DashboardCharts';
import AIInsights from '@/components/AIInsights';
import BudgetTracker from '@/components/BudgetTracker';
import AddEntryModal from '@/components/AddEntryModal';
import LiveExpenseFeed from '@/components/LiveExpenseFeed';
import { motion } from 'framer-motion';
import { Plus, RefreshCw } from 'lucide-react';
import { useRealtime, RTEvent } from '@/contexts/RealtimeContext';
import { useToast } from '@/contexts/ToastContext';

export default function Home() {
  const { subscribe, isConnected } = useRealtime();
  const { addToast } = useToast();

  const [data, setData] = useState<any>({ summary: {}, transactions: [], budgets: [] });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('User');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    const loadName = () => {
      const saved = localStorage.getItem('profile_name');
      if (saved) setProfileName(saved.split(' ')[0]);
    };
    loadName();
    window.addEventListener('profileUpdated', loadName);
    return () => window.removeEventListener('profileUpdated', loadName);
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [summaryRes, txRes, budgetRes] = await Promise.all([
        axios.get('/api/summary'),
        axios.get('/api/transactions'),
        axios.get('/api/budgets'),
      ]);
      setData({ summary: summaryRes.data, transactions: txRes.data, budgets: budgetRes.data });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Subscribe to WS events for cross-tab sync and toasts
  useEffect(() => {
    const unsubscribe = subscribe((event: RTEvent) => {
      if (event.type === 'new_transaction' && event.payload) {
        const amt = event.payload.amount;
        addToast({
          variant: amt > 0 ? 'success' : 'info',
          title: amt > 0 ? '💰 Income Added' : '💳 Expense Recorded',
          message: `${event.payload.description} — ₹${Math.abs(amt).toFixed(0)} (${event.payload.category})`,
          duration: 4000,
        });
      }

      if (event.type === 'transaction_deleted') {
        addToast({ variant: 'warning', title: 'Transaction Removed', message: 'A transaction was deleted.', duration: 3000 });
      }

      // Multi-tab: summary updated from another tab → refresh silently
      if (event.type === 'summary_updated') {
        setLastRefreshed(new Date());
      }
    });
    return unsubscribe;
  }, [subscribe, addToast]);

  const onSuccess = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 glass-card" />)}
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-80 glass-card" />
          <div className="h-80 glass-card" />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* ── Header ── */}
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Financial Overview</h2>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {profileName}!&nbsp;
            <span className="text-gray-600">
              Last updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            title="Refresh data"
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10"
          >
            <RefreshCw size={16} />
          </button>
          
          <button
            onClick={() => {
              const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
              if (!SpeechRecognition) {
                addToast({ variant: 'alert', title: 'Not Supported', message: 'Voice recognition is not supported in this browser.', duration: 3000 });
                return;
              }
              const recognition = new SpeechRecognition();
              recognition.lang = 'en-US';
              recognition.interimResults = false;
              recognition.maxAlternatives = 1;

              addToast({ variant: 'info', title: '🎤 Listening...', message: 'Say something like: "Add 20 dollars for lunch"', duration: 5000 });

              recognition.onresult = async (event: any) => {
                const speechResult = event.results[0][0].transcript.toLowerCase();
                console.log('Speech:', speechResult);

                // Try to find digits, or fallback to matching common number words (simplified)
                const amountMatch = speechResult.match(/\b(\d+)\b/);
                
                if (amountMatch) {
                  const amount = parseFloat(amountMatch[1]);
                  const desc = speechResult.replace(/add|dollars|rupees|for|expense|spent|paid/g, '').trim() || 'Voice Entry';
                  
                  try {
                    await axios.post('/api/transactions', {
                      description: desc.charAt(0).toUpperCase() + desc.slice(1),
                      amount: -amount,
                      category: 'General',
                      date: new Date().toISOString().split('T')[0]
                    });
                    addToast({ variant: 'success', title: 'Voice Added', message: `Heard: "${speechResult}". Added ₹${amount} for ${desc}`, duration: 5000 });
                    fetchData(true);
                  } catch (e) {
                    addToast({ variant: 'alert', title: 'Error', message: 'Failed to add transaction.', duration: 3000 });
                  }
                } else {
                  addToast({ variant: 'warning', title: 'Didn\'t catch an amount', message: `I heard: "${speechResult}", but couldn't find a number. Try saying "150 rupees".`, duration: 6000 });
                }
              };
              
              recognition.onerror = () => {
                addToast({ variant: 'alert', title: 'Error', message: 'Failed to access microphone.', duration: 3000 });
              };

              recognition.start();
            }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            title="Voice to Transaction"
          >
            🎤 Voice Add
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-neonPink hover:bg-accentPink text-white px-6 py-2.5 rounded-xl transition-all glow-pink"
          >
            <Plus size={18} /> New Transaction
          </button>
        </div>
      </header>

      {/* ── Summary Cards (live counters) ── */}
      <SummaryGrid summary={data.summary} />

      {/* ── Charts (live re-render) ── */}
      <DashboardCharts transactions={data.transactions} />

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Live Feed */}
        <div className="lg:col-span-3 space-y-8">
          <LiveExpenseFeed initialTransactions={data.transactions} />
        </div>

        {/* Right: Budget + Insights */}
        <div className="space-y-8">
          <BudgetTracker budgets={data.budgets} />
          <AIInsights />
        </div>
      </div>

      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={onSuccess}
      />
    </motion.div>
  );
}
