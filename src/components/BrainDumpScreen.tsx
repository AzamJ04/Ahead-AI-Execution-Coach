import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface BrainDumpScreenProps {
  firstName: string;
  onSubmit: (text: string) => void;
}

export default function BrainDumpScreen({ firstName, onSubmit }: BrainDumpScreenProps) {
  const [brainDumpText, setBrainDumpText] = useState('');

  const suggestions = [
    { label: '📚 Plan my college week', text: 'I have a DBMS assignment due Friday, an algorithm quiz on Wednesday, gym every evening, and want to prepare for a software engineer interview next week.' },
    { label: '💼 Plan my work week', text: 'I have to draft milestone 2 specs, sync with the team on Wednesday, record UX demos, and set aside daily focus blocks for coding.' },
    { label: '🚀 Plan my startup week', text: 'We have client demo on Tuesday, product launch checklist review, and investor updates to write.' },
    { label: '📅 Organize my deadlines', text: 'I have three deadlines coming up: DBMS project on Oct 24, Algorithm Review on Oct 27, and UX Research Paper on Oct 29. Optimize my plan.' },
    { label: '🎯 Build my weekly plan', text: 'Build my weekly plan. Keep my morning slot (9 AM - 11 AM) purely for high intensity programming, and slot meetings after lunch.' }
  ];

  const handleSuggestionClick = (text: string) => {
    setBrainDumpText(text);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brainDumpText.trim().length > 0) {
      onSubmit(brainDumpText.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-[#1e293b]">
      {/* Top logo header */}
      <nav className="w-full bg-transparent flex justify-between items-center px-8 py-4 max-w-7xl mx-auto z-50">
        <div className="flex items-center gap-3">
          <img
            alt="Ahead logo"
            src="/app-logo.png"
            className="w-10 h-10 rounded-xl object-cover border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b]"
          />
          <span className="font-display text-2xl font-black text-[#1e293b]">Ahead</span>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow flex flex-col items-center justify-center px-8 py-10 w-full max-w-[800px] mx-auto">
        {/* Header Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center mb-10"
        >
          <span className="inline-block bg-[#a7f3d0] text-[#065f46] border-2 border-[#1e293b] shadow-[2px_2px_0px_#1e293b] px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider mb-6">
            👋 Hi {firstName || 'Guest'}, I'm Nova.
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight text-[#1e293b]">
            What's on your mind today?
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-bold">
            Tell me everything you need to do. Assignments, meetings, deadlines, ideas, goals, reminders... Don't worry about organizing them. I'll do that for you.
          </p>
        </motion.div>

        {/* Input box form */}
        <form onSubmit={handleFormSubmit} className="w-full">
          {/* Glass Input container */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full relative mb-8"
          >
            <div className="absolute top-6 left-6 text-[#10b981] z-10">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <textarea 
              id="brain-dump-input"
              value={brainDumpText}
              onChange={(e) => setBrainDumpText(e.target.value)}
              placeholder="Example: I have a DBMS assignment due Friday. I need to prepare for an interview on Monday. Gym every evening..."
              className="w-full min-h-[180px] md:min-h-[220px] bg-white border-[3px] border-[#1e293b] rounded-2xl p-6 pl-16 pt-6 text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 focus:border-[#10b981] shadow-clay-card resize-y text-base md:text-lg leading-relaxed font-bold"
            />
          </motion.div>

          {/* Suggestions container */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full text-center mb-10"
          >
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Not sure what to write?</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {suggestions.map((s, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(s.text)}
                  className="px-4 py-2 bg-white border-2 border-[#1e293b] text-[#1e293b] hover:bg-slate-50 shadow-[2px_2px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1e293b] transition-all font-bold rounded-full text-xs cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Core submission controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            <button 
              id="submit-btn"
              type="submit"
              disabled={brainDumpText.trim().length === 0}
              className="bg-[#10b981] hover:bg-[#059669] text-white font-black border-[3px] border-[#1e293b] shadow-clay-card hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1e293b] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none px-8 py-4 text-base rounded-2xl flex items-center justify-center gap-2 transition-all w-full sm:w-auto min-w-[240px] cursor-pointer"
            >
              <Sparkles className="w-5 h-5 fill-white/10 stroke-[2.5]" />
              <span>Plan My Week</span>
            </button>
            <p className="mt-4 text-[11px] text-slate-400 font-bold">
              Nova understands natural language. No special formatting required.
            </p>
          </motion.div>
        </form>
      </main>
    </div>
  );
}
