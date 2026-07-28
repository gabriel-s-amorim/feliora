import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const ADMIN_COOKIE_NAME = "feliora_admin_token";
export const ADMIN_COOKIE_MAX_AGE_SEC = 12 * 60 * 60;
const TOKEN_TTL = "12h";
const TOKEN_ISSUER = "feliora";
const TOKEN_AUDIENCE = "feliora-admin";
const BCRYPT_ROUNDS = 12;

export type AdminSession = {
  adminId: string;
  email: string;
  name: string;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("Configure ADMIN_JWT_SECRET no arquivo .env");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function signAdminToken(session: AdminSession): Promise<string> {
  return new SignJWT({
    role: "admin",
    email: session.email,
    name: session.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.adminId)
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getJwtSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });

    if (payload.role !== "admin" || typeof payload.sub !== "string") {
      return null;
    }

    return {
      adminId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}

export function adminCookieOptions(maxAge = ADMIN_COOKIE_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function setAdminCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE_NAME, token, adminCookieOptions());
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE_NAME, "", adminCookieOptions(0));
}

export async function getAdminSessionFromCookies(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

type AdminUserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  is_active: boolean;
};

/** Cria o primeiro admin a partir de ADMIN_BOOTSTRAP_* se a tabela estiver vazia. */
export async function ensureAdminBootstrap(): Promise<void> {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  if (!email || !password) return;

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("admin bootstrap count failed:", error.message);
    return;
  }

  if ((count ?? 0) > 0) return;

  const passwordHash = await hashPassword(password);
  const { error: insertError } = await supabase.from("admin_users").insert({
    email,
    password_hash: passwordHash,
    name: "Admin",
    is_active: true,
  });

  if (insertError) {
    console.error("admin bootstrap insert failed:", insertError.message);
  }
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminSession | null> {
  await ensureAdminBootstrap();

  const supabase = createAdminClient();
  const normalized = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, password_hash, name, is_active")
    .ilike("email", normalized)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as AdminUserRow;
  if (!row.is_active) return null;

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return null;

  return {
    adminId: row.id,
    email: row.email,
    name: row.name || "Admin",
  };
}
