export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown> | null>;
}) {
  const items = (Array.isArray(data) ? data : [data]).filter(
    (item): item is Record<string, unknown> => Boolean(item)
  );
  if (items.length === 0) return null;

  return (
    <>
      {items.map((item, index) => (
        <script
          key={`${String(item["@type"] ?? "schema")}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
