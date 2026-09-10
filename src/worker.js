const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const warningIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
const notFoundIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg>';

function statusForCode(code) {
  const status = Number(code);
  if (status < 400 || status > 599) return null;

  if (status === 404) {
    return { code: status, title: 'Page not found', description: 'The page you requested does not exist, or it may have moved somewhere else.', icon: notFoundIcon };
  }
  if (status === 502) {
    return { code: status, title: 'Site temporarily unavailable', description: 'This domain is active, but the site behind it is not responding right now. Please try again shortly.', icon: warningIcon };
  }
  if (status === 503) {
    return { code: status, title: 'Service unavailable', description: 'Return Proxy is online, but this service is temporarily unavailable. Please try again in a few moments.', icon: warningIcon };
  }
  if (status === 504) {
    return { code: status, title: 'Request timed out', description: 'Return Proxy is online, but the upstream service took too long to respond. Please try again in a few moments.', icon: warningIcon };
  }

  return {
    code: status,
    title: `Request returned ${status}`,
    description: status >= 500 ? 'The service is temporarily unavailable. Please try again in a few moments.' : 'The request could not be completed. Please check the request and try again.',
    icon: warningIcon
  };
}

const page = ({ requestId, clientIp, timestamp, status }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#f4f4f5">
  <title>${esc(status.title)} | Return Proxy</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    :root {
      --background: #f4f4f5;
      --foreground: #09090b;
      --card: #ffffff;
      --muted: #71717a;
      --border: #e4e4e7;
      --primary: #18181b;
      --primary-hover: #27272a;
      --radius: 0.875rem;
      --radius-sm: 0.5rem;
      --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --display: "Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, sans-serif;
      --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    html { color-scheme: light; }
    body {
      min-height: 100vh;
      margin: 0;
      padding: clamp(1rem, 4vw, 2rem);
      display: grid;
      place-items: center;
      overflow: hidden;
      color: var(--foreground);
      background-color: var(--background);
      background-image:
        radial-gradient(ellipse 85% 60% at 50% -18%, rgb(255 255 255 / .98), transparent 52%),
        radial-gradient(ellipse 70% 55% at 105% 85%, rgb(228 228 231 / .55), transparent 48%),
        radial-gradient(ellipse 55% 50% at -5% 75%, rgb(250 250 250 / .95), transparent 42%),
        radial-gradient(circle at 1px 1px, #d4d4d8 1px, transparent 0);
      background-size: 100% 100%, 100% 100%, 100% 100%, 22px 22px;
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
    }
    .shell { position: relative; z-index: 1; width: 100%; max-width: 26.5rem; perspective: 900px; animation: shell-in .65s cubic-bezier(.22, 1, .36, 1) both; }
    .card { position: relative; overflow: hidden; background: var(--card); border: 1px solid rgb(228 228 231 / .85); border-radius: var(--radius); box-shadow: 0 4px 6px -1px rgb(0 0 0 / .07), 0 2px 4px -2px rgb(0 0 0 / .05), 0 0 0 1px rgb(0 0 0 / .03); transform: rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)); transition: transform .18s ease, box-shadow .18s ease; animation: card-drop .9s .08s cubic-bezier(.16, 1, .3, 1) both; }
    .card::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(115deg, transparent 25%, rgb(255 255 255 / .7) 47%, transparent 65%); transform: translateX(-120%); animation: sheen 5s 1.1s ease-in-out infinite; }
    .header { padding: 1.35rem 1.5rem 0; }
    .content { padding: .85rem 1.5rem 1.35rem; }
    .footer { margin: 0 1.5rem; padding: .85rem 0 1.15rem; border-top: 1px solid var(--border); color: var(--muted); font: .6875rem/1.5 var(--mono); text-align: center; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; animation: slide-up .5s .86s both; }
    .badge { display: inline-flex; align-items: center; gap: .35rem; margin-bottom: .75rem; padding: .25rem .65rem; border: 1px solid var(--border); border-radius: calc(var(--radius-sm) + 2px); color: var(--muted); background: linear-gradient(180deg, #fafafa, #f4f4f5); box-shadow: 0 1px 0 rgb(255 255 255 / .8) inset; font-size: .6875rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; animation: pop-in .55s .42s both; }
    .badge svg { width: .75rem; height: .75rem; opacity: .88; }
    .badge span { color: #71717a; background: linear-gradient(100deg, #71717a 0%, #71717a 42%, #fafafa 50%, #71717a 58%, #71717a 100%); background-size: 280% 100%; background-position: 140% 0; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: badge-sweep 8s 1s linear infinite; }
    .error-icon { display: grid; place-items: center; width: 3.65rem; height: 3.65rem; margin: .5rem auto .85rem; border: 1px solid rgb(228 228 231 / .95); border-radius: 24%; background: linear-gradient(168deg, #fff, #fafafa 45%, #f4f4f5); box-shadow: 0 1px 0 #fff inset, 0 10px 28px rgb(0 0 0 / .07); animation: pop-in .6s .54s both, float 4s 1.3s ease-in-out infinite; }
    .error-icon svg { width: 1.45rem; height: 1.45rem; color: var(--primary); opacity: .9; animation: pulse 2.8s 1s ease-in-out infinite; }
    h1 { margin: 0; font-family: var(--display); font-size: 1.2rem; font-weight: 700; letter-spacing: -.028em; line-height: 1.22; text-align: center; animation: slide-up .55s .7s both; }
    .desc { margin: .55rem 0 0; color: var(--muted); font-size: .875rem; font-weight: 450; line-height: 1.62; text-align: center; animation: slide-up .55s .78s both; }
    .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 2.5rem; margin-top: 1rem; border: 0; border-radius: var(--radius-sm); color: #fafafa; background: var(--primary); box-shadow: 0 1px 2px rgb(0 0 0 / .08); cursor: pointer; font: 500 .875rem var(--font); transition: background .15s ease, transform .12s ease, box-shadow .15s ease; animation: slide-up .55s .94s both; }
    .btn:hover { background: var(--primary-hover); box-shadow: 0 8px 18px rgb(0 0 0 / .15); }
    .btn:active { transform: scale(.98); }
    .btn:focus-visible { outline: 0; box-shadow: 0 0 0 2px var(--card), 0 0 0 4px rgb(24 24 27 / .35); }
    @keyframes shell-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes card-drop { 0% { opacity: 0; transform: translateY(-90px) rotateX(9deg) scale(.92); } 65% { opacity: 1; transform: translateY(12px) rotateX(-1deg) scale(1.01); } 100% { opacity: 1; transform: rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)); } }
    @keyframes slide-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pop-in { 0% { opacity: 0; transform: scale(.55) translateY(-10px); } 70% { transform: scale(1.08) translateY(0); } 100% { opacity: 1; transform: scale(1); } }
    @keyframes float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -4px; } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    @keyframes badge-sweep { 0%, 20% { background-position: 140% 0; } 68% { background-position: -40% 0; } 100% { background-position: -40% 0; } }
    @keyframes sheen { 0%, 70%, 100% { transform: translateX(-120%); } 84% { transform: translateX(120%); } }
    @media (max-width: 360px) { .header, .content { padding-left: 1.1rem; padding-right: 1.1rem; } .footer { margin-left: 1.1rem; margin-right: 1.1rem; } }
  </style>
</head>
<body>
  <main class="shell">
    <section class="card" aria-labelledby="title">
      <div class="header">
        <div class="badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Return Proxy</span></div>
        <div class="error-icon" aria-hidden="true">${status.icon}</div>
        <h1 id="title">${esc(status.title)}</h1>
        <p class="desc">${esc(status.description)}</p>
      </div>
      <div class="content"><button class="btn" type="button" onclick="location.reload()">Try again</button></div>
      <footer class="footer">Request ${esc(requestId)} · ${esc(clientIp)} · ${esc(timestamp)} UTC</footer>
    </section>
  </main>
  <script>
    (() => {
      const shell = document.querySelector('.shell');
      const card = document.querySelector('.card');
      if (shell && card) {
        shell.addEventListener('pointermove', (event) => {
          const bounds = shell.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - .5;
          const y = (event.clientY - bounds.top) / bounds.height - .5;
          card.style.setProperty('--tilt-x', (y * -4).toFixed(2) + 'deg');
          card.style.setProperty('--tilt-y', (x * 5).toFixed(2) + 'deg');
        });
        shell.addEventListener('pointerleave', () => {
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
        });
      }
    })();
  </script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let requestedCode = null;

    if (requestedCode === null && url.searchParams.has('code')) {
      const value = Number(url.searchParams.get('code'));
      requestedCode = Number.isInteger(value) && value >= 400 && value <= 599 ? value : null;
    }

    if (requestedCode === null) {
      try {
        const headers = new Headers(request.headers);
        const isWorkerHop = request.headers.get('x-return-proxy-hop') === '1';
        if (isWorkerHop) {
          requestedCode = 502;
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

          requestedCode = upstream.status;
        }
      } catch (error) {
        requestedCode = error?.name === 'AbortError' ? 504 : 502;
      }
    }

    const status = statusForCode(requestedCode) || statusForCode(504);
    const requestId = request.headers.get('cf-ray') || crypto.randomUUID().slice(0, 18);
    const clientIp = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-real-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'edge';
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    const proxyTag = {
      404: 'not-found',
      502: 'origin-down',
      503: 'service-unavailable',
      504: 'timeout'
    };

    return new Response(page({ requestId, clientIp, timestamp, status }), {
      status: status.code,
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'no-store, max-age=0',
        'x-return-proxy': proxyTag[requestedCode] || 'error',
        'x-request-path': url.pathname
      }
    });
  }
};
