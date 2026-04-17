"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Bell, 
  Moon, 
  Sun,
  Shield, 
  HelpCircle,
  CreditCard,
  ChevronRight,
  LogOut
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(n => n);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    const savedName = localStorage.getItem('profile_name');
    const savedEmail = localStorage.getItem('profile_email');
    if (savedName) setFullName(savedName);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('profile_name', fullName);
    localStorage.setItem('profile_email', email);
    window.dispatchEvent(new Event('profileUpdated'));
    setTimeout(() => {
      setIsSaving(false);
      alert('Changes saved successfully!');
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your account preferences and application settings.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          {[
            { label: 'Profile', icon: User },
            { label: 'Security', icon: Lock },
            { label: 'Notifications', icon: Bell },
            { label: 'Appearance', icon: Sun },
            { label: 'Billing', icon: CreditCard },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${activeTab === item.label ? 'bg-neonPink/20 text-neonPink border border-neonPink/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </aside>

        <div className="md:col-span-3 space-y-8">
          {activeTab === 'Profile' && (
            <>
              <section className="glass-card p-6">
                <h3 className="text-lg font-bold mb-6">Profile Information</h3>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neonPink to-accentPink flex items-center justify-center text-3xl font-bold shadow-xl shadow-neonPink/20">
                    {getInitials(fullName)}
                  </div>
                <div>
                  <button className="px-4 py-2 rounded-xl bg-neonPink text-white text-xs font-bold glow-pink transition-all">
                    Change Avatar
                  </button>
                  <p className="text-[10px] text-gray-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase font-bold">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-neonPink text-[var(--text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase font-bold">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-neonPink text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </section>

            <section className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                      {isDark ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">Dark Mode</p>
                      <p className="text-xs text-gray-500">Switch between dark and light themes.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className={`w-12 h-6 rounded-full transition-all relative ${isDark ? 'bg-neonPink' : 'bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDark ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                      <Bell size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive weekly summaries and alerts.</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 rounded-full bg-neonPink relative">
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white"></div>
                  </button>
                </div>
              </div>
            </section>
          </>
          )}

          {activeTab !== 'Profile' && activeTab !== 'Appearance' && activeTab !== 'Notifications' && (
            <section className="glass-card p-6 flex flex-col items-center justify-center text-center py-16">
              <Shield size={48} className="text-neonPink/50 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{activeTab} Settings</h3>
              <p className="text-gray-500 text-sm">This section is currently under development.</p>
            </section>
          )}

          <div className="flex justify-between items-center pt-4">
            <button className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-sm font-bold transition-all">
              <LogOut size={18} /> Deactivate Account
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-8 py-3 rounded-xl bg-neonPink text-white font-bold glow-pink transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
