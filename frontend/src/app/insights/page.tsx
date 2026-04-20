"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  Zap,
  ArrowRight,
  Target
} from 'lucide-react';

const primaryInsights = [
  {
    title: "Projected Savings",
    value: "₹1,240.25",
    description: "by the end of October",
    icon: TrendingUp,
    color: "text-emerald-400"
  },
  {
    title: "Spending Efficiency",
    value: "84%",
    description: "6% higher than last month",
    icon: Target,
    color: "text-blue-400"
  },
  {
    title: "AI Risk Level",
    value: "Low",
    description: "No unusual activities detected",
    icon: Sparkles,
    color: "text-purple-400"
  }
];

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">AI Financial Insights</h2>
          <p className="text-gray-500 text-sm mt-1">Intelligent analysis and predictive modeling for your finances.</p>
        </div>
        <button className="flex items-center gap-2 bg-neonPink/10 hover:bg-neonPink/20 text-neonPink px-6 py-2.5 rounded-xl border border-neonPink/20 transition-all font-bold text-sm">
          <Zap size={18} /> Refresh Analysis
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {primaryInsights.map((insight, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -5 }}
            className="glass-card p-6 border-white/5"
          >
            <div className={`p-3 w-fit rounded-xl bg-white/5 ${insight.color} mb-4`}>
              <insight.icon size={24} />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{insight.title}</h3>
            <p className="text-2xl font-bold text-white">{insight.value}</p>
            <p className="text-xs text-gray-500 mt-1">{insight.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Lightbulb className="text-yellow-400" size={24} /> Recommendations
          </h3>
          <div className="space-y-4">
            {[
              {
                title: "Cancel Underused Subscription",
                desc: "We noticed you haven't used your 'Music Premium' subscription in 45 days. Canceling could save you ₹120/year.",
                impact: "High Impact"
              },
              {
                title: "Optimize Grocery Spending",
                desc: "Your spending at 'SuperMart' is 20% higher than local averages. Try 'FreshFarm' for 15% lower rates.",
                impact: "Medium Impact"
              },
              {
                title: "Refinance Opportunity",
                desc: "Current interest rates are 0.5% lower than your recorded loan rate. Refinancing could save ₹45/mo.",
                impact: "Expert Level"
              }
            ].map((rec, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ x: 5 }}
                className="glass-card p-6 border-white/5 hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-100">{rec.title}</h4>
                  <span className="text-[10px] font-bold text-neonPink px-2 py-1 bg-neonPink/10 rounded-full">{rec.impact}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">{rec.desc}</p>
                <button className="text-[10px] font-bold text-white flex items-center gap-1 hover:text-neonPink transition-colors uppercase tracking-widest">
                  View Analysis <ArrowRight size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 bg-gradient-to-br from-purple-500/5 to-transparent flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-neonPink mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,0,127,0.1)]">
            <BrainCircuit size={40} />
          </div>
          <h3 className="text-2xl font-bold mb-4">AI Spending Personality</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
            Our neural networks have analyzed 450+ of your transactions. Your personality type is:
          </p>
          <div className="bg-neonPink/10 border border-neonPink/20 p-6 rounded-2xl mb-8">
            <h4 className="text-3xl font-black text-neonPink tracking-tighter uppercase italic">The Calculated Collector</h4>
            <p className="text-xs text-neonPink font-medium mt-2">Prudent, methodical, and growth-oriented.</p>
          </div>
          <p className="text-xs text-gray-500 max-w-xs">
            Users with this personality type typically reach their long-term goals 15% faster than average.
          </p>
        </div>
      </div>
    </div>
  );
}
