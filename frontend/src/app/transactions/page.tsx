"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowUpDown, 
  MoreVertical, 
  Download,
  Trash2,
  Edit2,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Film
} from 'lucide-react';
import AddEntryModal from '@/components/AddEntryModal';

const categoryIcons: any = {
  Shopping: { icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  Food: { icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  Transport: { icon: Car, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  Bills: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  Health: { icon: HeartPulse, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  Entertainment: { icon: Film, color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || tx.category === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`/api/transactions/${id}`);
        fetchTransactions();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Transactions</h2>
          <p className="text-gray-500 text-sm mt-1">Manage and track all your financial activities.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => {
              const headers = ['ID', 'Description', 'Amount', 'Date', 'Category'];
              const csvContent = [
                headers.join(','),
                ...transactions.map(tx => [tx.id, `"${tx.description}"`, tx.amount, tx.date, tx.category].join(','))
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.setAttribute('download', `fintrack_transactions_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2.5 rounded-xl transition-all border border-white/5"
          >
            <Download size={18} /> Export
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-neonPink hover:bg-accentPink text-white px-6 py-2.5 rounded-xl transition-all glow-pink"
          >
            <Plus size={18} /> New Transaction
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-full md:w-96">
            <Search size={18} className="text-gray-500" />
            <input 
              type="text" 
              placeholder="Search description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gray-300 w-full"
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Filter size={16} />
              <span>Category:</span>
            </div>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-gray-300 outline-none focus:border-neonPink transition-all"
            >
              <option value="All" className="bg-matteBlack">All</option>
              {Object.keys(categoryIcons).map(cat => (
                <option key={cat} value={cat} className="bg-matteBlack">{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Transaction</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredTransactions.map((tx) => {
                  const Category = categoryIcons[tx.category] || { icon: ShoppingBag, color: 'text-gray-400', bg: 'bg-gray-400/10' };
                  const Icon = Category.icon;
                  return (
                    <motion.tr 
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${Category.bg} flex items-center justify-center ${Category.color}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-200">{tx.description}</p>
                            <p className="text-[10px] text-gray-500 uppercase">ID #{tx.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${Category.bg} ${Category.color} uppercase tracking-tighter`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {tx.date}
                      </td>
                      <td className="px-6 py-4">
                        <p className={`font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(tx.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-rose-400 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredTransactions.length === 0 && !loading && (
            <div className="py-20 text-center text-gray-500">
              <p className="text-sm">No transactions found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      <AddEntryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
