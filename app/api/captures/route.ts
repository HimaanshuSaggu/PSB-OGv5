import { NextResponse } from "next/server";

// Friend's Debian/nginx server — public autoindex of capture images.
const SOURCE = "http://hooloovoo.blue:18922/powersurge/images/";

export const dynamic = "force-dynamic"; // never cache; always read live

export async function GET() {
  try {
    const res = await fetch(SOURCE, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ ok: false, items: [], error: `status ${res.status}` });
    }
    const html = await res.text();

    // Parse any <a href="..."> that points at an image file (nginx autoindex).
    const re = /href="([^"?#]+\.(?:jpe?g|png|webp|gif))"/gi;
    const seen = new Set<string>();
    const items: { url: string; name: string; ts: number | null }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      let file = decodeURIComponent(m[1]);
      if (file.includes("/")) file = file.split("/").pop() || file;
      if (!file || seen.has(file)) continue;
      seen.add(file);
      // capture_1748147640.jpg  ->  epoch seconds
      const t = file.match(/(\d{10})/);
      const ts = t ? parseInt(t[1], 10) : null;
      items.push({ url: SOURCE + file, name: file, ts });
    }
    items.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      items: [],
      error: e instanceof Error ? e.message : "fetch failed",
    });
  }
}
