
import React from 'react';
import { UserProfile } from '../../types';

interface AdminLoginModalProps {
  step: 'confirm' | 'password' | 'mfa' | 'recovery' | 'denied';
  email: string;
  loginInput: string;
  setLoginInput: (v: string) => void;
  recoveryAnswer: string;
  setRecoveryAnswer: (v: string) => void;
  onVerify: (confirmed: boolean) => void;
  onPasswordSubmit: (e: React.FormEvent) => void;
  onMfaSubmit: (e: React.FormEvent) => void;
  onRecoverySubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  step, email, loginInput, setLoginInput, recoveryAnswer, setRecoveryAnswer,
  onVerify, onPasswordSubmit, onMfaSubmit, onRecoverySubmit, onClose
}) => {
  return (
    <div className="fixed inset-0 z-[500] bg-nova-navy/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
       <div className="w-full max-w-md glass p-12 rounded-[48px] border border-white/10 text-center space-y-8">
            {step === 'confirm' && (
              <>
                <h3 className="text-xl font-bold text-white">Security Clearance Check</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest">Target Account: {email}</p>
                <div className="flex gap-4">
                  <button onClick={() => onVerify(false)} className="flex-1 py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                  <button onClick={() => onVerify(true)} className="flex-1 py-4 bg-nova-gold text-nova-navy rounded-2xl text-[10px] font-black uppercase tracking-widest">Proceed</button>
                </div>
              </>
            )}
            {step === 'password' && (
              <>
                <h3 className="text-xl font-bold text-white">Administrative Key</h3>
                <p className="text-[10px] text-nova-gold/60 uppercase tracking-[0.3em]">Enter Commander Key</p>
                <form onSubmit={onPasswordSubmit} className="space-y-6">
                  <input type="password" autoFocus value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-nova-gold/50 transition-all" />
                  <button type="submit" className="w-full py-4 bg-nova-gold text-nova-navy rounded-2xl text-[10px] font-black uppercase tracking-widest">Authorize Access</button>
                </form>
              </>
            )}
            {step === 'denied' && (
              <>
                <h3 className="text-2xl font-black text-red-500">ACCESS DENIED</h3>
                <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">Logged attempt for {email}. Institution security monitoring active.</p>
                <button onClick={onClose} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase">Return to Portal</button>
              </>
            )}
       </div>
    </div>
  );
};

export default AdminLoginModal;
