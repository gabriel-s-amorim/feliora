import { NextResponse } from "next/server";
import {
  CustomerAuthError,
  requireCustomerId,
} from "@/lib/auth/requireCustomer";
import {
  countUnreadNotifications,
  listCustomerNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsRead,
} from "@/lib/orders/communication";
import { markNotificationsSchema } from "@/shared/schemas/orderCommunication";

export async function GET() {
  try {
    const customerId = await requireCustomerId();
    const [notifications, unreadCount] = await Promise.all([
      listCustomerNotifications(customerId),
      countUnreadNotifications(customerId),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
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
  try {
    const customerId = await requireCustomerId();
    const body = await request.json();
    const parsed = markNotificationsSchema.safeParse(body);
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
      await markAllNotificationsRead(customerId);
    } else {
      const ids = [
        ...(parsed.data.notificationIds ?? []),
        ...(parsed.data.notificationId ? [parsed.data.notificationId] : []),
      ];
      if (ids.length === 1) {
        await markNotificationRead(customerId, ids[0]);
      } else {
        await markNotificationsRead(customerId, ids);
      }
    }

    const unreadCount = await countUnreadNotifications(customerId);
    return NextResponse.json({ ok: true, unreadCount });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao marcar notificações";
    const status = message.includes("ainda não existem") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
