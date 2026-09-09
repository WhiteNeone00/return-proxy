# Return Proxy

Custom Cloudflare Worker error pages and an optional generic origin proxy.

Return Proxy can sit in front of an origin, tunnel, static site, or API and handle upstream failures with a branded animated error page.

## What It Does

When an origin is configured, requests follow this flow:

```text
Request
  -> Return Proxy
  -> origin or tunnel
  -> 200-399: pass the response through unchanged
  -> 400-599: render the matching Return Proxy error page
  -> connection failure: render the 502 origin-down page
  -> timeout: render the 504 timeout page
```

Successful HTML, JSON, headers, redirects, and other upstream response data are preserved. Error pages keep the upstream status code.

The page includes:

- Responsive Return Proxy design
- Animated card entrance and tilt interaction
- Slow left-to-right badge sweep
- Status-specific titles and descriptions
- Request ID, client address, and UTC timestamp
- No external frontend assets

## Project Structure

```text
return-proxy/
├── src/
│   └── worker.js       # Worker and inline error-page renderer
├── package.json
├── package-lock.json
├── wrangler.toml       # Cloudflare Worker configuration
└── README.md
```

## Requirements

- Node.js 18 or newer
- A Cloudflare account
- A domain managed by Cloudflare for custom routes
- Wrangler authentication

## Install

```sh
npm install
npx wrangler login
```

## Local Development

```sh
npm run dev
```

Useful preview routes:

```text
/404
/502
/503
/504
```

Generic status rendering is also available:

```text
/?code=404
/?code=403
/?code=500
/?code=503
```

## Deploy

Deploy from this directory:

```sh
npm run deploy
```

Or run Wrangler directly:

```sh
npx wrangler deploy
```

The Worker name is configured as `return-proxy` in `wrangler.toml`.

## Wildcard DNS Setup

To show Return Proxy for unknown subdomains, create a proxied wildcard DNS record in Cloudflare:

```text
Type: A
Name: *
IPv4 address: 192.0.2.1
Proxy status: Proxied
```

The placeholder address only makes DNS resolve. The orange Cloudflare proxy must be enabled so requests reach the Worker.

Verify DNS before testing:

```sh
dig +short random-subdomain.example.com
```

The result should be a Cloudflare edge address, not the direct origin IP. If the hostname resolves directly to an origin IP, the request bypasses the Worker.

## Origin Proxy Mode

Set `ORIGIN_URL` when Return Proxy should fetch a real origin:

```toml
[vars]
ORIGIN_URL = "https://your-origin.example"
```

The origin can be a separate tunnel hostname, static origin, API origin, or another public service. Do not set it to the Return Proxy Worker URL, because that creates a recursive request loop.

With `ORIGIN_URL` configured:

- `200-399` responses pass through unchanged.
- `400-599` responses render the corresponding Return Proxy page.
- Connection failures render `502 Site temporarily unavailable`.
- A 10-second upstream timeout renders `504 Request timed out`.

Without `ORIGIN_URL`, the Worker attempts the original request once and uses a hop guard to prevent recursion.

## Routing Notes

Cloudflare routing happens before Worker code runs. A wildcard Worker cannot automatically discover another Worker or tunnel behind the same hostname.

For an existing site or tunnel:

```text
specific site route or tunnel hostname -> real service
wildcard route                     -> Return Proxy fallback
```

Specific Cloudflare routes and custom domains must take precedence over the wildcard route for existing services. Otherwise the wildcard Worker owns the request and has no separate origin to inspect.

If an existing service owns the request first, its own Worker or origin must render Return Proxy for upstream errors. A separate fallback Worker cannot rewrite a response it never receives.

## Error Routes

| Route | Status | Page |
| --- | ---: | --- |
| `/404`, `/not-found`, `/missing` | 404 | Page not found |
| `/502`, `/bad-gateway`, `/site-down`, `/origin-down` | 502 | Site temporarily unavailable |
| `/503`, `/unavailable`, `/service-unavailable`, `/maintenance` | 503 | Service unavailable |
| `/`, `/504`, `/timeout`, `/request-timeout` | 504 | Request timed out |

Any status from `400` through `599` can be rendered with `?code=<status>`.

## Configuration

The main configuration is in [wrangler.toml](wrangler.toml):

```toml
name = "return-proxy"
main = "src/worker.js"
compatibility_date = "2025-01-01"
workers_dev = true
```

Keep API tokens and other secrets out of source control. Use Wrangler secrets when a private value is required:

```sh
npx wrangler secret put SECRET_NAME
```

## Testing

Validate syntax:

```sh
node --check src/worker.js
```

Build without publishing:

```sh
npx wrangler deploy --dry-run
```

Test a deployed status page:

```sh
curl -i "https://return-proxy.<your-subdomain>.workers.dev/?code=404"
```

Expected response properties include:

```text
HTTP/2 404
content-type: text/html; charset=UTF-8
x-return-proxy: not-found
```

## License

No license is specified for this project.
