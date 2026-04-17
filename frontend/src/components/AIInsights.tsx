"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, AlertTriangle, Lightbulb, Zap } from 'lucide-react';

const insights = [
  {
    type: 'alert',
    title: 'Spending Spike',
    description: 'Entertainment spending is 15% higher than last week.',
    icon: AlertTriangle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10'
  },
  {
    type: 'suggestion',
    title: 'Saving Opportunity',
    description: 'You could save ₹4,000/mo by switching your utility provider.',
    icon: Lightbulb,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  },
  {
    type: 'prediction',
    title: 'Smart Prediction',
    description: 'Forecast suggests you will reach your travel goal by June.',
    icon: Zap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  }
];

const AIInsights = () => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      alert('Analysis has been successfully refreshed!');
    }, 1500);
  };

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-neonPink" size={20} />
          <h3 className="text-lg font-bold">AI Insights</h3>
        </div>
        <button 
          onClick={handleRefresh}
          className="text-xs text-neonPink hover:underline flex items-center gap-1 disabled:opacity-50"
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Analysis'}
        </button>
      </div>

      <div className="space-y-4">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <motion.div 
              key={idx}
              whileHover={{ x: 5 }}
              className={`p-4 rounded-xl ${insight.bg} border border-white/5 flex gap-4`}
            >
              <div className={`mt-1 ${insight.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-200">{insight.title}</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{insight.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full mt-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 transition-all">
        View All Insights
      </button>
    </div>
  );
};

export default AIInsights;
