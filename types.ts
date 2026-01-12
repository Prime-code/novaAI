
export interface UserProfile {
  name: string;
  email: string;
  type: 'parent' | 'student' | null;
  role: 'admin' | 'user';
  credits: number; // In words
  subscriptionStatus: 'active' | 'expired' | 'none';
  plan: string | null;
  hasClaimedFree: boolean;
  isAuthenticated: boolean;
}

export type AppMode = 'test' | 'paid';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Array<{ title: string; uri: string }>;
}

export interface FeedbackLog {
  userName: string;
  userType: string;
  rating: 'good' | 'bad';
  timestamp: number;
}

export interface AuditLog {
  timestamp: number;
  type: 'success' | 'denied_confirmation' | 'denied_password' | 'password_reset' | 'mfa_enabled' | 'mfa_disabled' | 'key_rotation' | 'login_success' | 'login_failed';
  userName: string;
  details: string;
}

export interface SecuritySettings {
  adminKey: string;
  isMfaEnabled: boolean;
  securityPin: string;
  lastRotation: number;
}

export interface ChatLog {
  userName: string;
  messages: Message[];
  timestamp: number;
  summary?: string;
}

export enum InteractionMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE'
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration: 'daily' | 'weekly' | 'monthly';
  wordLimit: number;
}
