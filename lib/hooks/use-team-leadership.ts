"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UseTeamLeadershipReturn {
  isTeamLeader: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useTeamLeadership(user: User | null): UseTeamLeadershipReturn {
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkTeamLeadership = async () => {
      if (!user) {
        setIsTeamLeader(false);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();
        
        // Check if user is leader or sub-leader in any team
        const { data: teamLeadership, error: teamError } = await supabase
          .from('event_teams')
          .select('id, name')
          .or(`leader_id.eq.${user.id},sub_leader_id.eq.${user.id}`)
          .limit(1);

        if (teamError) {
          throw new Error(`Team leadership check failed: ${teamError.message}`);
        }

        if (isMounted) {
          const isLeader = Boolean(teamLeadership && teamLeadership.length > 0);
          console.log('Team leadership hook check:', { 
            userId: user.id, 
            email: user.email,
            teamLeadership, 
            isLeader 
          });
          setIsTeamLeader(isLeader);
        }
      } catch (err) {
        console.error('Team leadership check error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsTeamLeader(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkTeamLeadership();

    return () => {
      isMounted = false;
    };
  }, [user]); // Re-run when user changes

  return { isTeamLeader, isLoading, error };
}

// Alternative hook that uses localStorage for faster initial load
export function useTeamLeadershipWithCache(user: User | null): UseTeamLeadershipReturn {
  const [isTeamLeader, setIsTeamLeader] = useState(false); // Don't use cache for initial state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkTeamLeadership = async () => {
      if (!user) {
        setIsTeamLeader(false);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        // Check if user is leader or sub-leader in any team
        const { data: teamLeadership, error: teamError } = await supabase
          .from('event_teams')
          .select('id, name')
          .or(`leader_id.eq.${user.id},sub_leader_id.eq.${user.id}`)
          .limit(1);

        if (teamError) {
          console.error('Team leadership check error:', teamError);
          throw new Error(`Team leadership check failed: ${teamError.message}`);
        }

        if (isMounted) {
          const isLeader = Boolean(teamLeadership && teamLeadership.length > 0);

          console.log('Team leadership check:', {
            userId: user.id,
            email: user.email,
            teamLeadership,
            isLeader,
            environment: process.env.NODE_ENV
          });

          // Clear any old cache and set new value
          if (typeof window !== 'undefined') {
            if (isLeader) {
              localStorage.setItem(`team-leader-${user.id}`, 'true');
            } else {
              localStorage.removeItem(`team-leader-${user.id}`);
            }
          }

          setIsTeamLeader(isLeader);
        }
      } catch (err) {
        console.error('Team leadership check error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsTeamLeader(false); // Set to false on error

          // Clear cache on error
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`team-leader-${user.id}`);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkTeamLeadership();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { isTeamLeader, isLoading, error };
}

// Hook for real-time team leadership updates
export function useTeamLeadershipRealtime(user: User | null): UseTeamLeadershipReturn {
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setIsTeamLeader(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const supabase = createClient();
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const checkInitialTeamLeadership = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: teamLeadership, error: teamError } = await supabase
          .from('event_teams')
          .select('id, name')
          .or(`leader_id.eq.${user.id},sub_leader_id.eq.${user.id}`)
          .limit(1);

        if (teamError) {
          throw new Error(`Team leadership check failed: ${teamError.message}`);
        }

        const isLeader = Boolean(teamLeadership && teamLeadership.length > 0);
        console.log('Team leadership realtime initial check:', { 
          userId: user.id, 
          email: user.email,
          teamLeadership, 
          isLeader 
        });
        
        setIsTeamLeader(isLeader);
      } catch (err) {
        console.error('Team leadership initial check error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsTeamLeader(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up real-time subscription
    const setupSubscription = () => {
      subscription = supabase
        .channel('team-leadership-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_teams',
            filter: `or(leader_id.eq.${user.id},sub_leader_id.eq.${user.id})`
          },
          (payload) => {
            console.log('Team leadership change detected:', payload);
            // Re-check team leadership when changes occur
            checkInitialTeamLeadership();
          }
        )
        .subscribe();
    };

    checkInitialTeamLeadership();
    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user]);

  return { isTeamLeader, isLoading, error };
}
