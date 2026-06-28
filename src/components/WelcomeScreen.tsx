import React from 'react';
import { Bolt, Check, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface WelcomeScreenProps {
  onStartPlanning: () => void;
}

export default function WelcomeScreen({ onStartPlanning }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Top Header */}
      <header className="w-full px-8 pt-6 max-w-7xl mx-auto z-50">
        <div className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[24px] px-6 py-4 flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <img
              alt="Ahead logo"
              src="/app-logo.png"
              className="w-10 h-10 rounded-xl object-cover border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b]"
            />
            <span className="font-display text-2xl font-black text-[#1e293b] tracking-tight">Ahead</span>
          </div>
          <div className="px-4 py-1.5 bg-[#a7f3d0] border-2 border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b] rounded-full text-xs font-black text-[#047857]">
            Stay Ahead
          </div>
        </div>
      </header>

      {/* Main Grid Hero */}
      <main className="flex-grow flex flex-col items-center justify-center px-8 py-12 max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          {/* Hero text content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start gap-6 max-w-2xl order-2 md:order-1"
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-[#1e293b]">
              Stay Ahead.<br />
              <span className="text-[#10b981] underline decoration-[6px] decoration-[#1e293b]">Never Miss</span> a Deadline.
            </h1>
            <div className="space-y-2">
              <p className="text-lg text-slate-700 font-extrabold leading-relaxed">Plan smarter. Focus better. Finish on time.</p>
              <p className="text-sm text-[#059669] font-black uppercase tracking-wider">Powered by Nova, your AI execution coach.</p>
            </div>

            {/* Start Planning Button */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <button 
                onClick={onStartPlanning}
                className="bg-[#10b981] hover:bg-[#059669] text-white font-sans text-base font-black border-[3px] border-[#1e293b] shadow-clay-card hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#1e293b] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none px-8 py-4 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer rounded-2xl"
              >
                <span>Start planning</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[3]" />
              </button>
            </div>

            {/* Feature lists */}
            <div className="mt-4 flex flex-wrap gap-4 text-[#1e293b] text-xs font-black">
              <div className="flex items-center gap-1.5 bg-white border-2 border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b] px-3.5 py-2 rounded-full">
                <Check className="w-4 h-4 text-[#10b981] stroke-[3]" />
                <span>No sign-up required for demo</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border-2 border-[#1e293b] shadow-[2.5px_2.5px_0px_#1e293b] px-3.5 py-2 rounded-full">
                <Check className="w-4 h-4 text-[#10b981] stroke-[3]" />
                <span>Google Calendar supported</span>
              </div>
            </div>
          </motion.div>

          {/* Hero aesthetic graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 md:order-2 flex justify-center items-center w-full relative"
          >
            {/* Ambient Background blur */}
            <div className="absolute inset-0 bg-[#10b981]/5 rounded-full blur-3xl opacity-60 w-full h-[300px] md:h-[500px]"></div>
            <div className="relative w-full max-w-[450px] aspect-square rounded-[32px] bg-white border-[3px] border-[#1e293b] shadow-clay-card p-6 overflow-hidden group transition-all duration-500 flex flex-col justify-between">
              {/* SVG Mockup Dashboard */}
              <svg viewBox="0 0 400 400" className="w-full h-full text-[#475569] select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Header Mockup */}
                <rect x="15" y="15" width="370" height="40" rx="10" fill="rgba(0,0,0,0.02)" stroke="#1e293b" strokeWidth="2" />
                <circle cx="35" cy="35" r="5" fill="#ef4444" />
                <circle cx="50" cy="35" r="5" fill="#f59e0b" />
                <circle cx="65" cy="35" r="5" fill="#10b981" />
                <text x="90" y="39" fill="#1e293b" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Nova Workspace — Optimized Plan</text>
                <rect x="330" y="27" width="40" height="16" rx="8" fill="#a7f3d0" stroke="#1e293b" strokeWidth="1.5" />
                <text x="337" y="38" fill="#047857" fontSize="9" fontWeight="bold" fontFamily="sans-serif">94%</text>

                {/* Left Sidebar Mockup */}
                <rect x="15" y="65" width="80" height="320" rx="10" fill="#f8fafc" stroke="#1e293b" strokeWidth="2" />
                {/* Sidebar menu items */}
                <rect x="25" y="80" width="60" height="12" rx="4" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" />
                <rect x="25" y="102" width="60" height="12" rx="4" fill="rgba(0,0,0,0.02)" />
                <rect x="25" y="124" width="60" height="12" rx="4" fill="rgba(0,0,0,0.02)" />
                <rect x="25" y="146" width="60" height="12" rx="4" fill="rgba(0,0,0,0.02)" />
                
                {/* Tasks List / Calendar Grid Mockup */}
                <rect x="105" y="65" width="280" height="320" rx="10" fill="#FFFBF4" stroke="#1e293b" strokeWidth="2" />
                
                {/* Schedule Days */}
                <text x="120" y="90" fill="#10b981" fontSize="10" fontWeight="bold" fontFamily="sans-serif">MON</text>
                <text x="210" y="90" fill="rgba(0,0,0,0.4)" fontSize="10" fontWeight="bold" fontFamily="sans-serif">TUE</text>
                <text x="300" y="90" fill="rgba(0,0,0,0.4)" fontSize="10" fontWeight="bold" fontFamily="sans-serif">WED</text>
                
                <line x1="105" y1="100" x2="385" y2="100" stroke="#1e293b" strokeWidth="1.5" />
                
                {/* Time Blocks */}
                {/* Mon Block 1 */}
                <rect x="115" y="112" width="80" height="60" rx="8" fill="url(#teal-grad)" stroke="#1e293b" strokeWidth="1.5" />
                <text x="123" y="128" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Deep Focus</text>
                <text x="123" y="142" fill="#ccfbf1" fontSize="8" fontFamily="sans-serif">09:00 - 10:30</text>
                <text x="123" y="160" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">✓ Build API</text>

                {/* Mon Block 2 */}
                <rect x="115" y="182" width="80" height="50" rx="8" fill="rgba(0,0,0,0.03)" stroke="#1e293b" strokeWidth="1.5" />
                <text x="123" y="198" fill="#1e293b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Sync Meet</text>
                <text x="123" y="212" fill="rgba(0,0,0,0.4)" fontSize="8" fontFamily="sans-serif">11:00 - 12:00</text>
                
                {/* Mon Block 3 */}
                <rect x="115" y="242" width="80" height="70" rx="8" fill="url(#orange-grad)" stroke="#1e293b" strokeWidth="1.5" />
                <text x="123" y="258" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">DSA Quiz</text>
                <text x="123" y="272" fill="#ffedd5" fontSize="8" fontFamily="sans-serif">14:00 - 15:30</text>
                <text x="123" y="295" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">⚠️ Urgent</text>

                {/* Tue Block 1 */}
                <rect x="205" y="112" width="80" height="90" rx="8" fill="rgba(0,0,0,0.02)" stroke="#1e293b" strokeWidth="1.5" />
                <text x="213" y="128" fill="rgba(0,0,0,0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif">UX Research</text>
                <text x="213" y="142" fill="rgba(0,0,0,0.2)" fontSize="8" fontFamily="sans-serif">09:00 - 11:30</text>

                {/* Tue Block 2 */}
                <rect x="205" y="212" width="80" height="60" rx="8" fill="url(#teal-grad)" stroke="#1e293b" strokeWidth="1.5" />
                <text x="213" y="228" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Gym Block</text>
                <text x="213" y="242" fill="#ccfbf1" fontSize="8" fontFamily="sans-serif">16:00 - 17:30</text>

                {/* Wed Block 1 */}
                <rect x="295" y="112" width="80" height="50" rx="8" fill="rgba(0,0,0,0.02)" stroke="#1e293b" strokeWidth="1.5" />
                <text x="303" y="128" fill="rgba(0,0,0,0.4)" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Coding</text>
                <text x="303" y="142" fill="rgba(0,0,0,0.2)" fontSize="8" fontFamily="sans-serif">09:00 - 10:00</text>

                {/* Floating coach insight mockup */}
                <g filter="url(#shadow-filter)">
                  <rect x="180" y="300" width="190" height="65" rx="14" fill="#fffbeb" stroke="#1e293b" strokeWidth="2" />
                  <circle cx="205" cy="332" r="14" fill="url(#teal-icon-grad)" />
                  <text x="200" y="336" fill="#ffffff" fontSize="12" fontWeight="bold">✨</text>
                  <text x="226" y="322" fill="#b45309" fontSize="8" fontWeight="bold" fontFamily="sans-serif">NOVA COACH</text>
                  <text x="226" y="335" fill="#1e293b" fontSize="9" fontWeight="semibold" fontFamily="sans-serif">Plan finalized. Focus block</text>
                  <text x="226" y="347" fill="#1e293b" fontSize="9" fontWeight="semibold" fontFamily="sans-serif">starts at 9:00 AM.</text>
                </g>

                {/* Gradient Definitions */}
                <defs>
                  <linearGradient id="teal-grad" x1="0" y1="0" x2="80" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="orange-grad" x1="0" y1="0" x2="80" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                  <linearGradient id="teal-icon-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <filter id="shadow-filter" x="175" y="295" width="200" height="80" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
                  </filter>
                </defs>
              </svg>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
