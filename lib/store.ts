import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Registration, RegionType, UserRole } from './types';

interface AppState {
  // User state
  user: User | null;
  isLoading: boolean;
  
  // Onboarding state
  onboardingCompleted: boolean;
  selectedRegion: RegionType | null;
  selectedRole: UserRole | null;
  
  // Registration state
  currentRegistration: Registration | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingData: (region: RegionType, role: UserRole) => void;
  completeOnboarding: () => void;
  setCurrentRegistration: (registration: Registration | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isLoading: false,
      onboardingCompleted: false,
      selectedRegion: null,
      selectedRole: null,
      currentRegistration: null,

      // Actions
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setOnboardingData: (region, role) => 
        set({ selectedRegion: region, selectedRole: role }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      setCurrentRegistration: (registration) => 
        set({ currentRegistration: registration }),
      reset: () => set({
        user: null,
        isLoading: false,
        onboardingCompleted: false,
        selectedRegion: null,
        selectedRole: null,
        currentRegistration: null,
      }),
    }),
    {
      name: 'congress-app-store',
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        selectedRegion: state.selectedRegion,
        selectedRole: state.selectedRole,
      }),
    }
  )
);
