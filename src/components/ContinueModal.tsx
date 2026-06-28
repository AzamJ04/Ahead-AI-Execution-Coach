import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, HelpCircle } from 'lucide-react';

interface ContinueModalProps {
  onContinueGoogle: () => void;
  onContinueGuest: () => void;
  onClose?: () => void;
}

export default function ContinueModal({ onContinueGoogle, onContinueGuest, onClose }: ContinueModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred background overlay */}
      <div 
        className="absolute inset-0 bg-[#1e293b]/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white w-full max-w-[480px] rounded-[24px] shadow-clay-card border-[3px] border-[#1e293b] p-8 md:p-10 relative overflow-hidden z-10"
      >
        {/* Subtle top decoration corner circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <h2 className="font-display text-[28px] leading-[36px] font-black mb-2 tracking-tight text-[#1e293b]">
            Continue with Ahead
          </h2>
          <p className="text-sm text-slate-500 font-bold">Choose how you'd like to get started.</p>
        </div>

        {/* Primary Action (Google) */}
        <div className="space-y-4 mb-6 relative z-10">
          <button 
            onClick={onContinueGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-2 border-[#1e293b] shadow-clay-btn hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1e293b] py-4 px-6 rounded-2xl font-black active:shadow-clay-btn-active active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
          >
            {/* Google simplified SVG icon */}
            <svg 
              className="w-5 h-5 bg-white rounded-full p-0.5" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span className="text-sm">Continue with Google</span>
          </button>

          {/* Benefits Bulletpoints */}
          <div className="flex flex-col gap-2.5 px-1 pt-1">
            <div className="flex items-center gap-2.5 text-slate-700 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-[#10b981] stroke-[2.5]" />
              <span>Save your progress seamlessly</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-[#10b981] stroke-[2.5]" />
              <span>Sync with Google Calendar</span>
            </div>
          </div>
        </div>

        {/* Visual Divider separator */}
        <div className="relative flex py-4 items-center mb-4">
          <div className="flex-grow border-t border-[#1e293b]/10"></div>
          <span className="flex-shrink-0 mx-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-[#1e293b]/10"></div>
        </div>

        {/* Secondary Action (Guest) */}
        <div className="space-y-3 mb-6 relative z-10">
          <button 
            onClick={onContinueGuest}
            className="w-full flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-[#1e293b] border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] py-3.5 px-6 rounded-2xl font-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
          >
            Continue without signing in
          </button>
          <p className="text-[11px] leading-relaxed text-center text-slate-500 font-bold px-4">
            Explore Ahead instantly as a guest. You can connect your Google account later.
          </p>
        </div>

        {/* Footer info text */}
        <div className="text-center pt-4 border-t border-[#1e293b]/10 relative z-10">
          <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
            Your data stays private and is only used to personalize your planning experience.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
