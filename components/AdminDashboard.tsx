
import React, { useState } from 'react';
import { ChatLog, FeedbackLog, UserProfile, AppMode, AuditLog, SecuritySettings } from '../types';
import { ChatList, UserList, AuditLogView, SecurityPanel, GlobalSettings } from './admin/AdminTabs';

interface AdminDashboardProps {
  onBack: () => void;
  chats: ChatLog[];
  feedback: FeedbackLog[];
  users: UserProfile[];
  auditLogs: AuditLog[];
  appMode: AppMode;
  security: SecuritySettings;
  onUpdateSecurity: (s: SecuritySettings) => void;
  onUpdateUsers: (updatedUsers: UserProfile[]) => void;
  onToggleMode: () => void;
  recordAudit: (type: AuditLog['type'], details: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBack, chats, feedback, users, auditLogs, appMode, security, onUpdateSecurity, onUpdateUsers, onToggleMode, recordAudit
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'users' | 'feedback' | 'audit' | 'settings' | 'security'>('chats');
  const [selectedChat, setSelectedChat] = useState<ChatLog | null>(null);
  
  const [newKey, setNewKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');

  const rotateKey = () => {
    if (newKey && newKey === confirmKey) {
      onUpdateSecurity({ ...security, adminKey: newKey, lastRotation: Date.now() });
      recordAudit('key_rotation', 'Key rotated.');
      setNewKey(''); setConfirmKey('');
    }
  };

  const toggleMfa = () => {
    onUpdateSecurity({ ...security, isMfaEnabled: !security.isMfaEnabled });
  };

  return (
    <div className="h-screen w-screen bg-nova-navy flex flex-col text-white overflow-hidden animate-in fade-in duration-500">
      <header className="p-8 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all"><i className="fas fa-chevron-left"></i></button>
          <h1 className="text-xl font-bold">Governance Center</h1>
        </div>
        <div className="flex gap-2">
          {['chats', 'users', 'feedback', 'audit', 'security', 'settings'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} 
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-nova-gold text-nova-navy' : 'glass opacity-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex p-8 gap-8">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'chats' && <ChatList chats={chats} onSelect={setSelectedChat} selectedChat={selectedChat} />}
          {activeTab === 'users' && <UserList users={users} />}
          {activeTab === 'audit' && <AuditLogView logs={auditLogs} />}
          {activeTab === 'security' && <SecurityPanel security={security} newKey={newKey} setNewKey={setNewKey} confirmKey={confirmKey} setConfirmKey={setConfirmKey} rotateKey={rotateKey} toggleMfa={toggleMfa} />}
          {activeTab === 'settings' && <GlobalSettings appMode={appMode} onToggle={onToggleMode} />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
