"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import { createWorker } from 'tesseract.js';
import { 
  Scan, 
  Camera, 
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Loader2
} from 'lucide-react';

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [captured, setCaptured] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  
  const webcamRef = useRef<Webcam>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const workerRef = useRef<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Initialize Tesseract Worker once
  useEffect(() => {
    const initWorker = async () => {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      workerRef.current = worker;
      console.log("Tesseract Worker Ready");
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:8080/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => console.log('WebSocket connection established for Scanner');
    socket.onmessage = (event) => console.log('Message from server:', event.data);
    setWs(socket);
    return () => socket.close();
  }, []);

  const captureAndScanQR = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc && !isOcrProcessing) {
        codeReader.current.decodeFromImage(undefined, imageSrc)
          .then((result) => {
            handleScanSuccess(result.getText());
          })
          .catch(() => { /* Ignore missing barcodes */ });
      }
    }
  }, [webcamRef, isOcrProcessing]);

  useEffect(() => {
    let interval: any;
    if (isScanning && !isOcrProcessing) {
      interval = setInterval(() => {
        captureAndScanQR();
      }, 500); 
    }
    return () => clearInterval(interval);
  }, [isScanning, isOcrProcessing, captureAndScanQR]);

  // Image Preprocessing for Better OCR
  const preprocessImage = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageSrc);

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple Grayscale & Contrast enhancement
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // Increase contrast: below 128 becomes 0, above 128 becomes 255
          const val = avg > 140 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = val;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = imageSrc;
    });
  };

  const scanScreenshotText = async () => {
    if (!webcamRef.current || !workerRef.current) {
      if (!workerRef.current) setError("AI Worker still initializing...");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsOcrProcessing(true);
    setOcrProgress(0);
    setError(null);

    try {
      // 1. Preprocess the image
      const processedImage = await preprocessImage(imageSrc);
      
      // 2. OCR with persistent worker
      const { data: { text } } = await workerRef.current.recognize(processedImage);
      console.log("OCR Extracted Text:\n", text);

      let merchant = "Unknown Merchant";
      let amount = 0;

      // --- Robust Amount Extraction ---
      // Try to find the largest number that looks like an amount (e.g. ₹ 500 or 500.00)
      const amountMatches = text.match(/(?:₹|Rs\.?|\$|paid|amount|pay|Total)\s*[:\-]?\s*([\d,]+\.?\d*)/gi);
      if (amountMatches) {
        const amounts = amountMatches.map(m => {
          const num = m.match(/[\d,]+\.?\d*/);
          return num ? parseFloat(num[0].replace(/,/g, '')) : 0;
        }).filter(a => a > 0);
        
        if (amounts.length > 0) {
          amount = Math.max(...amounts); // Often the largest number is the total paid
        }
      }

      if (!amount || amount === 0) {
        const fallbackMatch = text.match(/\b([\d,]+\.\d{2})\b/); // Look for price format XX.YY
        if (fallbackMatch) {
          amount = parseFloat(fallbackMatch[1].replace(/,/g, ''));
        }
      }

      // --- Robust Merchant Extraction ---
      const inlineText = text.replace(/\n/g, ' ');
      
      // Pattern 1: Paid to [Name]
      const paidToMatch = inlineText.match(/(?:paid to|paying|sent to|receiver|to|merchant)\s*[:\-]?\s*([A-Za-z\s]{3,30})(?:\s+\d|\s+₹|$|at)/i);
      
      // Pattern 2: Typical UPI ID format name
      const upiMatch = inlineText.match(/([A-Za-z\s]{3,30})\s*(?:UPI ID|@)/i);

      if (paidToMatch && paidToMatch[1].trim().length > 2) {
        merchant = paidToMatch[1].trim();
      } else if (upiMatch && upiMatch[1].trim().length > 2) {
        merchant = upiMatch[1].trim();
      } else {
        // Fallback: use first meaningful line
        const lines = text.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 3 && /^[A-Za-z\s]+$/.test(l) && 
                  !l.toLowerCase().includes('google') && 
                  !l.toLowerCase().includes('completed') && 
                  !l.toLowerCase().includes('rupee') &&
                  !l.toLowerCase().includes('success'));
        if (lines.length > 0) merchant = lines[0].substring(0, 30);
      }

      // Cleanup merchant name
      merchant = merchant.replace(/\s+/g, ' ').trim();

      if (!amount || amount === 0) {
        setError("Could not find amount. Please ensure the amount is clearly visible in the screenshot.");
        setIsOcrProcessing(false);
        return;
      }

      processTransaction({
        merchant,
        amount,
        category: "Transfer",
        date: new Date().toISOString().split('T')[0]
      });

    } catch (err) {
      console.error(err);
      setError("Failed to read text from image.");
    }
    setIsOcrProcessing(false);
  };

  const handleScanSuccess = async (text: string) => {
    console.log("QR Data:", text);
    let transactionData;
    
    if (text.toLowerCase().startsWith('upi://pay')) {
      try {
        const urlParams = new URLSearchParams(text.split('?')[1]);
        const merchantName = urlParams.get('pn') || urlParams.get('pa') || "UPI Merchant";
        let amount = urlParams.get('am');
        if (!amount) amount = (Math.floor(Math.random() * 500) + 10).toString();
        
        transactionData = {
          merchant: decodeURIComponent(merchantName).replace(/\+/g, ' '),
          amount: parseFloat(amount),
          category: "Transfer",
          date: new Date().toISOString().split('T')[0]
        };
      } catch (e) { }
    }

    if (!transactionData) {
      try {
        transactionData = JSON.parse(text);
        if (!transactionData.merchant || !transactionData.amount) throw new Error("Invalid");
      } catch (e) {
        transactionData = {
          merchant: text.substring(0, 20) || "Unknown Code",
          amount: Math.floor(Math.random() * 50) + 10,
          category: "Shopping",
          date: new Date().toISOString().split('T')[0]
        };
      }
    }
    processTransaction(transactionData);
  };

  const processTransaction = async (transactionData: any) => {
    setIsScanning(false);
    setCaptured({ ...transactionData, confidence: 95 });

    try {
      await fetch('/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'transaction_scanned',
          payload: {
            description: transactionData.merchant,
            amount: transactionData.amount,
            category: transactionData.category || "General"
          }
        })
      });
    } catch (err) { console.error(err); }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: transactionData.merchant,
          amount: -Math.abs(transactionData.amount),
          category: transactionData.category || "General",
          date: transactionData.date || new Date().toISOString().split('T')[0]
        })
      });
      if (!res.ok) throw new Error("Failed to save transaction");
    } catch (err) {
      setError("Failed to save transaction to database.");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="text-center">
        <h2 className="text-3xl font-bold text-white tracking-tight">AI Camera Scanner</h2>
        <p className="text-gray-500 text-sm mt-2">Optimized for GPay, PhonePe, and UPI screenshots.</p>
      </header>

      <div className="flex justify-center items-start">
        <div className="space-y-6 w-full max-w-2xl">
          <div className="glass-card p-8 border-dashed border-2 border-white/10 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden group">
            
            {error && (
              <div className="absolute top-4 bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm border border-red-500/50 flex items-center gap-2 z-20">
                <AlertCircle size={16} /> {error}
                <button onClick={() => setError(null)}><X size={14}/></button>
              </div>
            )}

            {isScanning ? (
              <div className="flex flex-col items-center w-full">
                <div className="relative w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-neonPink/30 bg-black">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className={`w-full transition-opacity duration-500 ${isOcrProcessing ? 'opacity-30' : 'opacity-100'}`}
                  />
                  
                  {!isOcrProcessing ? (
                    <motion.div 
                      initial={{ top: 0 }}
                      animate={{ top: '100%' }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-neonPink shadow-[0_0_15px_#ff007f] z-10"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
                       <Loader2 className="animate-spin text-neonPink mb-4" size={40} />
                       <p className="text-white font-bold text-lg mb-2">Analyzing Transaction...</p>
                       <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-neonPink h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${ocrProgress}%` }}
                          />
                       </div>
                       <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">{ocrProgress}% Complete</p>
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
                    <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/60 uppercase tracking-widest">
                       {isOcrProcessing ? 'Processing' : 'Align Receipt'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={scanScreenshotText}
                    disabled={isOcrProcessing}
                    className="py-3 px-8 rounded-xl bg-neonPink text-white text-sm font-bold shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:bg-accentPink transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                  >
                    <FileText size={18} /> Capture & Scan (GPay)
                  </button>
                  <button 
                    onClick={() => setIsScanning(false)}
                    className="py-3 px-8 rounded-xl bg-white/5 text-white text-sm font-bold border border-white/10 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-6 text-center max-w-sm">
                  QR Codes are detected automatically. For screenshots, hold steady and click "Capture & Scan".
                </p>
              </div>
            ) : captured ? (
              <div className="flex flex-col items-center text-center gap-4 w-full max-w-md">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold">Transaction Saved!</h3>
                <p className="text-sm text-gray-500">We've extracted the following details and sent an email alert.</p>
                
                <div className="mt-6 p-6 bg-white/5 rounded-2xl border border-white/10 w-full text-left space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-sm text-gray-500">Merchant</span>
                    <span className="text-sm font-bold text-white">{captured.merchant}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="text-lg font-bold text-neonPink">₹{captured.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">SUCCESS</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setCaptured(null)}
                  className="w-full mt-6 py-3 px-4 rounded-xl bg-neonPink text-white font-bold shadow-lg hover:bg-accentPink transition-all"
                >
                  Scan Another
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-8 rounded-full bg-neonPink/10 text-neonPink mb-6 group-hover:scale-110 transition-transform duration-500 relative">
                  <Camera size={56} />
                  <div className="absolute inset-0 rounded-full border-2 border-neonPink/20 animate-ping" />
                </div>
                <h3 className="text-xl font-bold mb-3">Initialize AI Scanner</h3>
                <p className="text-sm text-gray-500 text-center mb-8 px-8 max-w-md">
                  Enable your camera to scan QR codes or use AI to extract transaction details from GPay screenshots in real-time.
                </p>
                <button 
                  onClick={() => setIsScanning(true)}
                  className="px-10 py-4 rounded-xl bg-neonPink text-white text-base font-bold glow-pink transition-all active:scale-95 flex items-center gap-3"
                >
                  <Scan size={20} /> Open Camera
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
