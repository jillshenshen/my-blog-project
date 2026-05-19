type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

// 把 < 轉成 < 避免 JSON 字串內若出現 </script> 提前關閉 inline script
function safeStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeStringify(data) }}
    />
  );
}
