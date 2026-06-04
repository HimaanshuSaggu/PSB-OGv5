import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const f = searchParams.get("f");
  if (!f) return new Response("missing", { status: 400 });
  const res = await fetch("http://hooloovoo.blue:18922/powersurge/images/" + f);
  if (!res.ok) return new Response("not found", { status: 404 });
  const buf = await res.arrayBuffer();
  return new Response(buf, {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" },
  });
}
