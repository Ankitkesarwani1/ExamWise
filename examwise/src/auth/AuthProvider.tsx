import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../lib/supabase";

export type Profile = { id: string; full_name: string | null; branch: string | null; semester: number | null };

type AuthCtx = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  displayName: string;
  initials: string;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setProfile(null); return; }
    // Retry once after a short delay — the DB trigger that creates the profile
    // row runs asynchronously after sign-up, so it may not exist immediately.
    const load = () =>
      supabase.from("profiles").select("id, full_name, branch, semester")
        .eq("id", session.user.id).maybeSingle()
        .then(({ data }) => setProfile(data as Profile | null));
    load();
    const retry = setTimeout(load, 1500); // second attempt after 1.5 s
    return () => clearTimeout(retry);
  }, [session?.user?.id]);

  const user = session?.user ?? null;
  const displayName = profile?.full_name || (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "Student";
  const initials = displayName.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return <Ctx.Provider value={{ loading, session, user, profile, displayName, initials, signOut: async () => { await supabase.auth.signOut(); } }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}
