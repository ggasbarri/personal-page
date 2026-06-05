# Deployment

This site is published with **Cloudflare Pages** using the **Git integration** —
Cloudflare builds and deploys on every push; there is no GitHub Actions workflow and no
API token to manage.

## How it deploys

- Push to `main` → Cloudflare Pages auto-deploys to production.
- Open a PR → Pages publishes a **preview deployment** at a unique URL.

## Pages project settings

Set in the Cloudflare dashboard (Workers & Pages → the `personal-page` project). It is a
hand-authored static site with **no build step**:

| Setting                  | Value     |
| ------------------------ | --------- |
| Framework preset         | None      |
| Build command            | *(empty)* |
| Build output directory   | `/`       |
| Production branch        | `main`    |

Production URL: https://ggasbarri.com (apex custom domain).
Pages subdomain: `personal-page-3j7.pages.dev`.

## Custom domain

`ggasbarri.com` is attached as a Pages **custom domain**. Because the DNS zone is in the
same Cloudflare account, Pages auto-created the proxied DNS record and provisioned TLS.

## Static config files

- `_headers` — security headers for all routes plus a long immutable cache for `/assets/*`.
  Cloudflare Pages applies these automatically from the output root.

## Verify a deploy

```bash
curl -sSI https://ggasbarri.com | head -n1          # HTTP/2 200
curl -sS  https://ggasbarri.com | grep -i '<title'  # confirms index.html is served
```
