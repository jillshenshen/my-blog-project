import type { Metadata } from "next";
import Image from "next/image";
import { HtmlContent } from "@/components/blog/HtmlContent";
import { getSiteSettings } from "@/lib/supabase/queries/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { title, aboutShort } = await getSiteSettings();
  return {
    title: "About",
    description: aboutShort || `${title} 站長介紹`,
  };
}

export default async function AboutPage() {
  const { aboutPhoto, aboutShort, aboutLong } = await getSiteSettings();

  return (
    <article>
      <header className="border-b border-[var(--color-border)] pb-8 text-center">
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">
          About
        </p>

        {aboutPhoto ? (
          <div className="mx-auto mt-6 h-40 w-40 overflow-hidden rounded-full bg-[var(--color-border)] sm:h-48 sm:w-48">
            <div className="relative h-full w-full">
              <Image
                src={aboutPhoto}
                alt="About me"
                fill
                sizes="192px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        ) : null}

        {aboutShort ? (
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted">
            {aboutShort}
          </p>
        ) : null}
      </header>

      <div className="mt-10">
        {aboutLong ? (
          <HtmlContent html={aboutLong} />
        ) : (
          <p className="text-center text-sm text-muted">
            (尚未填寫詳細自我介紹)
          </p>
        )}
      </div>
    </article>
  );
}
