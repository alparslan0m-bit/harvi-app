import { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle deep-link tokens after Google OAuth redirect
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (url.includes("access_token") || url.includes("code=")) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          url.split("code=")[1]?.split("&")[0] ?? ""
        );
        if (!error && data.session) {
          setSession(data.session);
          setUser(data.session.user);
        } else {
          // Try setting session from fragment tokens
          const params = new URLSearchParams(url.split("#")[1] ?? url.split("?")[1] ?? "");
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      }
    };

    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    return () => sub.remove();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
      const redirectTo = Linking.createURL("/auth/callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        return { error: error?.message ?? "Could not start Google sign-in" };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === "success" && result.url) {
        const url = result.url;
        // Try PKCE code exchange first
        const codeMatch = url.match(/code=([^&]+)/);
        if (codeMatch) {
          const { error: exchError } = await supabase.auth.exchangeCodeForSession(codeMatch[1]);
          if (exchError) return { error: exchError.message };
          return { error: null };
        }
        // Fallback: fragment tokens
        const hash = url.split("#")[1] ?? "";
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error: sessError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessError) return { error: sessError.message };
          return { error: null };
        }
        return { error: "Authentication incomplete. Please try again." };
      }

      if (result.type === "cancel" || result.type === "dismiss") {
        return { error: null }; // user cancelled, not an error
      }

      return { error: "Sign-in was not completed." };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Unknown error" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signIn, signUp, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
