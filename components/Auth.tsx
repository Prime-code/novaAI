
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (email: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    
    if (!gmailRegex.test(email)) {
      setError('Access Restricted: Only @gmail.com addresses are authorized for this institution.');
      return;
    }

    setIsLoading(true);
    // Simulate secure hand-off
    setTimeout(() => {
      onLogin(email);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-nova-navy flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-nova-accent/10 blur-[120px] rounded-full animate-orb-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-nova-gold/5 blur-[120px] rounded-full animate-orb-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="glass p-12 rounded-[48px] border border-white/10 shadow-2xl space-y-10 text-center">
          <div className="space-y-4">
            <div className="w-24 h-24 bg-nova-gold text-nova-navy rounded-[32px] flex items-center justify-center font-black text-5xl mx-auto shadow-[0_0_50px_rgba(212,175,55,0.2)] rotate-3">N</div>
            <h1 className="text-3xl font-black tracking-tighter">Nova AI Portal</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Institutional Access Required</p>
          </div>

          <form onSubmit={validateAndLogin} className="space-y-6">
            <div className="relative group">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                placeholder="Enter your Gmail address"
                className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-6 py-5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-nova-gold/50 transition-all placeholder:opacity-20`}
              />
              {email.endsWith('@gmail.com') && !error && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-in fade-in zoom-in">
                  <i className="fas fa-check-circle"></i>
                </div>
              )}
            </div>

            {error && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider animate-in slide-in-from-top-2">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-white text-nova-navy py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-nova-gold transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 shadow-xl"
            >
              {isLoading ? (
                <i className="fas fa-circle-notch fa-spin"></i>
              ) : (
                <>
                  <i className="fab fa-google"></i>
                  Sign in with Gmail
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[9px] text-white/20 leading-relaxed">
              By signing in, you agree to Nova Crest School's <br/> Digital Governance & Academic Integrity Policy.
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[9px] font-black uppercase tracking-[0.5em] text-white/10">
          Enugu State Educational Board Certified
        </p>
      </div>
    </div>
  );
};

export default Auth;
