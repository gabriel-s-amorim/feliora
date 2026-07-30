import { createAdminClient } from "@/lib/supabase/admin";
import type { AnalyticsCollectInput } from "@/shared/schemas/analytics";
import type {
  AnalyticsRange,
  SiteAnalyticsOverview,
} from "@/shared/types/analytics";

export async function recordSiteAnalyticsEvent(
  input: AnalyticsCollectInput
): Promise<void> {
  const { error } = await createAdminClient().rpc("record_site_analytics_event", {
    p_visitor_id: input.visitorId,
    p_session_id: input.sessionId,
    p_path: input.path,
    p_referrer_host: input.referrerHost ?? "",
    p_device_type: input.deviceType,
    p_kind: input.kind,
  });
  if (error) throw new Error(error.message);
}

export async function getAdminSiteAnalytics(
  range: AnalyticsRange
): Promise<SiteAnalyticsOverview> {
  const { data, error } = await createAdminClient().rpc("admin_site_analytics", {
    p_range: range,
  });
  if (error) throw new Error(error.message);
  return data as SiteAnalyticsOverview;
}
