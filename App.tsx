import React, { useState, useEffect, useCallback } from 'react';
import Auth from './components/Auth';
import TextChat from './components/TextChat';
import VoiceChat from './components/VoiceChat';
import AdminDashboard from './components/AdminDashboard';
import OnboardingOverlay from './components/modals/OnboardingOverlay';
import AdminLoginModal from './components/modals/AdminLoginModal';
import { InteractionMode, UserProfile, Message, ChatLog, FeedbackLog, AppMode, AuditLog, SecuritySettings } from './types';
import { SCHOOL_DETAILS, PLANS } from './constants';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.VOICE);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminLoginStep, setAdminLoginStep] = useState<'confirm' | 'password' | 'mfa' | 'recovery' | 'denied'>('confirm');
  const [loginInput, setLoginInput] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');

  const [security, setSecurity] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('nova_security_settings');
    return saved ? JSON.parse(saved) : {
      adminKey: "noVa_sa_2025",
      isMfaEnabled: false,
      securityPin: "123456",
      lastRotation: Date.now()
    };
  });

  const [appMode, setAppMode] = useState<AppMode>(() => {
    return (localStorage.getItem('nova_app_mode') as AppMode) || 'paid';
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nova_user_profile');
    return saved ? JSON.parse(saved) : { 
      name: '', 
      email: '',
      type: null, 
      role: 'user', 
      credits: 3000, 
      subscriptionStatus: 'active', 
      plan: 'Nova Discovery',
      hasClaimedFree: true,
      isAuthenticated: false
    };
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('nova_all_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [onboardingStep, setOnboardingStep] = useState<number>(0);

  useEffect(() => {
    if (profile.isAuthenticated) {
      setOnboardingStep((profile.name && profile.type) ? 3 : 0);
    }
  }, [profile.isAuthenticated]);

  const [allChats, setAllChats] = useState<ChatLog[]>(() => {
    const saved = localStorage.getItem('nova_all_chats');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [allFeedback, setAllFeedback] = useState<FeedbackLog[]>(() => {
    const saved = localStorage.getItem('nova_all_feedback');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('nova_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nova_user_profile', JSON.stringify(profile));
    if (profile.isAuthenticated && profile.name && profile.role !== 'admin') {
      setAllUsers(prev => {
        const exists = prev.find(u => u.email === profile.email);
        if (exists) {
          return prev.map(u => u.email === profile.email ? profile : u);
        }
        return [...prev, profile];
      });
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('nova_all_users', JSON.stringify(allUsers));
    localStorage.setItem('nova_all_chats', JSON.stringify(allChats));
    localStorage.setItem('nova_all_feedback', JSON.stringify(allFeedback));
    localStorage.setItem('nova_audit_logs', JSON.stringify(auditLogs));
    localStorage.setItem('nova_app_mode', appMode);
    localStorage.setItem('nova_security_settings', JSON.stringify(security));
  }, [allUsers, allChats, allFeedback, auditLogs, appMode, security]);

  const recordAudit = (type: AuditLog['type'], details: string) => {
    setAuditLogs(prev => [{ timestamp: Date.now(), type, userName: profile.email || 'Anonymous', details }, ...prev]);
  };

  const handleLogin = (email: string) => {
    setProfile(prev => ({ ...prev, email, isAuthenticated: true }));
    recordAudit('login_success', `Authenticated via Gmail: ${email}`);
    const existing = allUsers.find(u => u.email === email);
    if (existing) {
      setProfile(existing);
      setOnboardingStep(3);
    } else {
      setOnboardingStep(0);
    }
  };

  const handleAdminVerify = (confirmed: boolean) => {
    if (!confirmed) {
      recordAudit('denied_confirmation', 'User denied admin status.');
      setAdminLoginStep('denied');
    } else {
      setAdminLoginStep('password');
    }
  };

  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput === security.adminKey) {
      grantAdminAccess();
    } else {
      recordAudit('denied_password', `Invalid password attempt.`);
      setAdminLoginStep('denied');
      setLoginInput('');
    }
  };

  const grantAdminAccess = () => {
    recordAudit('success', 'Full administrative clearance granted.');
    setProfile(prev => ({ ...prev, role: 'admin', credits: 999999, name: 'Administrator' }));
    setShowAdminLogin(false);
    setShowAdmin(true);
    setLoginInput('');
    setAdminLoginStep('confirm');
  };

  const handlePayment = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;
    if (plan.price === 0 && profile.hasClaimedFree) return alert("Discovery Plan already claimed.");

    if (appMode === 'test') {
      if (confirm(`SIMULATION: Activate ${plan.name}?`)) {
        setProfile(prev => ({
          ...prev,
          credits: prev.credits + plan.wordLimit,
          subscriptionStatus: 'active',
          plan: plan.name,
          hasClaimedFree: plan.id === 'free' ? true : prev.hasClaimedFree
        }));
        setShowPlans(false);
      }
    } else {
      alert("Live payments are in audit.");
    }
  };

  const logChat = useCallback(async (messages: Message[]) => {
    const apiKey = process.env.API_KEY;
    if (profile.role === 'admin' || messages.length < 2) return;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const lastFew = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize in one short sentence: \n\n${lastFew}`,
      });
      const summary = response.text?.trim() || "Active session.";
      setAllChats(prev => [{ userName: profile.name, messages, timestamp: Date.now(), summary }, ...prev]);
    } catch (e) {
      console.error("Chat summary error:", e);
    }
  }, [profile.name, profile.role]);

  const deductCredits = (wordCount: number) => {
    if (profile.role === 'admin' || appMode === 'test') return;
    setProfile(prev => ({ ...prev, credits: Math.max(0, prev.credits - wordCount) }));
  };

  if (!profile.isAuthenticated) return <Auth onLogin={handleLogin} />;

  if (showAdmin && profile.role === 'admin') {
    return <AdminDashboard 
      onBack={() => setShowAdmin(false)} 
      chats={allChats} feedback={allFeedback} users={allUsers} auditLogs={auditLogs} appMode={appMode}
      security={security} onUpdateSecurity={setSecurity}
      onUpdateUsers={setAllUsers} onToggleMode={() => setAppMode(prev => prev === 'test' ? 'paid' : 'test')}
      recordAudit={recordAudit}
    />;
  }

  const isCreditsExhausted = profile.credits <= 0 && profile.role !== 'admin' && appMode === 'paid';

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden bg-nova-navy text-white">
      {onboardingStep < 3 && (
        <OnboardingOverlay 
          step={onboardingStep} setStep={setOnboardingStep}
          profile={profile} setProfile={setProfile}
        />
      )}

      <header className="p-10 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-nova-gold text-nova-navy rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">N</div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tighter">Nova Crest School</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-nova-gold">
              Words: {profile.role === 'admin' ? 'Unlimited' : (appMode === 'test' ? 'Bypass' : profile.credits)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block mr-4 text-right">
             <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{profile.email}</p>
             <button onClick={() => setProfile({ ...profile, isAuthenticated: false })} className="text-[8px] font-bold text-red-500 uppercase tracking-widest hover:underline">Logout</button>
          </div>
          <button onClick={() => setShowInfo(true)} className="w-12 h-12 rounded-full glass flex items-center justify-center hover:text-nova-gold transition-all"><i className="fas fa-info text-xl"></i></button>
          <button onClick={() => setShowPlans(true)} className="glass px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-nova-gold hover:text-nova-navy transition-all shadow-lg">Subscription</button>
          <button onClick={() => setMode(mode === InteractionMode.VOICE ? InteractionMode.TEXT : InteractionMode.VOICE)} className="w-12 h-12 rounded-full glass flex items-center justify-center transition-all"><i className={`fas ${mode === InteractionMode.VOICE ? 'fa-keyboard' : 'fa-microphone-lines'}`}></i></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-40 px-6 overflow-hidden">
        {isCreditsExhausted ? (
          <div className="text-center space-y-10 glass p-16 rounded-[60px] border border-nova-gold/20 animate-in fade-in zoom-in max-w-md">
            <h2 className="text-3xl font-black tracking-tighter">Credits Exhausted</h2>
            <button onClick={() => setShowPlans(true)} className="w-full bg-nova-gold text-nova-navy py-5 rounded-full font-black text-xs uppercase tracking-[0.3em]">Purchase Plan</button>
          </div>
        ) : (
          <div className="w-full max-w-6xl h-full flex flex-col overflow-hidden">
            {mode === InteractionMode.VOICE ? (
              <VoiceChat userProfile={profile} appMode={appMode} onFeedback={() => {}} onDeduct={deductCredits} />
            ) : (
              <TextChat userProfile={profile} appMode={appMode} onLog={logChat} onDeduct={deductCredits} />
            )}
          </div>
        )}
      </main>

      <footer className="p-6 text-center relative z-50">
        <button onClick={() => { setShowAdminLogin(true); setAdminLoginStep('confirm'); }} className="text-[9px] font-black uppercase tracking-[0.5em] text-white/5 hover:text-white/20 transition-all py-2 px-4 rounded-full">Administrator Command Access</button>
      </footer>

      {showAdminLogin && (
        <AdminLoginModal 
          step={adminLoginStep} email={profile.email}
          loginInput={loginInput} setLoginInput={setLoginInput}
          recoveryAnswer={recoveryAnswer} setRecoveryAnswer={setRecoveryAnswer}
          onVerify={handleAdminVerify} onPasswordSubmit={handleAdminPasswordSubmit}
          onMfaSubmit={() => {}} onRecoverySubmit={() => {}}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {showPlans && (
        <div className="fixed inset-0 z-[400] bg-nova-navy/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in">
          <div className="absolute top-10 right-10 z-50">
            <button onClick={() => setShowPlans(false)} className="w-16 h-16 rounded-full glass flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"><i className="fas fa-times text-2xl"></i></button>
          </div>
          <div className="w-full max-w-6xl space-y-12 relative">
            <h2 className="text-4xl font-black tracking-tighter text-center">Nova Premium Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {PLANS.map(plan => (
                <div key={plan.id} className="glass p-10 rounded-[48px] border border-white/5 flex flex-col space-y-8 hover:-translate-y-2 transition-all">
                  <h3 className="text-[10px] font-black text-nova-gold uppercase tracking-[0.4em]">{plan.name}</h3>
                  <div className="text-4xl font-black">₦{plan.price.toLocaleString()}</div>
                  <button onClick={() => handlePayment(plan.id)} className="w-full py-5 rounded-full border border-white/10 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-nova-gold hover:text-nova-navy transition-all">Purchase</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="fixed inset-0 z-[400] bg-nova-navy/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-700 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-6xl space-y-20 py-16 px-4">
            <div className="flex justify-between items-start">
              <h2 className="text-6xl font-black tracking-tighter leading-none">The Nova Crest <br/><span className="text-nova-gold">Experience</span></h2>
              <button onClick={() => setShowInfo(false)} className="w-16 h-16 rounded-full glass flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"><i className="fas fa-times text-2xl"></i></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
               <div className="lg:col-span-12">
                 <p className="text-2xl font-light leading-relaxed text-white/90 italic border-l-4 border-nova-gold pl-8 py-2">"{SCHOOL_DETAILS.mission}"</p>
               </div>
            </div>
            <button onClick={() => setShowInfo(false)} className="w-full py-6 rounded-full border border-white/10 bg-white/5 text-white font-black text-[10px] uppercase tracking-[0.3em]">Close Dossier</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;