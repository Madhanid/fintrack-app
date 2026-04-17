"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Calendar,
  PieChart as PieChartIcon,
  Filter,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const reportData = [
  { month: 'Jan', income: 4500, expense: 3200 },
  { month: 'Feb', income: 4800, expense: 3400 },
  { month: 'Mar', income: 4200, expense: 4100 },
  { month: 'Apr', income: 5100, expense: 3000 },
  { month: 'May', income: 4900, expense: 3600 },
  { month: 'Jun', income: 5500, expense: 3800 },
];

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get('/api/transactions');
        setTransactions(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTransactions();
  }, []);

  const handleExport = (type = 'all', docName = '') => {
    const headers = ['ID', 'Description', 'Amount', 'Date', 'Category'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => [tx.id, `"${tx.description}"`, tx.amount, tx.date, tx.category].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fileName = docName ? docName.toLowerCase().replace(/ /g, '_') : `fintrack_report_${new Date().toISOString().split('T')[0]}`;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">Generate and download comprehensive financial statements.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2.5 rounded-xl border border-white/10 transition-all">
            <Filter size={18} /> Filter Period
          </button>
          <button 
            onClick={() => handleExport()}
            className="flex items-center gap-2 bg-neonPink hover:bg-accentPink text-white px-6 py-2.5 rounded-xl transition-all glow-pink"
          >
            <Download size={18} /> Export All
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 glass-card p-6"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="text-neonPink" size={20} /> Income vs Expense
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 ring-1 ring-white/10 px-2 py-1 rounded text-[10px] text-gray-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Income
              </div>
              <div className="flex items-center gap-1.5 ring-1 ring-white/10 px-2 py-1 rounded text-[10px] text-gray-500">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div> Expense
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="month" stroke="#666" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold mb-4">Available Downloads</h3>
          {[
            { name: 'Monthly Statement (June)', size: '2.4 MB', type: 'PDF' },
            { name: 'Expense Breakdown (Q2)', size: '1.8 MB', type: 'CSV' },
            { name: 'Tax Summary 2023', size: '4.2 MB', type: 'PDF' },
            { name: 'Investment Report', size: '1.2 MB', type: 'CSV' },
          ].map((doc, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ x: 5 }}
              onClick={() => handleExport(doc.type, doc.name)}
              className="p-4 glass-card border-white/5 hover:border-neonPink/20 transition-all cursor-pointer flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-200">{doc.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{doc.type} • {doc.size}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleExport(doc.type, doc.name); }}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Download size={16} className="text-gray-500 hover:text-neonPink transition-colors" />
              </button>
            </motion.div>
          ))}
          
          <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 border border-white/5 transition-all">
            See History <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          { [
            { label: 'Avg Monthly Saving', value: '1,240', icon: Calendar, color: 'text-blue-400' },
            { label: 'Yearly Projection', value: '14,880', icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Tax Efficiency', value: '92%', icon: PieChartIcon, color: 'text-purple-400' },
            { label: 'Audit Risk', value: 'Low', icon: FileText, color: 'text-orange-400' },
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value.includes('%') || stat.value === 'Low' ? '' : '₹'}{stat.value}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
