import { NextResponse } from "next/server";
import {
  CustomerAuthError,
  requireCustomerId,
} from "@/lib/auth/requireCustomer";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneBr, isValidPhoneBr } from "@/shared/lib/phoneBr";
import { z } from "zod";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo").max(120),
  phone: z
    .string()
    .trim()
    .transform((v) => normalizePhoneBr(v))
    .refine((v) => v.length === 0 || isValidPhoneBr(v), "Telefone inválido"),
});

export async function GET() {
  try {
    const customerId = await requireCustomerId();
    const supabase = createAdminClient();
    let { data, error } = await supabase
      .from("customer_profiles")
      .select("id, full_name, phone, created_at")
      .eq("id", customerId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!data) {
      const { data: inserted, error: insertError } = await supabase
        .from("customer_profiles")
        .upsert({ id: customerId, full_name: "", phone: "" })
        .select("id, full_name, phone, created_at")
        .single();
      if (insertError) throw new Error(insertError.message);
      data = inserted;
    }

    return NextResponse.json({
      id: data.id,
      fullName: data.full_name ?? "",
      phone: data.phone ?? "",
      createdAt: data.created_at,
    });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const customerId = await requireCustomerId();
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("customer_profiles")
      .upsert({
        id: customerId,
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      })
      .select("id, full_name, phone, created_at")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      id: data.id,
      fullName: data.full_name ?? "",
      phone: data.phone ?? "",
      createdAt: data.created_at,
    });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar" },
      { status: 500 }
    );
  }
}
