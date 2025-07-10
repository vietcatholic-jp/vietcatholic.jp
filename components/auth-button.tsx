import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = user?.email?.slice(0, 4) || '';

  if (user) {
    // Try to get user profile for full name
    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profile?.full_name && profile.full_name.trim()) {
      displayName = profile.full_name;
    } else {
      displayName = user.email?.slice(0, 4) || '';
    }
  }

  return user ? (
    <div className="flex items-center gap-4">
      Xin chào, {displayName}!
      <LogoutButton />
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
