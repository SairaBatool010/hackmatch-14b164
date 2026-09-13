import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppRole, ParticipantIdentity, Profile } from '@/lib/hackmatch.types';

interface HackmatchState {
  hydrated: boolean;
  appRole: AppRole | null;
  identity: ParticipantIdentity | null;
  profile: Profile | null;
  recommendationsVersion: number;
  setHydrated: (hydrated: boolean) => void;
  setAppRole: (appRole: AppRole | null) => void;
  setSession: (identity: ParticipantIdentity, profile?: Profile | null) => void;
  setProfile: (profile: Profile) => void;
  refreshRecommendations: () => void;
  clearSession: () => void;
}

export const useHackmatchStore = create<HackmatchState>()(
  persist(
    (set) => ({
      hydrated: false,
      appRole: null,
      identity: null,
      profile: null,
      recommendationsVersion: 0,
      setHydrated: (hydrated) => set({ hydrated }),
      setAppRole: (appRole) => set({ appRole }),
      setSession: (identity, profile = null) => set({ identity, profile }),
      setProfile: (profile) => set({ profile }),
      refreshRecommendations: () =>
        set((state) => ({ recommendationsVersion: state.recommendationsVersion + 1 })),
      clearSession: () => set({ identity: null, profile: null, recommendationsVersion: 0 }),
    }),
    {
      name: 'hackmatch-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        appRole: state.appRole,
        identity: state.identity,
        profile: state.profile,
        recommendationsVersion: state.recommendationsVersion,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
