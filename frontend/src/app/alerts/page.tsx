"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';

const alerts = [
  {
    id: 1,
    type: 'critical',
    title: 'Budget Limit Reached',
    message: 'You have spent 95% of your "Entertainment" budget for October.',
    time: '2 hours ago',
    icon: AlertTriangle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10'
  },
  {
    id: 2,
    type: 'info',
    title: 'Recurring Payment Due',
    message: 'Your Netflix subscription ($15.99) is due tomorrow.',
    time: '5 hours ago',
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    id: 3,
    type: 'success',
    title: 'Goal Achieved!',
    message: 'Congratulations! You have reached your "Emergency Fund" saving goal.',
    time: '1 day ago',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  },
  {
    id: 4,
    type: 'warning',
    title: 'Unusual Spending',
    message: 'We noticed a higher than usual spending in the "Shopping" category.',
    time: '2 days ago',
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10'
  }
];

export default function AlertsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Alerts & Notifications</h2>
          <p className="text-gray-500 text-sm mt-1">Stay updated with your financial health and system alerts.</p>
        </div>
        <button className="text-xs text-gray-400 hover:text-white transition-colors">
          Mark all as read
        </button>
      </header>

      <div className="space-y-4">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`glass-card p-6 flex items-start gap-6 border-white/5 hover:border-white/10 transition-all group`}
            >
              <div className={`p-3 rounded-2xl ${alert.bg} ${alert.color}`}>
                <Icon size={24} />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-100">{alert.title}</h3>
                  <span className="text-[10px] text-gray-500 font-medium uppercase">{alert.time}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                  {alert.message}
                </p>
                <div className="mt-4 flex gap-4">
                  <button className="text-xs font-bold text-neonPink flex items-center gap-1 hover:underline">
                    Take Action <ArrowRight size={14} />
                  </button>
                  <button className="text-xs font-bold text-gray-500 hover:text-white transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>

              <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-all">
                <MoreHorizontal size={20} />
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-8">
        <h3 className="text-lg font-bold mb-6">Notification Settings</h3>
        <div className="glass-card divide-y divide-white/5">
          {[
            'Browser Push Notifications',
            'Email Weekly Reports',
            'SMS Critical Alerts',
            'AI Spending Insights'
          ].map((setting, idx) => (
            <div key={idx} className="flex justify-between items-center p-6">
              <span className="text-sm text-gray-300">{setting}</span>
              <button className="w-12 h-6 rounded-full bg-neonPink relative">
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white"></div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
