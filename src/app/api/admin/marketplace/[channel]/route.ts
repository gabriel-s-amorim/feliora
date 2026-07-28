import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  disconnectChannel,
  getChannelAdminStatus,
  updateChannelSettings,
} from "@/lib/marketplace/settings";
import { marketplaceSettingsUpdateSchema } from "@/shared/schemas/marketplace";
import type { MarketplaceChannel } from "@/shared/types/marketplace";

function parseChannel(raw: string): MarketplaceChannel | null {
  if (raw === "shopee" || raw === "tiktok") return raw;
  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ channel: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { channel: raw } = await context.params;
  const channel = parseChannel(raw);
  if (!channel) {
    return NextResponse.json({ error: "Canal inválido" }, { status: 400 });
  }

  try {
    const status = await getChannelAdminStatus(channel);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ channel: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { channel: raw } = await context.params;
  const channel = parseChannel(raw);
  if (!channel) {
    return NextResponse.json({ error: "Canal inválido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = marketplaceSettingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }
    const status = await updateChannelSettings(channel, parsed.data);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ channel: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { channel: raw } = await context.params;
  const channel = parseChannel(raw);
  if (!channel) {
    return NextResponse.json({ error: "Canal inválido" }, { status: 400 });
  }

  try {
    const status = await disconnectChannel(channel);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 }
    );
  }
}
