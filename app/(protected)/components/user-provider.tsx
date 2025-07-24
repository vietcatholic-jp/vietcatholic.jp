"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  role: string;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cachedProfileRef = useRef<{ userId: string; profile: UserProfile | null } | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchUserAndProfile = async (user: User | null, forceRefresh = false) => {
      // Only show loading on initial load or when user changes (login/logout)
      if (initialLoadRef.current || (!user && cachedProfileRef.current) || (user && !cachedProfileRef.current)) {
        setIsLoading(true);
      }

      try {
        if (user) {
          // Check if we have cached profile for this user (but not on initial load)
          if (cachedProfileRef.current?.userId === user.id && !forceRefresh && !initialLoadRef.current) {
            setProfile(cachedProfileRef.current.profile);
            setUser(user);
            setIsLoading(false);
            return;
          }

          const { data: profileData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          // Cache the profile
          cachedProfileRef.current = { userId: user.id, profile: profileData };
          setProfile(profileData);
        } else {
          // Clear cache on logout
          cachedProfileRef.current = null;
          setProfile(null);
        }
        setUser(user);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setProfile(null);
      } finally {
        setIsLoading(false);
        initialLoadRef.current = false;
      }
    };

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserAndProfile(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only refetch profile on actual auth changes
      const shouldRefresh = event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED';
      fetchUserAndProfile(session?.user ?? null, shouldRefresh);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = Boolean(
    profile?.role && [
      'registration_manager',
      'event_organizer', 
      'group_leader',
      'regional_admin',
      'super_admin'
    ].includes(profile.role)
  );

  return (
    <UserContext.Provider value={{ user, profile, isLoading, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}