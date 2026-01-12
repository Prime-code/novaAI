
import React from 'react';
import { UserProfile } from '../../types';

interface OnboardingOverlayProps {
  step: number;
  setStep: (step: number) => void;
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ step, setStep, profile, setProfile }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-nova-navy px-6">
      <div className="absolute inset-0 bg-nova-accent/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-lg space-y-12 relative animate-in fade-in zoom-in duration-1000">
        <div className="absolute -top-12 left-0 w-full h-1 bg-white/5 rounded-full overflow-hidden">
           <div 
             className="h-full bg-nova-gold transition-all duration-700 ease-out" 
             style={{ width: `${(step / 2) * 100}%` }}
           ></div>
        </div>

        {step === 0 && (
          <div className="text-center space-y-10 animate-in fade-in duration-1000">
            <div className="w-28 h-28 bg-nova-gold text-nova-navy rounded-[40px] flex items-center justify-center font-black text-6xl mx-auto shadow-[0_0_60px_rgba(212,175,55,0.3)] rotate-3">N</div>
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tighter">Welcome to Nova Crest</h1>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
                {profile.email} authenticated. Let's personalize your experience.
              </p>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="w-full bg-nova-gold text-nova-navy py-6 rounded-full font-black text-xs uppercase tracking-[0.5em] hover:brightness-110 active:scale-95 shadow-2xl shadow-nova-gold/20 transition-all"
            >
              Start Journey
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-10 animate-in slide-in-from-right-12 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight">Tell us about you</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Who are you visiting as?</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => { setProfile({ ...profile, type: 'parent' }); setStep(2); }} className="glass p-10 rounded-[48px] flex flex-col items-center gap-6 hover:bg-white/10 transition-all border border-white/10 group active:scale-95 hover:border-nova-gold/40">
                <div className="w-16 h-16 rounded-3xl bg-nova-gold/10 flex items-center justify-center text-nova-gold group-hover:scale-110 transition-transform">
                  <i className="fas fa-person-breastfeeding text-3xl"></i>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Parent</span>
                </div>
              </button>
              <button onClick={() => { setProfile({ ...profile, type: 'student' }); setStep(2); }} className="glass p-10 rounded-[48px] flex flex-col items-center gap-6 hover:bg-white/10 transition-all border border-white/10 group active:scale-95 hover:border-nova-gold/40">
                <div className="w-16 h-16 rounded-3xl bg-nova-gold/10 flex items-center justify-center text-nova-gold group-hover:scale-110 transition-transform">
                  <i className="fas fa-user-graduate text-3xl"></i>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Student</span>
                </div>
              </button>
            </div>
            <button onClick={() => setStep(0)} className="w-full text-[9px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity">Back to start</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right-12 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight">Final Step</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">How should we address you?</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Enter your full name..." 
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-full px-10 py-6 text-xl text-center focus:outline-none focus:ring-2 focus:ring-nova-gold/50 transition-all placeholder:opacity-20"
                value={profile.name} 
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && profile.name.trim() && setStep(3)}
              />
              <button 
                onClick={() => setStep(3)} 
                disabled={!profile.name.trim()} 
                className="w-full bg-nova-gold text-nova-navy py-6 rounded-full font-black text-sm uppercase tracking-[0.4em] hover:brightness-110 active:scale-95 shadow-2xl shadow-nova-gold/20 disabled:opacity-20 transition-all"
              >
                Enter Experience
              </button>
            </div>
            <button onClick={() => setStep(1)} className="w-full text-[9px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity">Change Role</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingOverlay;
