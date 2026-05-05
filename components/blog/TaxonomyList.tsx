import Link from "next/link";

type Item = { id: string; name: string; slug: string };

type Props = {
  items: Item[];
  basePath: "/tags" | "/categories";
};

export function TaxonomyList({ items, basePath }: Props) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`${basePath}/${item.slug}`}
            className="inline-block border border-[var(--color-border)] bg-tag-bg px-3 py-1.5 text-[10px] tracking-[0.25em] text-tag-fg uppercase transition hover:border-[var(--color-accent)] hover:text-accent"
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
