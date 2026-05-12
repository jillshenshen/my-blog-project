import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/supabase/queries/posts";
import { getSiteSettings } from "@/lib/supabase/queries/site-settings";
import { decodeParam } from "@/lib/utils/decode-param";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Article cover";

type Params = { slug: string };

// 從 Google Fonts dynamic subset API 抓僅含必要字元的 woff2，回傳 ArrayBuffer
async function loadGoogleFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer | null> {
  if (!text.trim()) return null;
  const familyParam = family.replace(/ /g, "+");
  const url = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}&text=${encodeURIComponent(text)}`;
  try {
    const css = await (
      await fetch(url, {
        headers: {
          // 沒指定 modern UA 拿到的會是 ttf，woff2 較小較快
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      })
    ).text();
    const match = css.match(/src:\s*url\((.+?)\)\s*format\(['"]?woff2['"]?\)/);
    if (!match) return null;
    return await (await fetch(match[1])).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const [post, settings] = await Promise.all([
    getPostBySlug(slug),
    getSiteSettings(),
  ]);

  const title = post?.title ?? "Not Found";
  const category = post?.category?.name ?? "";
  const siteTitle = settings.title;
  const siteSubtitle = settings.subtitle;

  // dynamic subset：只下載實際會渲染的字元
  const titleText = `${title}${category}${siteSubtitle}`;
  const [notoBold, dancing] = await Promise.all([
    loadGoogleFont("Noto Sans TC", 700, titleText),
    loadGoogleFont("Dancing Script", 700, siteTitle),
  ]);

  const fonts: { name: string; data: ArrayBuffer; weight: 700; style: "normal" }[] = [];
  if (notoBold) fonts.push({ name: "Noto Sans TC", data: notoBold, weight: 700, style: "normal" });
  if (dancing) fonts.push({ name: "Dancing Script", data: dancing, weight: 700, style: "normal" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f5f1ea",
          color: "#1a1a1a",
          fontFamily: "Noto Sans TC, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: "Dancing Script, cursive",
              fontSize: 56,
              lineHeight: 1,
              color: "#1a1a1a",
            }}
          >
            {siteTitle}
          </div>
          {category ? (
            <div
              style={{
                fontSize: 18,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#6b6b6b",
                border: "1px solid #1a1a1a",
                padding: "10px 20px",
              }}
            >
              {category}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 28 ? 64 : 80,
            lineHeight: 1.25,
            fontWeight: 700,
            color: "#1a1a1a",
            maxWidth: "100%",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #1a1a1a",
            paddingTop: 24,
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#6b6b6b",
            }}
          >
            {siteSubtitle}
          </div>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#6b6b6b",
            }}
          >
            Read more →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  );
}
