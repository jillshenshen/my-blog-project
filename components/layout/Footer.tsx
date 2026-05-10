import { getSiteSettings } from "@/lib/supabase/queries/site-settings";

export async function Footer() {
  const year = new Date().getFullYear();
  const { title } = await getSiteSettings();
  return (
    <footer className="mt-20 border-t border-[var(--color-border)] bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6">
        <p className="font-script text-2xl text-foreground">{title}</p>
        <p className="mt-2 text-[10px] tracking-[0.3em] text-muted uppercase">
          © {year} All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
