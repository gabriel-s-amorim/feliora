import type { StoreSettings } from "@/shared/types/storeSettings";

type SocialLinksProps = Pick<
  StoreSettings,
  "instagramUrl" | "facebookUrl" | "tiktokUrl" | "twitterUrl"
>;

type IconProps = {
  className?: string;
};

function TikTokIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.72-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
    </svg>
  );
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.5 22v-8h2.8l.42-3.25H13.5V8.68c0-.94.26-1.58 1.62-1.58h1.73V4.2a23 23 0 0 0-2.52-.13c-2.5 0-4.2 1.52-4.2 4.32v2.36H7.3V14h2.83v8h3.37Z" />
    </svg>
  );
}

function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function SocialLinks({
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  twitterUrl,
}: SocialLinksProps) {
  const links = [
    { href: instagramUrl, label: "Instagram", icon: InstagramIcon },
    { href: facebookUrl, label: "Facebook", icon: FacebookIcon },
    { href: tiktokUrl, label: "TikTok", icon: TikTokIcon },
    { href: twitterUrl, label: "X", icon: XIcon },
  ].filter((item) => item.href.trim());

  if (!links.length) return null;

  return (
    <div className="mt-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-earth">
        Siga a Feliora
      </p>
      <ul className="mt-2.5 flex items-center justify-center gap-2">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Feliora no ${item.label}`}
                title={item.label}
                className="flex size-10 items-center justify-center rounded-full border border-line bg-cream text-ink-muted transition-colors hover:border-rose-gold hover:bg-rose-gold hover:text-cream"
              >
                <Icon className="size-[1.05rem]" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
