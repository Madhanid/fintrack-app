"use client";
import '@/styles/globals.css';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import AIChatbot from '@/components/AIChatbot';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { ToastProvider } from '@/contexts/ToastContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body
        className="font-sans antialiased min-h-screen"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        {/*
          Provider order matters:
          ThemeProvider → RealtimeProvider (WebSocket) → ToastProvider (uses useRealtime for budget alerts)
        */}
        <ThemeProvider>
          <RealtimeProvider>
            <ToastProvider>
              <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
              <div className="lg:pl-64 pt-20">
                <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="min-h-[calc(100vh-80px)] p-4 md:p-8">
                  {children}
                </main>
              </div>
              <AIChatbot />
            </ToastProvider>
          </RealtimeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
