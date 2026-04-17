"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const COLORS = ['#ff007f', '#00d4ff', '#00ff9f', '#ffb800', '#9d00ff'];

const DashboardCharts = ({ transactions }: { transactions: any[] }) => {
  // Aggregate spending by date for the last 7 days
  const processTrendData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const dailySpending = transactions.reduce((acc: any, tx: any) => {
      if (tx.amount < 0) {
        acc[tx.date] = (acc[tx.date] || 0) + Math.abs(tx.amount);
      }
      return acc;
    }, {});

    return last7Days.map(date => ({
      name: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      spending: dailySpending[date] || 0,
      fullDate: date
    }));
  };

  const trendData = processTrendData();

  // Process data for category pie chart
  const categoryMap: any = {};
  transactions.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
  });
  const pieData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    value: categoryMap[cat]
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      {/* Trend Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 glass-card p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Spending Trend</h3>
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
                  <stop offset="5%" stopColor="#ff007f" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff007f" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#ff007f' }}
              />
              <Area 
                type="monotone" 
                dataKey="spending" 
                stroke="#ff007f" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTrend)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Distribution */}
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
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px', color: 'white' }}
                itemStyle={{ color: 'white' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardCharts;
