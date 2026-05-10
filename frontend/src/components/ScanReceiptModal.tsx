"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, CheckCircle, AlertCircle, FileSearch, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { createWorker } from 'tesseract.js';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'upload' | 'camera' | 'scanning' | 'result'>('upload');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);

  // Initialize Worker
  useEffect(() => {
    if (isOpen && !workerRef.current) {
      const initWorker = async () => {
        const worker = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        });
        workerRef.current = worker;
      };
      initWorker();
    }
  }, [isOpen]);

  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(e.target?.result as string);
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg > 140 ? 255 : 0;
          }
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleScan = async (file: File) => {
    setStep('scanning');
    setOcrProgress(0);
    setError(null);
    try {
      if (!workerRef.current) {
        throw new Error("AI Worker not ready");
      }

      // 1. Preprocess
      const processedImage = await preprocessImage(file);

      // 2. OCR
      const { data: { text } } = await workerRef.current.recognize(processedImage);
      console.log("Extracted Text:", text);

      // 3. Parse
      let amount = 0;
      let description = "Unknown Merchant";
      
      const amountMatches = text.match(/(?:₹|Rs\.?|\$|paid|amount|pay|Total)\s*[:\-]?\s*([\d,]+\.?\d*)/gi);
      if (amountMatches) {
        const amounts = amountMatches.map(m => {
          const num = m.match(/[\d,]+\.?\d*/);
          return num ? parseFloat(num[0].replace(/,/g, '')) : 0;
        }).filter(a => a > 0);
        if (amounts.length > 0) amount = Math.max(...amounts);
      }
      
      if (!amount) {
        const fallbackMatch = text.match(/\b([\d,]+\.\d{2})\b/);
        if (fallbackMatch) amount = parseFloat(fallbackMatch[1].replace(/,/g, ''));
      }

      const inlineText = text.replace(/\n/g, ' ');
      const paidToMatch = inlineText.match(/(?:paid to|paying|sent to|receiver|to|merchant)\s*[:\-]?\s*([A-Za-z\s]{3,30})(?:\s+\d|\s+₹|$|at)/i);
      if (paidToMatch) {
        description = paidToMatch[1].trim();
      } else {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3 && /^[A-Za-z\s]+$/.test(l));
        if (lines.length > 0) description = lines[0];
      }

      const scanResult = {
        description: description.replace(/\s+/g, ' ').trim(),
        amount: amount,
        category: "Shopping",
        confidence: 0.92
      };

      setResult(scanResult);
      
      // Auto-save
      await axios.post('/api/transactions', {
        description: scanResult.description,
        amount: -Math.abs(scanResult.amount || 0),
        date: new Date().toISOString().split('T')[0],
        category: scanResult.category
      });

      setStep('result');
      onSuccess();
    } catch (err) {
      console.error("Scan error", err);
      setError("AI Processing failed. Please try again with a clearer image.");
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
      }, 5000); // Check every 5 seconds for automatic capture if needed, though button is preferred
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
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
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
            className="glass-card w-full max-w-md p-8 relative border-neonPink/30 shadow-[0_0_50px_rgba(255,0,127,0.1)]"
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
                  accept="image/*" 
                  onChange={onFileChange} 
                />
                <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={startCamera}
                      className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-neonPink/50 hover:bg-white/5 transition-all cursor-pointer group flex flex-col items-center justify-center gap-3"
                    >
                      <Camera className="text-gray-500 group-hover:text-neonPink transition-colors" size={36} />
                      <p className="text-gray-400 font-medium text-xs">Live Camera</p>
                    </button>
                    <label 
                      htmlFor="receipt-upload"
                      className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-neonPink/50 hover:bg-white/5 transition-all cursor-pointer group flex flex-col items-center justify-center gap-3"
                    >
                      <FileSearch className="text-gray-500 group-hover:text-neonPink transition-colors" size={36} />
                      <p className="text-gray-400 font-medium text-xs">Upload File</p>
                    </label>
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">
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
                      onClick={startCamera}
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
                <div className="relative inline-block mb-6">
                  <Loader2 className="animate-spin text-neonPink mx-auto" size={64} />
                </div>
                <h3 className="text-xl font-bold mb-2">Analyzing Receipt...</h3>
                <p className="text-gray-400 text-sm">Extracting details using AI</p>
                
                <div className="w-full bg-white/10 h-2 rounded-full mt-8 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${ocrProgress}%` }}
                    className="bg-neonPink h-full shadow-[0_0_10px_#ff007f]"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-tighter">{ocrProgress}% Complete</p>
              </div>
            )}

            {step === 'result' && (
              <div className="text-center">
                <div className="bg-green-500/20 text-green-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white">Scanned Successfully</h3>
                
                <div className="bg-white/5 rounded-2xl p-6 text-left border border-white/5 mb-8 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Merchant</span>
                    <span className="text-white font-medium text-sm">{result?.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Amount</span>
                    <span className="text-neonPink font-bold text-lg">₹{result?.amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Category</span>
                    <span className="text-emerald-400 font-medium text-sm">{result?.category}</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-neonPink hover:bg-accentPink text-white font-bold py-4 rounded-xl transition-all glow-pink"
                >
                  Done
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
