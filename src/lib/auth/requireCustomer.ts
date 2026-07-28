import { createClient } from "@/lib/supabase/server";

export async function requireCustomerId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new CustomerAuthError("Faça login para continuar");
  }
  return user.id;
}

export async function getCustomerIdOrNull(): Promise<string | null> {
  try {
    return await requireCustomerId();
  } catch {
    return null;
  }
}

export class CustomerAuthError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = "CustomerAuthError";
  }
}
