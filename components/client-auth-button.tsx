"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function ClientAuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
    );
  }

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        Xin chào, {user.email?.slice(0, 10)}...
      </span>
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
