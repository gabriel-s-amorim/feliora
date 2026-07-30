export type AnalyticsRange = "today" | "yesterday" | "7d" | "30d" | "month";

export type AnalyticsDevice = "mobile" | "tablet" | "desktop";

export type SiteAnalyticsOverview = {
  range: AnalyticsRange;
  timezone: string;
  generatedAt: string;
  activeNow: number;
  uniqueVisitors: number;
  pageViews: number;
  sessions: number;
  pagesPerSession: number;
  previous: {
    uniqueVisitors: number;
    pageViews: number;
    sessions: number;
  };
  series: Array<{
    date: string;
    uniqueVisitors: number;
    pageViews: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
    unique_visitors: number;
  }>;
  devices: Array<{
    device: AnalyticsDevice | string;
    visitors: number;
  }>;
  referrers: Array<{
    host: string | null;
    visitors: number;
  }>;
  livePaths: Array<{
    path: string;
    visitors: number;
  }>;
};
