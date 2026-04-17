"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, IndianRupee, Tag, Calendar, FileText } from 'lucide-react';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Shopping',
    type: 'Expense'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedAmount = parseFloat(formData.amount.replace(/[^0-9.-]+/g, ''));
      const finalAmount = formData.type === 'Expense' ? -Math.abs(parsedAmount || 0) : Math.abs(parsedAmount || 0);

      // Mock POST for now, will connect to real backend
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: finalAmount
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          category: 'Shopping',
          type: 'Expense'
        });
      }
    } catch (error) {
      console.error('Error adding entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-full max-w-md p-8 relative border-neonPink/30"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-neonPink flex items-center gap-2">
              <Save size={24} /> Add New Entry
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    required
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[var(--text-primary)] focus:border-neonPink outline-none transition-all"
                    placeholder="e.g. Weekly Groceries"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      required
                      type="text"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[var(--text-primary)] focus:border-neonPink outline-none transition-all"
                      placeholder="₹0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[var(--text-primary)] focus:border-neonPink outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[var(--text-primary)] focus:border-neonPink outline-none transition-all appearance-none"
                  >
                    <option value="Expense" className="text-black">Expense</option>
                    <option value="Income" className="text-black">Income</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[var(--text-primary)] focus:border-neonPink outline-none transition-all appearance-none"
                  >
                    <option value="Shopping" className="text-black">Shopping</option>
                    <option value="Food" className="text-black">Food</option>
                    <option value="Transport" className="text-black">Transport</option>
                    <option value="Bills" className="text-black">Bills</option>
                    <option value="Health" className="text-black">Health</option>
                    <option value="Entertainment" className="text-black">Entertainment</option>
                    <option value="Other" className="text-black">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-neonPink hover:bg-accentPink text-white font-bold py-3 rounded-xl transition-all glow-pink disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddEntryModal;
