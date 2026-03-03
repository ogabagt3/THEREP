/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './utils/cropImage';
import { 
  ArrowUp,
  ArrowDown,
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle,
  ChevronRight,
  Globe,
  Clock,
  Plus,
  FileText,
  BrainCircuit,
  Maximize2,
  Minimize2,
  X,
  Trash2,
  User,
  Settings,
  ChevronDown,
  Camera,
  Menu,
  CheckCircle2,
  ListTodo,
  LayoutDashboard
} from 'lucide-react';
import { analyzeMarket, PairAnalysis } from './services/geminiService';
import { fetchRealTimePrice, fetchNewsHeadlines, PriceData, NewsHeadline } from './services/marketDataService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_PAIRS = [
  'EUR/USD',
  'USD/JPY',
  'XAU/USD',
  'GBP/USD',
  'EUR/JPY',
  'EUR/GBP',
  'US100',
  'US30'
];

interface UserProfile {
  name: string;
  avatar: string;
  tradingStyle: string;
  experience: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Trader',
  avatar: 'https://picsum.photos/seed/trader/200/200',
  tradingStyle: 'Day Trader',
  experience: 'Intermediate'
};

const ProfileModal = ({ profile, onSave, onClose }: { profile: UserProfile, onSave: (p: UserProfile) => void, onClose: () => void }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (croppedImage) {
          setEditedProfile({ ...editedProfile, avatar: croppedImage });
          setImageToCrop(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-lg bg-white border border-[#f1f1ef] rounded-lg overflow-hidden shadow-2xl flex flex-col font-roboto"
      >
        <div className="p-6 border-b border-[#f1f1ef] flex justify-between items-center bg-[#f7f6f3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2383e2] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#37352f]">Edit Profile</h2>
              <p className="text-[10px] font-mono text-[#787774] uppercase tracking-widest">Personalize your dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f1f1ef] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#787774]" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {imageToCrop ? (
            <div className="space-y-4">
              <div className="relative h-64 w-full bg-[#f1f1ef] rounded-lg overflow-hidden">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#37352f] uppercase tracking-widest">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#f1f1ef] rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setImageToCrop(null)}
                  className="flex-1 py-2 text-sm font-medium text-[#787774] hover:bg-[#f1f1ef] rounded transition-colors border border-[#f1f1ef]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCropSave}
                  className="flex-1 py-2 text-sm font-medium bg-black text-white rounded hover:bg-[#37352f] transition-colors"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <img 
                    src={editedProfile.avatar} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full border-4 border-[#f1f1ef] object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <div className="absolute bottom-0 right-0">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-black text-white rounded-full shadow-lg hover:bg-[#37352f] transition-all"
                      title="Upload Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#37352f] uppercase tracking-widest">Display Name</label>
                  <input 
                    type="text" 
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                    className="w-full bg-white border border-[#f1f1ef] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2383e2]/20 transition-all outline-none shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#37352f] uppercase tracking-widest">Trading Style</label>
                    <div className="relative group">
                      <select 
                        value={editedProfile.tradingStyle}
                        onChange={(e) => setEditedProfile({...editedProfile, tradingStyle: e.target.value})}
                        className="w-full bg-white border border-[#f1f1ef] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2383e2]/20 transition-all appearance-none outline-none shadow-sm hover:border-[#787774]/30 cursor-pointer"
                      >
                        <option>Day Trader</option>
                        <option>Swing Trader</option>
                        <option>Scalper</option>
                        <option>Position Trader</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774] pointer-events-none group-hover:text-[#37352f] transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#37352f] uppercase tracking-widest">Experience</label>
                    <div className="relative group">
                      <select 
                        value={editedProfile.experience}
                        onChange={(e) => setEditedProfile({...editedProfile, experience: e.target.value})}
                        className="w-full bg-white border border-[#f1f1ef] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2383e2]/20 transition-all appearance-none outline-none shadow-sm hover:border-[#787774]/30 cursor-pointer"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Institutional</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774] pointer-events-none group-hover:text-[#37352f] transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-[#f7f6f3] border-t border-[#f1f1ef] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white border border-[#f1f1ef] text-[#787774] text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-[#f1f1ef]"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(editedProfile)}
            className="flex-1 py-2.5 rounded-xl bg-black text-white text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-[#37352f]"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const TypingHeader = ({ text }: { text: string }) => {
  const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1);
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(capitalizedText.slice(0, i + 1));
      i++;
      if (i >= capitalizedText.length) {
        clearInterval(timer);
        setIsComplete(true);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [capitalizedText]);

  return (
    <h2 className="text-3xl font-bold tracking-tight mb-2 min-h-[40px]">
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-1 h-8 bg-[#2383e2] ml-1 align-middle"
        />
      )}
    </h2>
  );
};

interface MarketCardProps {
  analysis: PairAnalysis | null;
  pair: string;
  onRefresh: () => void;
  onRemove?: () => void;
  onDetails?: (analysis: PairAnalysis) => void;
  onInsights?: (analysis: PairAnalysis) => void;
  isLoading: boolean;
  retryStatus?: { attempt: number, delay: number } | null;
}

const PriceMarquee = () => {
  const [prices, setPrices] = useState<PriceData[]>([
    { symbol: 'EUR/USD', price: '1.0842', change: '0.00', changePercent: '+0.12%' },
    { symbol: 'USD/JPY', price: '149.52', change: '0.00', changePercent: '-0.05%' },
    { symbol: 'GBP/USD', price: '1.2654', change: '0.00', changePercent: '+0.08%' },
    { symbol: 'XAU/USD', price: '2034.15', change: '0.00', changePercent: '+0.45%' },
    { symbol: 'AAPL', price: '182.31', change: '0.00', changePercent: '-1.20%' },
    { symbol: 'TSLA', price: '193.57', change: '0.00', changePercent: '+2.15%' },
    { symbol: 'NVDA', price: '726.13', change: '0.00', changePercent: '+4.50%' },
    { symbol: 'BTC/USD', price: '51234.50', change: '0.00', changePercent: '+1.10%' }
  ]);
  const marqueePairs = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'XAU/USD', 'AAPL', 'TSLA', 'NVDA', 'BTC/USD'];

  useEffect(() => {
    const fetchPrices = async () => {
      const results: PriceData[] = [];
      // Stagger requests to avoid Alpha Vantage rate limits (5 calls per minute)
      for (const pair of marqueePairs) {
        const result = await fetchRealTimePrice(pair);
        if (result) {
          results.push(result);
        }
        // Wait 12 seconds between each request to stay within 5 calls/min limit
        await new Promise(resolve => setTimeout(resolve, 12000));
      }
      
      if (results.length > 0) {
        setPrices(prev => {
          // Merge new results with existing ones, prioritizing new ones
          const newPrices = [...prev];
          results.forEach(res => {
            const index = newPrices.findIndex(p => p.symbol === res.symbol);
            if (index !== -1) {
              newPrices[index] = res;
            } else {
              newPrices.push(res);
            }
          });
          return newPrices;
        });
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // Update every 5 minutes to stay safe
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#f7f6f3] py-4 overflow-hidden whitespace-nowrap border-b border-[#f1f1ef]">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex w-fit"
      >
        <div className="flex gap-6 px-3">
          {[...prices, ...prices, ...prices, ...prices].map((price, i) => (
            <div key={i} className="flex items-center gap-3 border border-black rounded-xl px-4 py-2 bg-white shadow-sm shrink-0">
              <span className="text-[10px] font-black tracking-widest uppercase text-[#37352f]">{price.symbol}</span>
              <span className="text-xs font-mono font-bold text-[#37352f]">{price.price}</span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                price.changePercent.startsWith('-') ? "bg-[#ffebe6] text-[#de350b]" : "bg-[#e3fcef] text-[#00875a]"
              )}>
                {price.changePercent}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const MarketCard = ({ analysis, pair, onRefresh, onRemove, onDetails, onInsights, isLoading, retryStatus, featured = false }: MarketCardProps & { featured?: boolean }) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const getBiasColor = (bias: string) => {
    switch (bias) {
      case 'bullish': return 'text-[#00875a] bg-[#e3fcef] border-[#00875a]/20';
      case 'bearish': return 'text-[#de350b] bg-[#ffebe6] border-[#de350b]/20';
      default: return 'text-[#37352f] bg-[#f1f1ef] border-[#37352f]/20';
    }
  };

  return (
    <motion.div 
      layout
      transition={{ 
        layout: { type: "spring", stiffness: 160, damping: 22 },
        opacity: { duration: 0.2 }
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => setIsMinimized(!isMinimized)}
      className={cn(
        "notion-card relative flex flex-col gap-4 group cursor-pointer overflow-hidden transition-shadow duration-300",
        isMinimized ? "p-4 h-auto" : "p-6 h-full",
        !isMinimized && "shadow-xl border-[#2383e2]/20 ring-1 ring-[#2383e2]/5",
        !isMinimized && "bento-featured",
        isMinimized && "hover:shadow-md hover:border-[#37352f]/20"
      )}
    >
      <motion.div layout className="flex justify-between items-start">
        <motion.div layout className="flex items-center gap-3">
          <motion.div layout className="w-8 h-8 rounded flex items-center justify-center bg-[#f1f1ef]">
            <Globe className="w-4 h-4 text-[#37352f]" />
          </motion.div>
          <motion.div layout>
            <motion.h3 layout className={cn("font-bold tracking-tight text-[#37352f]", isMinimized ? "text-sm" : "text-base")}>{pair}</motion.h3>
            {!isMinimized && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 mt-0.5"
              >
                {analysis && (
                  <span className={cn("text-[10px] font-black uppercase px-1.5 py-0.5 rounded border tracking-wider", getBiasColor(analysis.bias))}>
                    {analysis.bias}
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
        <motion.div layout className="flex items-center gap-2">
          {/* macOS Style Buttons */}
          {onRemove && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(true); }} 
              className={cn(
                "w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-all shadow-sm flex items-center justify-center group/btn",
                isMinimized ? "opacity-0 group-hover:opacity-100" : "opacity-100"
              )}
              title="Remove"
            >
              <Trash2 className="w-2 h-2 text-[#4c0000]" />
            </button>
          )}
        </motion.div>
      </motion.div>

      {isLoading ? (
        <motion.div layout className={cn("flex flex-col items-center justify-center gap-3", isMinimized ? "py-4" : "py-12 flex-1")}>
          <BrainCircuit className="w-6 h-6 text-[#2383e2] animate-pulse" />
          {!isMinimized && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono text-[#37352f] font-black uppercase tracking-widest">Synthesizing...</span>
              {retryStatus && (
                <span className="text-[8px] font-mono text-[#de350b] uppercase tracking-tighter animate-pulse">
                  Rate Limit Hit: Retrying ({retryStatus.attempt}/5)
                </span>
              )}
            </motion.div>
          )}
        </motion.div>
      ) : analysis ? (
        <>
          <motion.div layout className="flex gap-3 items-stretch">
            {!isMinimized && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-1 bg-[#f1f1ef] rounded-full overflow-hidden flex flex-col justify-end"
              >
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${analysis.confidence}%` }}
                  className={cn(
                    "w-full rounded-full transition-all duration-1000",
                    analysis.bias === 'bullish' ? "bg-[#00875a]" : 
                    analysis.bias === 'bearish' ? "bg-[#de350b]" : "bg-[#37352f]"
                  )}
                />
              </motion.div>
            )}
            <motion.div layout className="flex-1 flex gap-2">
              {(() => {
                const parts = pair.split('/');
                const base = parts[0];
                const quote = parts[1];
                const isBullish = analysis.bias === 'bullish';
                const isBearish = analysis.bias === 'bearish';
                
                return (
                  <>
                    <motion.div layout className={cn(
                      "flex-1 border border-black rounded-xl flex items-center justify-center gap-2 bg-white shadow-sm transition-all",
                      isMinimized ? "p-2" : "p-3"
                    )}>
                      <motion.span layout className="text-[10px] font-black text-[#37352f] uppercase tracking-wider">{base}</motion.span>
                      <motion.div layout>
                        {isBullish ? (
                          <ArrowUp className="w-4 h-4 text-[#00875a]" />
                        ) : isBearish ? (
                          <ArrowDown className="w-4 h-4 text-[#de350b]" />
                        ) : (
                          <Minus className="w-4 h-4 text-[#787774]" />
                        )}
                      </motion.div>
                    </motion.div>
                    {quote && (
                      <motion.div layout className={cn(
                        "flex-1 border border-black rounded-xl flex items-center justify-center gap-2 bg-white shadow-sm transition-all",
                        isMinimized ? "p-2" : "p-3"
                      )}>
                        <motion.span layout className="text-[10px] font-black text-[#37352f] uppercase tracking-wider">{quote}</motion.span>
                        <motion.div layout>
                          {isBullish ? (
                            <ArrowDown className="w-4 h-4 text-[#de350b]" />
                          ) : isBearish ? (
                            <ArrowUp className="w-4 h-4 text-[#00875a]" />
                          ) : (
                            <Minus className="w-4 h-4 text-[#787774]" />
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col gap-4 flex-1 overflow-hidden"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded",
                      analysis.change.startsWith('+') ? "text-[#00875a] bg-[#e3fcef]" : "text-[#de350b] bg-[#ffebe6]"
                    )}>
                      {analysis.change}
                    </span>
                    <span className="text-[#37352f]">Updated {analysis.lastUpdate}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className="flex items-center justify-between w-full text-[10px] font-black text-[#37352f] uppercase tracking-wider border-b border-[#f1f1ef] pb-1.5 group/header"
                  >
                    <span>Key Drivers</span>
                    <ChevronRight className={cn("w-3 h-3 transition-transform duration-300", isExpanded && "rotate-90")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.ul 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden pt-1"
                      >
                        {analysis.keyFactors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-[12px] text-[#37352f] leading-snug">
                            <div className="mt-1.5 w-1 h-1 rounded-full bg-[#37352f]/20 shrink-0" />
                            <span className="line-clamp-2">{factor}</span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-auto pt-4 flex gap-2 relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); analysis && onDetails?.(analysis); }}
                    className="flex-1 py-1.5 rounded bg-[#f1f1ef] hover:bg-[#e8e8e6] text-[10px] font-bold uppercase tracking-wider transition-colors text-[#37352f]"
                  >
                    Details
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); analysis && onInsights?.(analysis); }}
                    className="flex-1 py-1.5 rounded bg-[#2383e2]/10 hover:bg-[#2383e2]/20 text-[#2383e2] text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Insights
                  </button>
                </div>

                {/* Inline Confirmation moved inside the main card container but outside the expanded block */}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showConfirmDelete && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-xl border border-black shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 rounded-full bg-[#ffebe6] flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-[#de350b]" />
                </div>
                <h4 className="text-base font-bold text-[#37352f] mb-1">Remove {pair}?</h4>
                <p className="text-[10px] text-[#37352f] mb-6 uppercase tracking-widest font-black">This action cannot be undone.</p>
                <div className="flex gap-3 w-full max-w-[200px]">
                  <button 
                    onClick={() => setShowConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-black text-black text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-[#f7f6f3]"
                  >
                    No
                  </button>
                  <button 
                    onClick={() => { onRemove?.(); setShowConfirmDelete(false); }}
                    className="flex-1 py-2.5 rounded-xl bg-black text-white text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-[#37352f]"
                  >
                    Yes
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className={cn("flex items-center justify-center", isMinimized ? "py-2" : "py-12 flex-1")}>
          <button 
            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
            className="text-[10px] font-bold text-[#787774] hover:text-[#37352f] transition-all uppercase border border-[#f1f1ef] px-4 py-2 rounded hover:bg-[#f1f1ef]"
          >
            Initialize
          </button>
        </div>
      )}
    </motion.div>
  );
};

const DetailsModal = ({ analysis, onClose }: { analysis: PairAnalysis, onClose: () => void }) => {
  const [newsHeadlines, setNewsHeadlines] = useState<NewsHeadline[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    const loadNews = async () => {
      setLoadingNews(true);
      const headlines = await fetchNewsHeadlines(analysis.pair);
      setNewsHeadlines(headlines);
      setLoadingNews(false);
    };
    // Disable automatic news fetching to save API requests
    // loadNews();
  }, [analysis.pair]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-3xl bg-white border border-[#f1f1ef] rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-[#f1f1ef] flex justify-between items-center bg-[#f7f6f3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#37352f] flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#37352f]">{analysis.pair} Deep Analysis</h2>
              <p className="text-[10px] font-mono text-[#37352f] font-black uppercase tracking-widest">Institutional Intelligence Report</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f1f1ef] rounded-full transition-colors">
            <X className="w-6 h-6 text-[#787774]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-10">
            {/* Full Confidence Bar Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-[#37352f] uppercase tracking-widest">AI Confidence Score</h4>
                  <div className="text-3xl font-bold text-[#37352f]">{analysis.confidence}%</div>
                </div>
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border mb-1",
                  analysis.bias === 'bullish' ? "text-[#00875a] bg-[#e3fcef] border-[#00875a]/20" : 
                  analysis.bias === 'bearish' ? "text-[#de350b] bg-[#ffebe6] border-[#de350b]/20" : 
                  "text-[#37352f] bg-[#f1f1ef] border-[#37352f]/20"
                )}>
                  {analysis.bias} Bias
                </div>
              </div>
              <div className="h-4 w-full bg-[#f1f1ef] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.confidence}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full transition-all",
                    analysis.bias === 'bullish' ? "bg-[#00875a]" : 
                    analysis.bias === 'bearish' ? "bg-[#de350b]" : "bg-[#37352f]"
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Left Column: Key Drivers */}
              <div className="md:col-span-1 space-y-4">
                <h4 className="text-[10px] font-black text-[#37352f] uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Key Drivers
                </h4>
                <ul className="space-y-3">
                  {analysis.keyFactors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-[#37352f] leading-relaxed">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#37352f]/20 shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column: News Bullet Points */}
              <div className="md:col-span-2 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-[#37352f] uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Market Intelligence (AI Synthesized)
                  </h4>
                  <div className="space-y-6">
                    {analysis.news.map((item, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex gap-4 group"
                      >
                        <div className="mt-2 w-2 h-2 rounded-full border-2 border-[#2383e2] shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <h5 className="font-bold text-sm text-[#37352f] group-hover:text-[#2383e2] transition-colors">
                              {item.title}
                            </h5>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-[#787774] uppercase tracking-widest bg-[#f1f1ef] px-2 py-0.5 rounded">
                                {item.source}
                              </span>
                              <span className={cn(
                                "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-tighter",
                                item.sentiment === 'bullish' ? "text-[#00875a] bg-[#e3fcef] border-[#00875a]/20" : 
                                item.sentiment === 'bearish' ? "text-[#de350b] bg-[#ffebe6] border-[#de350b]/20" : 
                                "text-[#787774] bg-[#f1f1ef] border-[#787774]/20"
                              )}>
                                {item.sentiment}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-[#787774] leading-relaxed">
                            {item.summary}
                          </p>
                          {item.url && (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2383e2] hover:underline"
                            >
                              Full Article <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* NewsAPI Headlines Section */}
                <div className="space-y-4 pt-6 border-t border-[#f1f1ef]">
                  <h4 className="text-[10px] font-black text-[#37352f] uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    Latest Headlines (NewsAPI)
                  </h4>
                  {loadingNews ? (
                    <div className="flex items-center gap-2 py-4">
                      <RefreshCw className="w-3 h-3 animate-spin text-[#2383e2]" />
                      <span className="text-[10px] font-mono text-[#787774] uppercase tracking-widest">Fetching live news...</span>
                    </div>
                  ) : newsHeadlines.length > 0 ? (
                    <div className="grid gap-3">
                      {newsHeadlines.map((headline, i) => (
                        <motion.a
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={i}
                          href={headline.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-[#f7f6f3] hover:bg-[#f1f1ef] rounded border border-transparent hover:border-[#2383e2]/20 transition-all group"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <p className="text-xs font-bold text-[#37352f] group-hover:text-[#2383e2] transition-colors line-clamp-2">
                              {headline.title}
                            </p>
                            <ExternalLink className="w-3 h-3 text-[#787774] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-bold text-[#787774] uppercase tracking-widest">{headline.source}</span>
                            <span className="text-[9px] text-[#787774] opacity-40">•</span>
                            <span className="text-[9px] text-[#787774]">{new Date(headline.publishedAt).toLocaleDateString()}</span>
                          </div>
                        </motion.a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#787774] italic">No recent headlines found for this pair.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#f7f6f3] border-t border-[#f1f1ef] flex items-center px-8">
          <div className="flex items-center gap-4 text-[10px] font-mono text-[#787774]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Synthesized: {analysis.lastUpdate}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const InsightsModal = ({ analysis, onClose }: { analysis: PairAnalysis, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-2xl bg-white border border-[#f1f1ef] rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-[#f1f1ef] flex justify-between items-center bg-[#f7f6f3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#2383e2] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#37352f]">{analysis.pair} Beginner Insights</h2>
              <p className="text-[10px] font-mono text-[#787774] uppercase tracking-widest">AI-Simplified Market Logic</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f1f1ef] rounded-full transition-colors">
            <X className="w-6 h-6 text-[#787774]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-8">
            {/* Minimized Confidence Indicator */}
            <div className="flex items-center justify-between p-4 bg-[#f7f6f3] rounded-lg border border-[#f1f1ef]">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  analysis.bias === 'bullish' ? "bg-[#00875a]" : 
                  analysis.bias === 'bearish' ? "bg-[#de350b]" : "bg-[#37352f]"
                )} />
                <span className="text-xs font-black text-[#37352f] uppercase tracking-wider">{analysis.bias} Bias</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#37352f] uppercase tracking-widest">AI Confidence</span>
                <span className="text-sm font-bold text-[#37352f]">{analysis.confidence}%</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-[#37352f] uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  Why is this pair {analysis.bias === 'bullish' ? 'Strong' : analysis.bias === 'bearish' ? 'Weak' : 'Neutral'}?
                </h4>
                <div className="grid gap-4">
                  {analysis.insights.map((insight, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="p-4 bg-white border border-[#f1f1ef] rounded-lg shadow-sm flex gap-4 items-start group hover:border-[#2383e2]/30 transition-colors"
                    >
                      <div className="mt-1 w-5 h-5 rounded-full bg-[#2383e2]/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#2383e2]">{i + 1}</span>
                      </div>
                      <p className="text-sm text-[#37352f] leading-relaxed">
                        {insight}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-[#2383e2]/5 rounded-xl border border-[#2383e2]/10">
                <h4 className="text-[10px] font-bold text-[#2383e2] uppercase tracking-widest mb-3">The Bottom Line</h4>
                <p className="text-sm text-[#37352f] leading-relaxed italic">
                  "{analysis.summary}"
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#f7f6f3] border-t border-[#f1f1ef] flex items-center px-8">
          <div className="flex items-center gap-4 text-[10px] font-mono text-[#787774]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Synthesized: {analysis.lastUpdate}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AVAILABLE_ASSETS = {
  Forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY'],
  Commodities: ['XAU/USD', 'XAG/USD', 'OIL', 'BRENT', 'NGAS', 'COPPER'],
  Stocks: ['US100', 'US30', 'US500', 'GER40', 'UK100', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL']
};

const CACHE_KEY = 'vantage_market_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface ChecklistItemData {
  id: string;
  text: string;
  completed: boolean;
}

interface Strategy {
  id: string;
  name: string;
  categories: {
    "Trading System": ChecklistItemData[];
    "Trade Management": ChecklistItemData[];
    "Risk Management": ChecklistItemData[];
  };
}

const ChecklistItem = ({ text, completed, onToggle, onDelete }: { text: string, completed: boolean, onToggle: () => void, onDelete: () => void }) => (
  <div className="group relative">
    <button 
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
        completed 
          ? "bg-[#f7f6f3] border-[#f1f1ef] text-[#787774]" 
          : "bg-white border-[#f1f1ef] text-[#37352f] hover:border-[#2383e2]/30 hover:shadow-sm"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
        completed ? "bg-[#2383e2] border-[#2383e2]" : "bg-white border-[#f1f1ef] group-hover:border-[#2383e2]"
      )}>
        {completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={cn("text-sm font-medium pr-8", completed && "line-through opacity-60")}>{text}</span>
    </button>
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#787774] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

const Checklist = () => {
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    const cached = localStorage.getItem('trading_strategies');
    return cached ? JSON.parse(cached) : [];
  });
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(() => {
    return localStorage.getItem('active_strategy_id');
  });
  const [showAddStrategy, setShowAddStrategy] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [activeTab, setActiveTab] = useState<keyof Strategy['categories']>('Trading System');
  const [newItemText, setNewItemText] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('trading_strategies', JSON.stringify(strategies));
    if (strategies.length > 0 && !activeStrategyId) {
      setActiveStrategyId(strategies[0].id);
    }
  }, [strategies, activeStrategyId]);

  useEffect(() => {
    if (activeStrategyId) {
      localStorage.setItem('active_strategy_id', activeStrategyId);
    }
  }, [activeStrategyId]);

  const activeStrategy = strategies.find(s => s.id === activeStrategyId);

  const handleAddStrategy = () => {
    if (!newStrategyName.trim()) return;
    const newStrategy: Strategy = {
      id: Date.now().toString(),
      name: newStrategyName,
      categories: {
        "Trading System": [],
        "Trade Management": [],
        "Risk Management": []
      }
    };
    setStrategies([...strategies, newStrategy]);
    setActiveStrategyId(newStrategy.id);
    setNewStrategyName('');
    setShowAddStrategy(false);
  };

  const handleAddItem = () => {
    if (!newItemText.trim() || !activeStrategyId) return;
    setStrategies(strategies.map(s => {
      if (s.id === activeStrategyId) {
        return {
          ...s,
          categories: {
            ...s.categories,
            [activeTab]: [
              ...s.categories[activeTab],
              { id: Date.now().toString(), text: newItemText, completed: false }
            ]
          }
        };
      }
      return s;
    }));
    setNewItemText('');
    setShowAddItemModal(false);
  };

  const toggleItem = (itemId: string) => {
    setStrategies(strategies.map(s => {
      if (s.id === activeStrategyId) {
        return {
          ...s,
          categories: {
            ...s.categories,
            [activeTab]: s.categories[activeTab].map(item => 
              item.id === itemId ? { ...item, completed: !item.completed } : item
            )
          }
        };
      }
      return s;
    }));
  };

  const deleteItem = (itemId: string) => {
    setStrategies(strategies.map(s => {
      if (s.id === activeStrategyId) {
        return {
          ...s,
          categories: {
            ...s.categories,
            [activeTab]: s.categories[activeTab].filter(item => item.id !== itemId)
          }
        };
      }
      return s;
    }));
  };

  const deleteStrategy = (strategyId: string) => {
    const updated = strategies.filter(s => s.id !== strategyId);
    setStrategies(updated);
    if (activeStrategyId === strategyId) {
      setActiveStrategyId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const allItems = activeStrategy 
    ? [...activeStrategy.categories["Trading System"], ...activeStrategy.categories["Trade Management"], ...activeStrategy.categories["Risk Management"]]
    : [];
  const progress = allItems.length > 0 
    ? Math.round((allItems.filter(i => i.completed).length / allItems.length) * 100)
    : 0;

  if (strategies.length === 0 || showAddStrategy) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-[#f1f1ef]"
        >
          <h2 className="text-2xl font-bold text-[#37352f] mb-2">Define Your Strategy</h2>
          <p className="text-[#787774] text-sm mb-6">Every successful trader follows a repeatable process. Name your strategy to begin.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[#787774] uppercase tracking-widest mb-2">Strategy Name</label>
              <input 
                type="text"
                value={newStrategyName}
                onChange={(e) => setNewStrategyName(e.target.value)}
                placeholder="e.g. Trend Following, Mean Reversion..."
                className="w-full px-4 py-3 bg-[#f7f6f3] border border-[#f1f1ef] rounded-xl text-sm focus:outline-none focus:border-[#2383e2] transition-all"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddStrategy()}
              />
            </div>
            
            <button 
              onClick={handleAddStrategy}
              disabled={!newStrategyName.trim()}
              className="w-full py-4 bg-black text-white text-xs font-bold rounded-xl hover:bg-[#37352f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Initialize Strategy
            </button>
            {strategies.length > 0 && (
              <button 
                onClick={() => setShowAddStrategy(false)}
                className="w-full py-2 text-[10px] font-black text-[#787774] uppercase tracking-widest hover:text-[#37352f]"
              >
                Cancel
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="mb-10">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-[#37352f]">{activeStrategy?.name}</h2>
              <button 
                onClick={() => activeStrategy && deleteStrategy(activeStrategy.id)}
                className="p-1.5 text-[#787774] hover:text-red-500 transition-colors"
                title="Delete Strategy"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[#787774] text-sm">Pre-trade protocol for your {activeStrategy?.name} system.</p>
          </div>
          <button 
            onClick={() => setShowAddStrategy(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#f7f6f3] border border-[#f1f1ef] rounded-lg text-[10px] font-black text-[#37352f] uppercase tracking-widest hover:bg-[#f1f1ef] transition-all"
          >
            <Plus className="w-3 h-3" />
            New Strategy
          </button>
        </div>
        
        <div className="bg-[#f7f6f3] rounded-2xl p-6 border border-[#f1f1ef]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-[#37352f] uppercase tracking-widest">Readiness Score</span>
            <span className="text-sm font-bold text-[#2383e2]">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-[#f1f1ef]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#2383e2]"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-8 p-1 bg-[#f7f6f3] rounded-xl border border-[#f1f1ef]">
        {(['Trading System', 'Trade Management', 'Risk Management'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
              activeTab === tab 
                ? "bg-white text-[#37352f] shadow-sm border border-[#f1f1ef]" 
                : "text-[#787774] hover:text-[#37352f]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-[#f1f1ef] shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-8 flex-1">
          <div className="space-y-3">
            {activeStrategy?.categories[activeTab].length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-[#f1f1ef] rounded-2xl">
                <p className="text-sm text-[#787774]">No items in this category yet.</p>
                <p className="text-xs text-[#a1a19f] mt-1">Add your first criteria below.</p>
              </div>
            ) : (
              activeStrategy?.categories[activeTab].map((item) => (
                <ChecklistItem 
                  key={item.id} 
                  text={item.text} 
                  completed={item.completed} 
                  onToggle={() => toggleItem(item.id)} 
                  onDelete={() => deleteItem(item.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-[#f1f1ef] bg-[#fcfcfb] flex justify-center">
          <button 
            onClick={() => setShowAddItemModal(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-[#f1f1ef] rounded-full shadow-sm hover:border-[#2383e2]/30 hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-[#2383e2]" />
            <span className="text-xs font-bold text-[#37352f]">Add {activeTab} Criteria</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddItemModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-[#f1f1ef]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#37352f]">Add {activeTab} Item</h3>
                <button onClick={() => setShowAddItemModal(false)} className="text-[#787774] hover:text-[#37352f]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <textarea 
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Describe your criteria..."
                  className="w-full px-4 py-3 bg-[#f7f6f3] border border-[#f1f1ef] rounded-xl text-sm focus:outline-none focus:border-[#2383e2] transition-all min-h-[100px] resize-none"
                  autoFocus
                />
                
                <button 
                  onClick={handleAddItem}
                  disabled={!newItemText.trim()}
                  className="w-full py-4 bg-black text-white text-xs font-bold rounded-xl hover:bg-[#37352f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Checklist
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [pairs, setPairs] = useState(INITIAL_PAIRS);
  const [analyses, setAnalyses] = useState<Record<string, PairAnalysis | null>>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Filter out expired entries
        const now = Date.now();
        const validCache: Record<string, PairAnalysis> = {};
        Object.entries(parsed).forEach(([pair, data]: [string, any]) => {
          if (data.timestamp && (now - data.timestamp < CACHE_DURATION)) {
            validCache[pair] = data;
          }
        });
        return validCache;
      }
    } catch (e) {
      console.error('Failed to load cache:', e);
    }
    return {};
  });
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [retryStates, setRetryStates] = useState<Record<string, { attempt: number, delay: number } | null>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof AVAILABLE_ASSETS>('Forex');
  const [selectedAnalysis, setSelectedAnalysis] = useState<PairAnalysis | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<PairAnalysis | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'checklist'>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const cached = localStorage.getItem('user_profile');
      return cached ? JSON.parse(cached) : DEFAULT_PROFILE;
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  });

  // Save to cache whenever analyses change
  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(analyses));
  }, [analyses]);

  // Save profile to cache
  useEffect(() => {
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  const fetchPairData = async (pair: string, force = false) => {
    // Check cache first if not forcing
    if (!force && analyses[pair]) {
      const cachedData = analyses[pair] as any;
      if (cachedData.timestamp && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
        return;
      }
    }

    setLoadingStates(prev => ({ ...prev, [pair]: true }));
    setRetryStates(prev => ({ ...prev, [pair]: null }));
    try {
      // Fetch real-time price first to provide context to Gemini
      const priceData = await fetchRealTimePrice(pair);
      
      const result = await analyzeMarket(pair, priceData || undefined, (attempt, delay) => {
        setRetryStates(prev => ({ ...prev, [pair]: { attempt, delay } }));
      });
      
      const analysisWithTimestamp = {
        ...result,
        timestamp: Date.now()
      };

      setAnalyses(prev => ({ ...prev, [pair]: analysisWithTimestamp }));
      setRetryStates(prev => ({ ...prev, [pair]: null }));
    } catch (err) {
      console.error(`Failed to fetch ${pair}:`, err);
    } finally {
      setLoadingStates(prev => ({ ...prev, [pair]: false }));
    }
  };

  // Disable automatic initialization to save Gemini API requests
  // useEffect(() => {
  //   const initializeAnalyses = async () => {
  //     for (let i = 0; i < pairs.length; i++) {
  //       const pair = pairs[i];
  //       // Only fetch if not in cache or expired
  //       const cached = analyses[pair] as any;
  //       const needsFetch = !cached || !cached.timestamp || (Date.now() - cached.timestamp > CACHE_DURATION);
  //       
  //       if (needsFetch) {
  //         // Stagger requests by 3 seconds to be extra safe with rate limits
  //         if (i > 0) await new Promise(resolve => setTimeout(resolve, 3000));
  //         await fetchPairData(pair);
  //       }
  //     }
  //   };
  //   
  //   initializeAnalyses();
  // }, [pairs]);

  const handleAddPair = (pair: string) => {
    if (!pairs.includes(pair)) {
      setPairs([...pairs, pair]);
      setShowAddModal(false);
      setSearchQuery('');
    }
  };

  const handleRemovePair = (pair: string) => {
    setPairs(pairs.filter(p => p !== pair));
    const newAnalyses = { ...analyses };
    delete newAnalyses[pair];
    setAnalyses(newAnalyses);
  };

  const filteredAssets = AVAILABLE_ASSETS[activeCategory].filter(asset => 
    asset.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-[#37352f] selection:bg-[#2383e2]/30 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white border-r border-[#f1f1ef] z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-[#f1f1ef] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-tighter">Vantage</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-[#f7f6f3] rounded-full transition-colors">
                  <X className="w-4 h-4 text-[#787774]" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-2">
                <button 
                  onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    currentView === 'dashboard' ? "bg-[#f7f6f3] text-[#37352f]" : "text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f]"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="text-sm font-bold">Dashboard</span>
                </button>
                <button 
                  onClick={() => { setCurrentView('checklist'); setIsSidebarOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    currentView === 'checklist' ? "bg-[#f7f6f3] text-[#37352f]" : "text-[#787774] hover:bg-[#f7f6f3] hover:text-[#37352f]"
                  )}
                >
                  <ListTodo className="w-4 h-4" />
                  <span className="text-sm font-bold">Checklist</span>
                </button>
              </div>

              <div className="p-6 border-t border-[#f1f1ef]">
                <div className="flex items-center gap-3 mb-4">
                  <img src={userProfile.avatar} className="w-8 h-8 rounded-full object-cover border border-[#f1f1ef]" alt="" />
                  <div>
                    <p className="text-xs font-bold text-[#37352f]">{userProfile.name}</p>
                    <p className="text-[10px] text-[#787774]">{userProfile.tradingStyle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowProfileModal(true); setIsSidebarOpen(false); }}
                  className="w-full py-2 text-[10px] font-black text-[#787774] uppercase tracking-widest border border-[#f1f1ef] rounded-lg hover:bg-[#f7f6f3] transition-all"
                >
                  Edit Profile
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <PriceMarquee />
        <header className="h-14 border-b border-[#f1f1ef] flex items-center justify-between px-10 shrink-0 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-[#f1f1ef] rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-[#37352f]" />
            </button>
            <h1 className="text-sm font-bold text-[#37352f]">Market Bias Dashboard</h1>
            <div className="h-4 w-px bg-[#f1f1ef]" />
            <div className="flex items-center gap-2 text-[10px] font-medium text-[#787774]">
              <Clock className="w-3 h-3" />
              <span>Institutional Analysis Distilled</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#f1f1ef] transition-all group font-roboto"
            >
              <img 
                src={userProfile.avatar} 
                alt="Profile" 
                className="w-6 h-6 rounded-full object-cover border border-[#f1f1ef]"
                referrerPolicy="no-referrer"
              />
              <span className="text-[11px] font-bold text-[#37352f]">{userProfile.name}</span>
              <Settings className="w-3.5 h-3.5 text-[#787774] group-hover:rotate-90 transition-transform duration-500" />
            </button>
            <div className="h-4 w-px bg-[#f1f1ef]" />
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-black text-white text-[11px] font-bold rounded-xl border border-black hover:bg-[#37352f] transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Pair
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar notebook-paper">
          {currentView === 'dashboard' ? (
            <div className="max-w-7xl mx-auto">
              <div className="mb-10">
                <TypingHeader text={`Welcome ${userProfile.name}`} />
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[#787774] text-sm">Real-time synthesis of global financial news and institutional sentiment.</span>
                  <div className="h-3 w-px bg-[#f1f1ef]" />
                  <span className="text-[10px] font-black text-[#2383e2] uppercase tracking-widest font-roboto">{userProfile.tradingStyle} • {userProfile.experience}</span>
                </div>
              </div>
              
              <div className="bento-grid">
                {pairs.map((pair, idx) => (
                  <MarketCard 
                    key={pair}
                    pair={pair}
                    featured={idx === 0}
                    analysis={analyses[pair]}
                    isLoading={loadingStates[pair]}
                    retryStatus={retryStates[pair]}
                    onRefresh={() => fetchPairData(pair, true)}
                    onDetails={(analysis) => setSelectedAnalysis(analysis)}
                    onInsights={(analysis) => setSelectedInsights(analysis)}
                    onRemove={() => handleRemovePair(pair)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Checklist />
          )}
        </div>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-2xl bg-white border border-[#f1f1ef] rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-[#f1f1ef]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-[#37352f]">Add Market Pair</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-[#f1f1ef] rounded transition-colors">
                    <X className="w-5 h-5 text-[#787774]" />
                  </button>
                </div>
                
                <div className="relative">
                  <input 
                    autoFocus
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search symbols..."
                    className="w-full bg-[#f1f1ef] border-none rounded px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2383e2]/20 transition-all placeholder:text-[#787774]/60"
                  />
                </div>
              </div>

              <div className="flex border-b border-[#f1f1ef]">
                {(Object.keys(AVAILABLE_ASSETS) as Array<keyof typeof AVAILABLE_ASSETS>).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      "flex-1 py-3 text-[11px] font-black uppercase tracking-wider transition-all border-b-2",
                      activeCategory === category 
                        ? "text-[#2383e2] border-[#2383e2] bg-[#2383e2]/5" 
                        : "text-[#37352f] border-transparent hover:bg-[#f1f1ef]"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <button
                        key={asset}
                        onClick={() => handleAddPair(asset)}
                        disabled={pairs.includes(asset)}
                        className={cn(
                          "p-3 rounded border text-left transition-all group",
                          pairs.includes(asset)
                            ? "bg-[#f1f1ef] border-transparent opacity-50 cursor-not-allowed"
                            : "bg-white border-[#f1f1ef] hover:border-[#2383e2]/30 hover:bg-[#f1f1ef]"
                        )}
                      >
                        <div className="text-xs font-bold text-[#37352f] group-hover:text-[#2383e2] transition-colors">{asset}</div>
                        <div className="text-[9px] font-medium text-[#787774] mt-1 uppercase tracking-wider">
                          {pairs.includes(asset) ? 'Added' : 'Add'}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center text-[#787774] text-xs">
                      No assets found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-[#f7f6f3] border-t border-[#f1f1ef]">
                <p className="text-[10px] text-[#37352f] font-black uppercase text-center tracking-widest">
                  Select an asset to begin AI synthesis
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <DetailsModal 
            analysis={selectedAnalysis} 
            onClose={() => setSelectedAnalysis(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInsights && (
          <InsightsModal 
            analysis={selectedInsights} 
            onClose={() => setSelectedInsights(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal 
            profile={userProfile}
            onSave={(newProfile) => {
              setUserProfile(newProfile);
              setShowProfileModal(false);
            }}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
