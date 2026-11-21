// Cloudflare Pages Function — proxies Unsplash API requests
// The UNSPLASH_KEY is set as an environment secret in the Pages dashboard.

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const key = context.env.UNSPLASH_KEY;

  if (!key) {
    return new Response(JSON.stringify({ error: 'UNSPLASH_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Search photos
  if (action === 'search') {
    const query = url.searchParams.get('query');
    const page = url.searchParams.get('page') || '1';
    const perPage = url.searchParams.get('per_page') || '20';
    const orientation = url.searchParams.get('orientation') || 'squarish';

    const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=${orientation}`;
    const resp = await fetch(apiUrl, {
      headers: { 'Authorization': `Client-ID ${key}` }
    });
    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Track download (required by Unsplash API guidelines)
  // The client passes photo.links.download_location, which already carries a query string
  // (?ixid=...) that Unsplash wants kept intact, so the key goes in the Authorization header.
  // Only Unsplash's own download endpoint is accepted, so the key is never sent anywhere else.
  if (action === 'track-download') {
    let target;
    try {
      target = new URL(url.searchParams.get('url') || '');
    } catch {
      target = null;
    }
    if (!target || target.protocol !== 'https:' || target.hostname !== 'api.unsplash.com' ||
        !/^\/photos\/[A-Za-z0-9_-]+\/download\/?$/.test(target.pathname)) {
      return new Response(JSON.stringify({ error: 'url must be an Unsplash download_location' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    try {
      const resp = await fetch(target.toString(), {
        headers: { 'Authorization': `Client-ID ${key}` }
      });
      return new Response(JSON.stringify({ tracked: resp.ok, status: resp.status }), {
        status: resp.ok ? 200 : 502,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ tracked: false, error: e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}
