"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

  useEffect(() => {
    const supabase = createClient();
    
    const fetchUserAndProfile = async (user: User | null) => {
      setIsLoading(true);
      try {
        if (user) {
          const { data: profileData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          setProfile(profileData);
        } else {
          setProfile(null);
        }
        setUser(user);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserAndProfile(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserAndProfile(session?.user ?? null);
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