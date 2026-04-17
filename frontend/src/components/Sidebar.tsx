"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  IndianRupee, 
  BarChart3, 
  Target, 
  Scan, 
  RefreshCw, 
  BrainCircuit, 
  FileText, 
  Bell, 
  Settings,
  Wallet,
  X
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: IndianRupee, label: 'Transactions', href: '/transactions' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Target, label: 'Budget Goals', href: '/budgets' },
  { icon: Scan, label: 'Scanner', href: '/scanner' },
  { icon: RefreshCw, label: 'Recurring', href: '/recurring' },
  { icon: BrainCircuit, label: 'AI Insights', href: '/insights' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: Bell, label: 'Alerts', href: '/alerts' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-64 bg-matteBlack border-r border-white/5 z-[70] flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-neonPink p-2 rounded-lg shadow-[0_0_15px_rgba(255,0,127,0.4)]">
              <Wallet className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold neon-text text-neonPink tracking-tight">FinTrack</h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-neonPink/10 flex items-center justify-center text-neonPink">
                <Wallet size={16} />
             </div>
             <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">FinTrack Plus</p>
                <p className="text-xs text-neonPink font-medium">Activated</p>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
