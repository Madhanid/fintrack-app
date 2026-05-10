"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useRealtime, RTEvent } from '@/contexts/RealtimeContext';

const COLORS = ['#ff007f', '#00d4ff', '#00ff9f', '#ffb800', '#9d00ff'];

const processTrendData = (transactions: any[]) => {
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailySpending = transactions.reduce((acc: any, tx: any) => {
    if (tx.amount < 0) acc[tx.date] = (acc[tx.date] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});

  return last7Days.map(date => ({
    name: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    spending: dailySpending[date] || 0,
    fullDate: date,
  }));
};

const processPieData = (transactions: any[]) => {
  const categoryMap: any = {};
  transactions.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
  });
  return Object.keys(categoryMap).map(cat => ({ name: cat, value: categoryMap[cat] }));
};

const DashboardCharts = ({ transactions: initialTxs }: { transactions: any[] }) => {
  const { subscribe } = useRealtime();
  const [transactions, setTransactions] = useState<any[]>(initialTxs);
  const [flashChart, setFlashChart] = useState(false);

  // Sync from initial HTTP load
  useEffect(() => {
    setTransactions(initialTxs);
  }, [initialTxs]);

  // Live update: rebuild charts when a new transaction arrives
  useEffect(() => {
    const unsubscribe = subscribe((event: RTEvent) => {
      if (
        event.type === 'new_transaction' ||
        event.type === 'transaction_updated' ||
        event.type === 'transaction_deleted'
      ) {
        // Fetch fresh transactions list
        fetch('/api/transactions')
          .then(r => r.json())
          .then(data => {
            setTransactions(data);
            setFlashChart(true);
            setTimeout(() => setFlashChart(false), 1200);
          })
          .catch(() => {});
      }
    });
    return unsubscribe;
  }, [subscribe]);

  const trendData = processTrendData(transactions);
  const pieData   = processPieData(transactions);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 transition-all duration-500 ${
      flashChart ? 'ring-1 ring-neonPink/30 rounded-2xl' : ''
    }`}>
      {/* ── Spending Trend ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 glass-card p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">Spending Trend</h3>
            {flashChart && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-[9px] font-bold text-neonPink uppercase tracking-widest bg-neonPink/10 px-2 py-0.5 rounded-full border border-neonPink/20"
              >
                Updated
              </motion.span>
            )}
          </div>
          <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none">
            <option className="bg-matteBlack">Last 7 Days</option>
            <option className="bg-matteBlack">Last 30 Days</option>
          </select>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff007f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff007f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-black/80 backdrop-blur-md p-3 border border-white/10 rounded-xl shadow-2xl">
                        <p className="text-xs text-gray-400 mb-1 font-bold">{label}</p>
                        <p className="text-lg font-bold text-neonPink drop-shadow-[0_0_8px_rgba(255,0,127,0.8)]">
                          ₹{payload[0].value}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#ff007f', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="natural"
                dataKey="spending"
                stroke="#ff007f"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorTrend)"
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Category Distribution ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-bold mb-6">Expense Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                isAnimationActive={true}
                animationDuration={600}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px', color: 'white' }}
                itemStyle={{ color: 'white' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardCharts;
