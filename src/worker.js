const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function statusForCode(code) {
  const status = Number(code);
  if (status < 400 || status > 599) return null;

  if (status === 404) {
    return { code: status, title: 'Page not found', description: 'The page you requested does not exist, or it may have moved somewhere else.' };
  }
  if (status === 502) {
    return { code: status, title: 'Site temporarily unavailable', description: 'This domain is active, but the site behind it is not responding right now. Please try again shortly.' };
  }
  if (status === 503) {
    return { code: status, title: 'Service unavailable', description: 'Return Proxy is online, but this service is temporarily unavailable. Please try again in a few moments.' };
  }
  if (status === 504) {
    return { code: status, title: 'Request timed out', description: 'Return Proxy is online, but the upstream service took too long to respond. Please try again in a few moments.' };
  }

  return {
    code: status,
    title: `Request returned ${status}`,
    description: status >= 500 ? 'The service is temporarily unavailable. Please try again in a few moments.' : 'The request could not be completed. Please check the request and try again.'
  };
}

const page = ({ requestId, clientIp, timestamp, status }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(status.title)} | Return Proxy</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f4f4f5;
      color: #111827;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 24px;
    }
    .card {
      width: min(100%, 520px);
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
      padding: 28px 24px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b7280;
      border: 1px solid #e5e7eb;
      border-radius: 999px;
      padding: 6px 10px;
      margin-bottom: 18px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(1.5rem, 2vw, 2rem);
      line-height: 1.2;
    }
    p {
      margin: 0;
      color: #4b5563;
      line-height: 1.6;
    }
    .meta {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
      word-break: break-word;
    }
    button {
      margin-top: 20px;
      background: #111827;
      color: #fff;
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      font: inherit;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <main class="card" aria-live="polite">
    <div class="badge">Return Proxy</div>
    <h1>${esc(status.title)}</h1>
    <p>${esc(status.description)}</p>
    <button type="button" onclick="location.reload()">Try again</button>
    <div class="meta">Request ${esc(requestId)} · ${esc(clientIp)} · ${esc(timestamp)} UTC</div>
  </main>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = url.pathname.replace(/\/$/, '');
    let upstreamFailureCode = null;
    if (!url.searchParams.has('code')) {
      try {
        const headers = new Headers(request.headers);
        const isWorkerHop = request.headers.get('x-return-proxy-hop') === '1';
        if (isWorkerHop) {
          upstreamFailureCode = 502;
        } else {
          headers.set('x-return-proxy-hop', '1');
          const upstreamRequest = new Request(request, { headers });

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          let upstream;
          try {
            upstream = await fetch(upstreamRequest, { signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
          if (upstream.status < 400) {
            const responseHeaders = new Headers(upstream.headers);
            responseHeaders.set('x-return-proxy-upstream-status', String(upstream.status));
            return new Response(upstream.body, {
              status: upstream.status,
              statusText: upstream.statusText,
              headers: responseHeaders
            });
          }
          upstreamFailureCode = upstream.status;
        }
      } catch (error) {
        upstreamFailureCode = error?.name === 'AbortError' ? 504 : 502;
      }
    }

    const notFound = ['/404', '/not-found', '/missing'].includes(route);
    const originDown = ['/502', '/bad-gateway', '/site-down', '/origin-down'].includes(route);
    const serviceUnavailable = ['/503', '/unavailable', '/service-unavailable', '/maintenance'].includes(route);
    const timeout = ['/', '/504', '/timeout', '/request-timeout'].includes(route);
    const requestedCode = upstreamFailureCode || Number(url.searchParams.get('code'));
    const status = statusForCode(requestedCode)
      || (notFound ? statusForCode(404)
        : originDown ? statusForCode(502)
          : serviceUnavailable ? statusForCode(503)
            : statusForCode(504));
    const requestId = request.headers.get('cf-ray') || crypto.randomUUID().slice(0, 18);
    const clientIp = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-real-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'edge';
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');

    return new Response(page({ requestId, clientIp, timestamp, status }), {
      status: status.code,
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'no-store, max-age=0',
        'x-return-proxy': requestedCode === 404 ? 'not-found' : requestedCode === 502 ? 'origin-down' : requestedCode === 504 ? 'timeout' : notFound ? 'not-found' : originDown ? 'origin-down' : serviceUnavailable ? 'service-unavailable' : timeout ? 'timeout' : 'error',
        'x-request-path': url.pathname
      }
    });
  }
};
