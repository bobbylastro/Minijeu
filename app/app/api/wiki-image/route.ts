import { NextRequest, NextResponse } from "next/server";

// Server-side Wikipedia image proxy.
// Fetches images from Wikimedia with a proper Referer header so hotlink
// protection never triggers in the user's browser.
//
// Usage:
//   /api/wiki-image?title=Elon+Musk          → fetch by Wikipedia page title
//   /api/wiki-image?url=https://upload...jpg  → proxy a known Wikimedia URL

const WIKIMEDIA_HOSTS = ["upload.wikimedia.org", "wikipedia.org"];

function isWikimediaUrl(url: string) {
  try {
    return WIKIMEDIA_HOSTS.some(h => new URL(url).hostname.endsWith(h));
  } catch {
    return false;
  }
}

async function resolveImageUrl(title: string): Promise<string | null> {
  // 1) pageimages API – fastest, returns a pre-sized thumbnail
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&origin=*`,
      { headers: { "User-Agent": "UltimatePlayground/1.0 (https://ultimate-playground.com)" } }
    );
    const data = await res.json();
    const pages = data?.query?.pages as Record<string, { thumbnail?: { source: string } }>;
    const page = Object.values(pages ?? {})[0];
    if (page?.thumbnail?.source) return page.thumbnail.source;
  } catch { /* try next */ }

  // 2) REST summary API
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { "User-Agent": "UltimatePlayground/1.0 (https://ultimate-playground.com)" } }
    );
    const data = await res.json();
    const url = data?.originalimage?.source ?? data?.thumbnail?.source;
    if (url) return url;
  } catch { /* try next */ }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title     = searchParams.get("title");
  const directUrl = searchParams.get("url");

  let imageUrl: string | null = null;

  if (directUrl) {
    if (!isWikimediaUrl(directUrl)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    imageUrl = directUrl;
  } else if (title) {
    imageUrl = await resolveImageUrl(title);
  }

  if (!imageUrl) {
    return new NextResponse(null, { status: 404 });
  }

  // Proxy the image from Wikimedia — browser never touches Wikimedia directly
  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UltimatePlayground/1.0)",
        "Referer":    "https://en.wikipedia.org/",
        "Accept":     "image/webp,image/jpeg,image/*,*/*;q=0.8",
      },
    });

    if (!imgRes.ok) return new NextResponse(null, { status: 502 });

    const ct = imgRes.headers.get("Content-Type") ?? "";
    if (!ct.startsWith("image/")) return new NextResponse(null, { status: 502 });

    return new NextResponse(imgRes.body, {
      headers: {
        "Content-Type":  ct,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
