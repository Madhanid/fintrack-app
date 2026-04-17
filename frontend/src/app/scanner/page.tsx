"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Scan, 
  Camera, 
  Upload, 
  Zap, 
  CheckCircle2,
  FileSearch,
  History,
  AlertCircle
} from 'lucide-react';

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [captured, setCaptured] = useState<any>(null);

  const simulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setCaptured({
        merchant: "Starbucks Coffee",
        amount: 5.45,
        date: "2023-10-24",
        category: "Food",
        confidence: 98
      });
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="text-center">
        <h2 className="text-3xl font-bold text-white tracking-tight">Smart Scanner</h2>
        <p className="text-gray-500 text-sm mt-2">Instantly convert physical receipts into digital entries using AI.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <div className="glass-card p-8 border-dashed border-2 border-white/10 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden group">
            {isScanning ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Scan size={64} className="text-neonPink animate-pulse" />
                  <motion.div 
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-neonPink shadow-[0_0_15px_#ff007f]"
                  />
                </div>
                <p className="text-neonPink font-bold animate-pulse uppercase tracking-widest text-xs">Analyzing Image...</p>
              </div>
            ) : captured ? (
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold">Receipt Scanned!</h3>
                <p className="text-sm text-gray-500">We've extracted the core details below.</p>
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 w-full text-left">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-500">Merchant</span>
                    <span className="text-xs font-bold">{captured.merchant}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-500">Amount</span>
                    <span className="text-xs font-bold text-neonPink">${captured.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Confidence</span>
                    <span className="text-xs font-bold text-emerald-400">{captured.confidence}%</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full mt-4">
                  <button 
                    onClick={() => setCaptured(null)}
                    className="flex-1 py-2 px-4 rounded-xl bg-white/5 text-xs text-gray-400 border border-white/10"
                  >
                    Discard
                  </button>
                  <button className="flex-1 py-2 px-4 rounded-xl bg-neonPink text-white text-xs font-bold glow-pink">
                    Add Transaction
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-6 rounded-full bg-neonPink/10 text-neonPink mb-6 group-hover:scale-110 transition-transform">
                  <Camera size={48} />
                </div>
                <h3 className="text-lg font-bold mb-2">Ready to Scan</h3>
                <p className="text-sm text-gray-500 text-center mb-8 px-8">
                  Upload a photo of your receipt or QR code to automatically fill transaction details.
                </p>
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={simulateScan}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-neonPink text-white text-sm font-bold glow-pink transition-all active:scale-95"
                  >
                    <Zap size={18} /> Use Camera
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white text-sm font-bold border border-white/10 cursor-pointer hover:bg-white/20 transition-all">
                    <Upload size={18} /> Upload file
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <AlertCircle className="text-blue-400" size={24} />
            <p className="text-xs text-blue-200 leading-relaxed">
              <strong>Tip:</strong> Ensure the receipt is well-lit and flat for the highest OCR accuracy.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <History className="text-neonPink" size={20} /> Recent Scans
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-4 hover:border-white/20 transition-all cursor-pointer flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-gray-500">
                    <FileSearch size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Screenshot_2023102{i}.jpg</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Processed • Oct 2{i}, 2023</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">$24.99</p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase">Success</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 border-neonPink/20 bg-gradient-to-tr from-neonPink/5 to-transparent">
            <h4 className="font-bold mb-2">Automated Rules</h4>
            <p className="text-xs text-gray-400 mb-4">
              Receipts from "Uber" are automatically categorized as "Transport".
            </p>
            <button className="text-xs text-neonPink font-bold hover:underline">Edit Rules</button>
          </div>
        </div>
      </div>
    </div>
  );
}
