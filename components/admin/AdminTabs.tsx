
import React from 'react';
import { ChatLog, FeedbackLog, UserProfile, AppMode, AuditLog, SecuritySettings } from '../../types';

export const ChatList: React.FC<{ chats: ChatLog[]; onSelect: (chat: ChatLog) => void; selectedChat: ChatLog | null }> = ({ chats, onSelect, selectedChat }) => (
  <div className="grid grid-cols-1 gap-4">
    {chats.map((chat, idx) => (
      <div key={idx} onClick={() => onSelect(chat)} className={`admin-card glass p-6 rounded-3xl cursor-pointer hover:border-nova-gold/40 border transition-all ${selectedChat === chat ? 'border-nova-gold' : 'border-white/5'}`}>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-bold text-nova-gold">{chat.userName}</span>
          <span className="text-[9px] opacity-40 uppercase">{new Date(chat.timestamp).toLocaleString()}</span>
        </div>
        <p className="text-[11px] text-white/60 italic leading-relaxed">"{chat.summary || "Active transcript session."}"</p>
      </div>
    ))}
  </div>
);

export const UserList: React.FC<{ users: UserProfile[] }> = ({ users }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {users.map(user => (
      <div key={user.email} className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="max-w-[150px]">
            <h4 className="font-bold text-sm truncate">{user.name || 'Incomplete Profile'}</h4>
            <p className="text-[8px] opacity-40 uppercase tracking-tighter truncate">{user.email}</p>
          </div>
          <span className="text-[8px] font-black uppercase bg-nova-gold/10 text-nova-gold px-2 py-1 rounded">{user.type || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-medium bg-white/5 p-3 rounded-xl">
          <span>Credits: {user.credits}</span>
          <span className={`px-2 py-0.5 rounded-full ${user.subscriptionStatus === 'active' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>{user.subscriptionStatus}</span>
        </div>
      </div>
    ))}
  </div>
);

export const AuditLogView: React.FC<{ logs: AuditLog[] }> = ({ logs }) => (
  <div className="space-y-4">
    {logs.map((log, idx) => (
      <div key={idx} className="glass p-6 rounded-3xl border border-white/5 flex justify-between items-center border-l-2 border-l-nova-gold">
         <div className="flex items-center gap-4">
           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.type === 'login_success' || log.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
             <i className={`fas ${log.type.includes('login') ? 'fa-fingerprint' : 'fa-shield-halved'}`}></i>
           </div>
           <div className="max-w-[300px]">
             <p className="text-[10px] font-black uppercase tracking-widest truncate">{log.userName}</p>
             <p className="text-[10px] text-white/40">{log.details}</p>
           </div>
         </div>
         <span className="text-[9px] opacity-30 text-right">{new Date(log.timestamp).toLocaleString()}</span>
      </div>
    ))}
  </div>
);

export const SecurityPanel: React.FC<{ 
  security: SecuritySettings; 
  newKey: string; setNewKey: (v: string) => void;
  confirmKey: string; setConfirmKey: (v: string) => void;
  rotateKey: () => void; toggleMfa: () => void;
}> = ({ security, newKey, setNewKey, confirmKey, setConfirmKey, rotateKey, toggleMfa }) => (
  <div className="space-y-8 max-w-4xl">
    <div className="glass p-10 rounded-[40px] border border-white/5 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">Commander Key Rotation</h3>
          <p className="text-xs text-white/40">Institution Master Authorization Access Key.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input type="password" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="New Key" className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-nova-gold" />
        <input type="password" value={confirmKey} onChange={(e) => setConfirmKey(e.target.value)} placeholder="Confirm Key" className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-nova-gold" />
      </div>
      <button onClick={rotateKey} className="w-full py-4 bg-nova-gold text-nova-navy rounded-2xl font-black text-[10px] uppercase tracking-widest">Update Master Key</button>
    </div>

    <div className="glass p-10 rounded-[40px] border border-white/5 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">Multi-Factor Protocol</h3>
          <p className="text-xs text-white/40">Toggle secondary PIN verification.</p>
        </div>
        <button onClick={toggleMfa} className={`w-14 h-8 rounded-full relative transition-all ${security.isMfaEnabled ? 'bg-green-500' : 'bg-white/10'}`}>
          <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${security.isMfaEnabled ? 'right-1' : 'left-1'}`}></div>
        </button>
      </div>
    </div>
  </div>
);

export const GlobalSettings: React.FC<{ appMode: AppMode; onToggle: () => void }> = ({ appMode, onToggle }) => (
  <div className="glass p-10 rounded-[40px] border border-white/5 space-y-10">
    <div className="space-y-2">
      <h3 className="text-2xl font-bold">Global Institution State</h3>
      <p className="text-sm text-white/40">Manage system operating mode.</p>
    </div>
    <div className="flex items-center justify-between p-8 bg-white/5 rounded-3xl border border-white/10">
      <div>
        <p className="font-bold text-lg">Current Operating Mode</p>
        <p className={`text-xs ${appMode === 'paid' ? 'text-red-400' : 'text-nova-gold'}`}>
          {appMode === 'paid' ? 'Paid Mode: Strict word limits active.' : 'Test Mode: Credits bypass active.'}
        </p>
      </div>
      <button onClick={onToggle} className={`px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all ${appMode === 'test' ? 'bg-nova-gold text-nova-navy shadow-lg shadow-nova-gold/20' : 'bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500 hover:text-white'}`}>
        {appMode === 'test' ? 'Switch to Paid' : 'Force Test Mode'}
      </button>
    </div>
  </div>
);
