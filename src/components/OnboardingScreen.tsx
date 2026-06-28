import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Briefcase, Rocket, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingScreenProps {
  onSubmit: (profile: UserProfile) => void;
  initialProfile: UserProfile;
}

export default function OnboardingScreen({ onSubmit, initialProfile }: OnboardingScreenProps) {
  const [firstName, setFirstName] = useState(initialProfile.firstName);
  const [role, setRole] = useState<'student' | 'professional' | 'entrepreneur' | null>(initialProfile.role as 'student' | 'professional' | 'entrepreneur' | null);

  const isValid = firstName.trim().length > 0 && role !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSubmit({
        firstName: firstName.trim(),
        role,
        signedIn: initialProfile.signedIn
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-[#1e293b] antialiased">
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-black mb-3 text-[#1e293b] tracking-tight">
            Tell us about yourself
          </h1>
          <p className="text-base text-slate-500 max-w-md mx-auto font-bold">
            This helps Nova personalize your planning experience.
          </p>
        </header>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="bg-white border-[3px] border-[#1e293b] shadow-clay-card rounded-[32px] p-6 md:p-10">
          {/* Name Input */}
          <div className="mb-10">
            <label 
              className="block text-xs font-black uppercase tracking-widest text-[#10b981] mb-3" 
              htmlFor="firstName"
            >
              What should we call you?
            </label>
            <input 
              id="firstName"
              type="text" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              className="w-full h-14 bg-white border-[3px] border-[#1e293b] text-[#1e293b] placeholder:text-slate-400 font-bold rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 focus:border-[#10b981] shadow-[inset_1px_1px_4px_rgba(0,0,0,0.06),_2px_2px_0px_#1e293b] px-5 text-base transition-all duration-300"
            />
          </div>

          {/* Role Selection */}
          <div className="mb-10">
            <label className="block text-xs font-black uppercase tracking-widest text-[#10b981] mb-3">
              Who are you?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="roleContainer">
              {/* Student */}
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex flex-col items-start p-6 rounded-2xl border-[3px] text-left transition-all duration-200 group cursor-pointer ${
                  role === 'student'
                    ? 'border-[#1e293b] bg-[#bfdbfe] text-[#1e293b] shadow-[1px_1px_0px_#1e293b] translate-x-[2px] translate-y-[2px]'
                    : 'border-[#1e293b] bg-white text-[#1e293b] hover:bg-slate-50 shadow-[3px_3px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1e293b]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border-2 border-[#1e293b] transition-all duration-300 ${
                  role === 'student' ? 'bg-[#10b981] text-white shadow-[1px_1px_0px_#1e293b]' : 'bg-slate-100 text-[#1e293b]'
                }`}>
                  <GraduationCap className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-black text-[#1e293b] mb-1">Student</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">Assignments, Exams, Classes</p>
              </button>

              {/* Professional */}
              <button
                type="button"
                onClick={() => setRole('professional')}
                className={`flex flex-col items-start p-6 rounded-2xl border-[3px] text-left transition-all duration-200 group cursor-pointer ${
                  role === 'professional'
                    ? 'border-[#1e293b] bg-[#bfdbfe] text-[#1e293b] shadow-[1px_1px_0px_#1e293b] translate-x-[2px] translate-y-[2px]'
                    : 'border-[#1e293b] bg-white text-[#1e293b] hover:bg-slate-50 shadow-[3px_3px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1e293b]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border-2 border-[#1e293b] transition-all duration-300 ${
                  role === 'professional' ? 'bg-[#10b981] text-white shadow-[1px_1px_0px_#1e293b]' : 'bg-slate-100 text-[#1e293b]'
                }`}>
                  <Briefcase className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-black text-[#1e293b] mb-1">Professional</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">Meetings, Projects, Deadlines</p>
              </button>

              {/* Entrepreneur */}
              <button
                type="button"
                onClick={() => setRole('entrepreneur')}
                className={`flex flex-col items-start p-6 rounded-2xl border-[3px] text-left transition-all duration-200 group cursor-pointer ${
                  role === 'entrepreneur'
                    ? 'border-[#1e293b] bg-[#bfdbfe] text-[#1e293b] shadow-[1px_1px_0px_#1e293b] translate-x-[2px] translate-y-[2px]'
                    : 'border-[#1e293b] bg-white text-[#1e293b] hover:bg-slate-50 shadow-[3px_3px_0px_#1e293b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1e293b]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border-2 border-[#1e293b] transition-all duration-300 ${
                  role === 'entrepreneur' ? 'bg-[#10b981] text-white shadow-[1px_1px_0px_#1e293b]' : 'bg-slate-100 text-[#1e293b]'
                }`}>
                  <Rocket className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-black text-[#1e293b] mb-1">Entrepreneur</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">Clients, Products, Growth</p>
              </button>
            </div>
          </div>

          {/* Primary CTA button with specific ID submitBtn */}
          <button 
            id="submitBtn"
            type="submit"
            disabled={!isValid}
            className="w-full h-14 bg-[#10b981] hover:bg-[#059669] text-white font-black border-[3px] border-[#1e293b] shadow-clay-card hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1e293b] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer rounded-2xl"
          >
            <span>Meet Nova</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </form>
      </motion.main>
    </div>
  );
}
