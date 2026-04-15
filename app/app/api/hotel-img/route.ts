import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["cf.bstatic.com", "bstatic.com"];

function isAllowedUrl(url: string): boolean {
  try {
    return ALLOWED_HOSTS.some((h) => new URL(url).hostname.endsWith(h));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return new NextResponse("Missing url param", { status: 400 });

  let imageUrl: string;
  try {
    imageUrl = decodeURIComponent(raw);
  } catch {
    return new NextResponse("Invalid url param", { status: 400 });
  }

  if (!isAllowedUrl(imageUrl)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UltimatePlayground/1.0)",
        "Accept": "image/webp,image/jpeg,image/*,*/*;q=0.8",
      },
    });

    if (!imgRes.ok) return new NextResponse(null, { status: 502 });

    const ct = imgRes.headers.get("Content-Type") ?? "";
    if (!ct.startsWith("image/")) return new NextResponse(null, { status: 502 });

    const responseHeaders: Record<string, string> = {
      "Content-Type": ct,
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
    };
    const cl = imgRes.headers.get("Content-Length");
    if (cl) responseHeaders["Content-Length"] = cl;

    return new NextResponse(imgRes.body, { headers: responseHeaders });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
