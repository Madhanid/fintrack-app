"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, CheckCircle, AlertCircle, FileSearch, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'upload' | 'camera' | 'scanning' | 'result'>('upload');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleScan = async (file: File) => {
    setStep('scanning');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };
      
      const res = await axios.post('/api/scan', formData, config);
      setResult(res.data);
      
      // Auto-save the scanned transaction as an expense
      await axios.post('/api/transactions', {
        description: res.data.description,
        amount: -Math.abs(res.data.amount || 0),
        date: new Date().toISOString().split('T')[0],
        category: res.data.category
      });

      setStep('result');
      onSuccess();
    } catch (err) {
      console.error("Scan error", err);
      setError("AI Processing failed. Please ensure the backend is active.");
      setStep('upload');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleScan(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setStep('camera');
    } catch (err) {
      console.error("Camera error", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "receipt_capture.jpg", { type: "image/jpeg" });
            stopCamera();
            handleScan(file);
          }
        }, 'image/jpeg');
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'camera') {
      interval = setInterval(() => {
        captureFrame();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep('upload');
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card w-full max-w-md p-8 relative border-neonPink/30"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-neonPink flex items-center gap-2">
              <Camera size={24} /> AI Receipt Scanner
            </h2>

            {step === 'upload' && (
              <div className="space-y-6">
                <input 
                  type="file" 
                  id="receipt-upload" 
                  className="hidden" 
                  accept="image/*,.pdf" 
                  onChange={onFileChange} 
                />
                <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={startCamera}
                      className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-neonPink/50 hover:bg-white/5 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2"
                    >
                      <Camera className="text-gray-500 group-hover:text-neonPink transition-colors" size={32} />
                      <p className="text-gray-400 font-medium text-xs">Live Camera</p>
                    </button>
                    <label 
                      htmlFor="receipt-upload"
                      className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-neonPink/50 hover:bg-white/5 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2"
                    >
                      <FileSearch className="text-gray-500 group-hover:text-neonPink transition-colors" size={32} />
                      <p className="text-gray-400 font-medium text-xs">Upload File</p>
                    </label>
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-xl text-sm">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
              </div>
            )}

            {step === 'camera' && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4]">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-8 flex justify-center gap-6 px-8">
                    <button 
                      onClick={() => { stopCamera(); setStep('upload'); }}
                      className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
                    >
                      <X size={24} />
                    </button>
                    <button 
                      onClick={captureFrame}
                      className="w-16 h-16 rounded-full bg-neonPink flex items-center justify-center text-white shadow-[0_0_20px_#ff007f] border-4 border-white/20"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-white/40" />
                    </button>
                    <button 
                      onClick={startCamera} // Refresh camera
                      className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
                    >
                      <RefreshCw size={24} />
                    </button>
                </div>
                <div className="absolute top-4 left-0 right-0 text-center">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/80 uppercase tracking-widest">
                        Align receipt in center
                    </span>
                </div>
              </div>
            )}

            {step === 'scanning' && (
              <div className="py-12 text-center">
                <div className="relative inline-block">
                  <Loader2 className="animate-spin text-neonPink mb-6 mx-auto" size={64} />
                  <motion.div 
                    className="absolute inset-0 border-t-2 border-neonPink rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">Analyzing Receipt...</h3>
                <p className="text-gray-400">Our AI is extracting transaction details</p>
                
                <div className="w-full bg-white/10 h-1 rounded-full mt-8 overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-neonPink h-full w-1/2 shadow-[0_0_10px_#ff007f]"
                  />
                </div>
              </div>
            )}

            {step === 'result' && (
              <div className="text-center">
                <div className="bg-green-500/20 text-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold mb-6 text-white text-3xl font-bold">Successfully Scanned</h3>
                
                <div className="bg-white/5 rounded-2xl p-6 text-left border border-white/5 mb-8">
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-400">Description</span>
                    <span className="text-white font-medium">{result?.description}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-400">Amount</span>
                    <span className="text-neonPink font-bold">₹{result?.amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-400">Category</span>
                    <span className="text-white font-medium">{result?.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-green-500 font-medium">{((result?.confidence || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-neonPink hover:bg-accentPink text-white font-bold py-3 rounded-xl transition-all glow-pink"
                >
                  Confirm & View
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ScanReceiptModal;
