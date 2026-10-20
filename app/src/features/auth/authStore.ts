import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

export interface ProfileData {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  rideCount: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface PrivateProfileData {
  phone?: string | null;
  upiId?: string | null;
  lateCancellations: number;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: ProfileData | null;
  privateProfile: PrivateProfileData | null;
  isLoading: boolean;
  pendingEmail: string;
  setSession: (session: Session | null) => void;
  setProfile: (profile: ProfileData | null) => void;
  setPrivateProfile: (privateProfile: PrivateProfileData | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setPendingEmail: (email: string) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  privateProfile: null,
  isLoading: true,
  pendingEmail: '',
  setSession: (session) =>
    set({
      session,
      user: session?.user || null,
      isLoading: false,
    }),
  setProfile: (profile) => set({ profile }),
  setPrivateProfile: (privateProfile) => set({ privateProfile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setPendingEmail: (pendingEmail) => set({ pendingEmail }),
  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      privateProfile: null,
      isLoading: false,
      pendingEmail: '',
    }),
}));
