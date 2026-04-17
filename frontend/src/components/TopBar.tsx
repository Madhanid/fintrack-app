"use client";
import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Settings, 
  Moon, 
  Sun,
  User,
  ChevronDown,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const [isDark, setIsDark] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [fullName, setFullName] = useState('John Doe');

  React.useEffect(() => {
    const loadProfile = () => {
      const savedName = localStorage.getItem('profile_name');
      if (savedName) setFullName(savedName);
    };
    loadProfile();
    window.addEventListener('profileUpdated', loadProfile);
    return () => window.removeEventListener('profileUpdated', loadProfile);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(n => n);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-20 bg-black/50 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-64 lg:w-96">
          <Search size={18} className="text-gray-500" />
          <input 
            type="text" 
            placeholder="Search something..." 
            className="bg-transparent border-none outline-none text-sm text-gray-300 w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all hover:bg-white/10"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative">
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all hover:bg-white/10">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-neonPink rounded-full border-2 border-black"></span>
          </button>
        </div>

        <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>

        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neonPink to-accentPink flex items-center justify-center text-white font-bold shadow-lg shadow-neonPink/20">
              {getInitials(fullName)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-200">{fullName}</p>
              <p className="text-[10px] text-neonPink font-medium tracking-tighter">Premium Account</p>
            </div>
            <ChevronDown size={14} className={`text-gray-500 transition-transform hidden sm:block ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 glass-card border-white/10 p-2 z-50 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-xs font-bold text-gray-500 uppercase">My Account</p>
                </div>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                  <User size={16} /> Profile
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                  <Settings size={16} /> Settings
                </button>
                <div className="h-[1px] bg-white/5 my-1"></div>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
