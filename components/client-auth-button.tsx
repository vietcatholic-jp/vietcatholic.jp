"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  full_name: string | null;
  role: string;
}

export function ClientAuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const fetchUserAndProfile = async (user: User | null) => {
      if (user) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setUser(user);
      setLoading(false);
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Redirect to homepage after logout
    router.push("/");
  };

  if (loading) {
    return (
      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
    );
  }

  const getDisplayName = () => {
    if (profile?.full_name && profile.full_name.trim()) {
      return profile.full_name;
    }
    return user?.email?.slice(0, 10) + '...' || '';
  };

  const isAdmin = profile?.role && ['registration_manager', 'event_organizer', 'group_leader', 'regional_admin', 'super_admin'].includes(profile.role);

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        Xin chào, {getDisplayName()}
      </span>
      {isAdmin && (
        <Button asChild size="sm" variant="outline">
          <Link href={profile.role === 'registration_manager' ? '/admin/registration-manager' : '/admin'}>
            Quản trị
          </Link>
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleSignOut}
      >
        Đăng xuất
      </Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Đăng nhập</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Đăng ký</Link>
      </Button>
    </div>
  );
}
