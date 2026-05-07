import { Suspense } from "react";
import { PreviewClient } from "./PreviewClient";

export const metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default function PreviewPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-sm">載入中…</p>}>
      <PreviewClient />
    </Suspense>
  );
}
