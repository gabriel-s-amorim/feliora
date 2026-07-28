import { createClient } from "@/lib/supabase/server";
import {
  getCartSessionId,
  ensureCartSessionId,
} from "@/lib/cart/session";
import type { CartIdentity } from "@/lib/cart/service";

/** Preferência: cliente logado → customer cart; senão guest session. */
export async function resolveCartIdentity(): Promise<{
  identity: CartIdentity | null;
  customerId: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return {
        identity: { kind: "customer", customerId: user.id },
        customerId: user.id,
      };
    }
  } catch {
    // sem sessão auth
  }

  const sessionId = await getCartSessionId();
  if (!sessionId) {
    return { identity: null, customerId: null };
  }

  return {
    identity: { kind: "session", sessionId },
    customerId: null,
  };
}

export async function resolveCartIdentityForWrite(): Promise<{
  identity: CartIdentity;
  customerId: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return {
        identity: { kind: "customer", customerId: user.id },
        customerId: user.id,
      };
    }
  } catch {
    // guest
  }

  const sessionId = await ensureCartSessionId();
  return {
    identity: { kind: "session", sessionId },
    customerId: null,
  };
}
