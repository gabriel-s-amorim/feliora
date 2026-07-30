"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  fullName: string;
  phone: string;
};

function safeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/conta";
  }
  return next;
}

type CustomerAuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (next?: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (input: {
    fullName: string;
    phone: string;
  }) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(
  null
);

export const CART_REFRESH_EVENT = "feliora:cart-refresh";

async function mergeGuestCart() {
  try {
    await fetch("/api/cart/merge", { method: "POST" });
  } catch {
    // silencioso — carrinho ainda pode ser recarregado
  }
  window.dispatchEvent(new Event(CART_REFRESH_EVENT));
}

export function CustomerAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const mergedForUser = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("customer_profiles")
        .select("full_name, phone")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile({
          fullName: data.full_name ?? "",
          phone: data.phone ?? "",
        });
      } else {
        setProfile({ fullName: "", phone: "" });
      }
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function init() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
          if (mergedForUser.current !== session.user.id) {
            mergedForUser.current = session.user.id;
            await mergeGuestCart();
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
        if (
          (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
          mergedForUser.current !== session.user.id
        ) {
          mergedForUser.current = session.user.id;
          await mergeGuestCart();
        }
      } else {
        setProfile(null);
        mergedForUser.current = null;
        window.dispatchEvent(new Event(CART_REFRESH_EVENT));
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async (next?: string) => {
    const supabase = createClient();
    const redirectNext = safeNextPath(next);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", redirectNext);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.toString(),
        queryParams: {
          access_type: "online",
          prompt: "select_account",
        },
      },
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
    }) => {
      const supabase = createClient();
      const emailRedirectTo = new URL(
        "/auth/callback",
        window.location.origin
      );
      emailRedirectTo.searchParams.set("next", "/conta");

      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName,
            phone: input.phone ?? "",
          },
          emailRedirectTo: emailRedirectTo.toString(),
        },
      });
      if (error) throw error;

      if (data.session && input.phone) {
        await fetch("/api/account/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: input.fullName,
            phone: input.phone,
          }),
        });
      }

      return { needsEmailConfirmation: !data.session };
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    mergedForUser.current = null;
  }, []);

  const updateProfile = useCallback(
    async (input: { fullName: string; phone: string }) => {
      if (!user) throw new Error("Não autenticado");
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao salvar perfil");
      }
      setProfile({
        fullName: data.fullName ?? input.fullName,
        phone: data.phone ?? input.phone,
      });
    },
    [user]
  );

  const updatePassword = useCallback(async (password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
      updatePassword,
    }),
    [
      user,
      profile,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
      updatePassword,
    ]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error(
      "useCustomerAuth deve ser usado dentro de CustomerAuthProvider"
    );
  }
  return ctx;
}
