export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown> | null>;
}) {
  const payload = Array.isArray(data) ? data.filter(Boolean) : data;
  if (Array.isArray(payload) && payload.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}
