import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SERVER = "http://hooloovoo.blue:18922/powersurge/images/";

export async function GET() {
  try {
    const res = await fetch(SERVER, { next: { revalidate: 10 } });
    const html = await res.text();
    const matches = [...html.matchAll(/href="([^"]+\.jpg)"/g)];
    const files = matches.map(m => m[1]).reverse();
    return NextResponse.json({ ok: true, files, base: SERVER });
  } catch (e) {
    return NextResponse.json({ ok: false, files: [], base: SERVER });
  }
}

export async function GET_IMAGE(req: Request) {
  const url = new URL(req.url);
  const file = url.searchParams.get("file");
  if (!file) return new Response("missing file", { status: 400 });
  const res = await fetch(`${SERVER}${file}`);
  const blob = await res.blob();
  return new Response(blob, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" } });
}
