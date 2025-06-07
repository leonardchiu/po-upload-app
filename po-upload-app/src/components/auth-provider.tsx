"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check active sessions and sets the user
    console.log("Auth Provider: Checking for existing session...");
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("Auth Provider: Initial session check:", { session, error });
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Provider: Auth state changed:", event, session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    console.log("Auth Provider: Starting sign in for", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("Auth Provider: Sign in response:", { data, error });
      
      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }
      
      if (data?.session) {
        console.log("Auth Provider: Session created:", data.session);
        console.log("Auth Provider: User:", data.user);
      }
      
      console.log("Auth Provider: Sign in successful, redirecting...");
      // Small delay to ensure session is set
      setTimeout(() => {
        window.location.href = "/upload";
      }, 100);
    } catch (err) {
      console.error("Sign in error:", err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    // Note: User might need to confirm email depending on your settings
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push("/"); // Redirect to home after logout
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};