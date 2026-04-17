"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';

const data = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 900 },
  { name: 'Sun', value: 700 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Advanced Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">Deep-dive into your spending patterns and financial efficiency.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Activity className="text-neonPink" size={20} /> Activity Density
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="value" fill="#ff007f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={20} /> Growth Forecast
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 bg-gradient-to-tr from-neonPink/5 via-transparent to-emerald-500/5">
        <h3 className="text-xl font-bold mb-4">Financial Health Score</h3>
        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neonPink" strokeDasharray="351.85" strokeDashoffset="70.37" />
            </svg>
            <span className="absolute text-2xl font-bold">82</span>
          </div>
          <div className="flex-1 space-y-4">
            <p className="text-sm text-gray-400">
              Your score is "Excellent". You are saving better than 82% of users in your income bracket.
            </p>
            <div className="flex gap-4">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Liquidity</p>
                <p className="text-sm font-bold text-emerald-400">High</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Debt/Income</p>
                <p className="text-sm font-bold text-emerald-400">12%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
