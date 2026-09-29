# docs/

This is a static mirror of the **Training Control Center** dashboard, served via GitHub Pages.

**Custom domain status:** deferred. `techtheworld.win` expired and the old Cloudflare account access is gone — a new domain (or renewal) gets bought Wednesday afternoon through a new Cloudflare account. Until then, this serves from GitHub's default domain: `https://quanwatson.github.io/techtheworld-homelab/`. Once the domain's live, add a `CNAME` file back here with the chosen subdomain and follow the DNS steps below.

The dashboard's source of truth is the published Claude Artifact — this folder is a snapshot, not the live copy. When the artifact gets updated (new hours logged, cert progress, skill scores, etc.), `index.html` here needs to be re-exported and re-pushed to match; it does not update automatically.

- `index.html` — the dashboard page (self-contained, no build step)
- `bg-room.jpg` — background texture the page references

## One-time setup (do once)

1. **Enable Pages:** repo Settings → Pages → Source: "Deploy from a branch" → Branch: `main`, folder: `/docs`. This alone makes the dashboard live at `quanwatson.github.io/techtheworld-homelab`, no domain required.
2. **Once the domain is bought (after Wednesday):** add a `CNAME` file to this folder containing the chosen subdomain, then in Cloudflare add a `CNAME` DNS record — name matching the subdomain, target `quanwatson.github.io`. Use "DNS only" (grey cloud) rather than proxied while GitHub issues the TLS certificate; switch back to proxied afterward if you want.
3. Back in repo Settings → Pages, confirm the custom domain shows as verified and enable "Enforce HTTPS" once it's available.
