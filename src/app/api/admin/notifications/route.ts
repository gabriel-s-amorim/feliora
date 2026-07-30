import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  countUnreadAdminNotifications,
  listAdminNotifications,
  markAdminNotificationRead,
  markAdminNotificationsRead,
  markAllAdminNotificationsRead,
} from "@/lib/admin/notifications";
import { markAdminNotificationsSchema } from "@/shared/schemas/adminNotification";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const [notifications, unreadCount] = await Promise.all([
      listAdminNotifications(),
      countUnreadAdminNotifications(),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao carregar notificações",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = markAdminNotificationsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Dados inválidos",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    if (parsed.data.markAll) {
      await markAllAdminNotificationsRead();
    } else {
      const ids = [
        ...(parsed.data.notificationIds ?? []),
        ...(parsed.data.notificationId ? [parsed.data.notificationId] : []),
      ];
      if (ids.length === 1) {
        await markAdminNotificationRead(ids[0]);
      } else {
        await markAdminNotificationsRead(ids);
      }
    }

    const unreadCount = await countUnreadAdminNotifications();
    return NextResponse.json({ ok: true, unreadCount });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao marcar notificações";
    const status = message.includes("ainda não existem") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
