# Runbook: KVM 8 Rig (techtheworld.win production host)

**Platform:** Hostinger KVM 8 VPS (8 vCPU, 32 GB RAM, 400 GB NVMe), Ubuntu 24.04 LTS, Docker Compose
**Scope:** The whole host: base OS, edge, data layer, management zone, deploy pipeline, Odoo, n8n, and the sites that the four area repositories put on it
**Phase:** Rig phases 0–16 (below). Start at Phase 0.
**Change Type:** Planned / Non-disruptive (new host; nothing in production yet)
**Applies To:** `ttw-core` (the KVM 8), the `techtheworld.win` Cloudflare zone, the four area repos: `techdojo-ots`, `efv-kb`, `aLaMode-kb`, `the-ap-project`

This is the recipe for building the host, one phase at a time. Each phase follows this repo's runbook format: preconditions, procedure, validation, rollback. Don't start a phase until the previous phase's validation passes. Log every phase in `01-logs/change-control.md` before you start it and in `01-logs/build-journal.md` when it's done. Record each significant decision as an ADR in `18-solutions-architecture-adrs/`.

Companion files in this folder:

| File | What it is |
|---|---|
| [`NETWORK-PLAN.md`](NETWORK-PLAN.md) | The design: every service, the four zones, sign-in, payments, Odoo, sizing, costs, decisions |
| [`VENTURES-PLAN.md`](VENTURES-PLAN.md) | The business side: what each of the four areas sells, and in what order |
| [`base-server/setup.sh`](base-server/setup.sh) | The Phase 2 script: hardening, Docker, Tailscale, lockdown, tunnel |
| [`base-server/README.md`](base-server/README.md) | The hPanel and Phase 2 walkthrough |
| `infra/` | Created in Phase 3 onwards: one Compose file per zone, the Caddyfile, scripts. Everything that runs on the host lives here as files. |

---

## Purpose

Stand up one private, production-grade host that runs every public site, members area, team intranet and admin tool on `techtheworld.win`, for four businesses, with:

- **no open inbound ports:** everything public arrives through Cloudflare Tunnel; admin access is through Tailscale only;
- **four zones** (Public, Members, Team, Management), each on its own Docker network;
- **one data layer** (Postgres with PostGIS, MariaDB) shared with a separate database and user per app;
- **everything as files** in this repo, so the host can be rebuilt from scratch with this runbook and a backup;
- **nightly encrypted backups** to Cloudflare R2, with a monthly restore test.

The host is also portfolio proof for Ogun Tech Solutions: it's run the same documentation-first, phase-gated way as the homelab.

## Scope

**In scope:**

- the KVM 8 itself and its OS;
- Cloudflare DNS, Tunnel, Access, WAF for `techtheworld.win`;
- Tailscale for admin access;
- the shared services (Caddy, Postgres/PostGIS, MariaDB, Odoo Community, n8n, WordPress, monitoring, backups);
- the deploy pipeline that pulls each area repo and publishes its build;
- the hosting side of every site in the service map below.

**Out of scope:**

- **the content of each site:** each area repo owns its own (see *Who owns what*);
- **client systems for the MSP business:** they never run on this host; each client gets its own server (`VENTURES-PLAN.md`, rule under 3.6);
- **the homelab** (Proxmox, pfSense, VLANs, the internal `corp.techtheworld.win` namespace): it stays separate and reaches this host only over Tailscale;
- **video hosting:** trailers and course videos go to a video host, not this disk;
- **the GPU:** ComfyUI jobs run on RunPod, queued by n8n.

## Preconditions

Before Phase 0:

- [ ] The KVM 8 is bought in hPanel (or a KVM 4 that will be upgraded in place before the shops open).
- [ ] `techtheworld.win` is active on Cloudflare (nameservers pointed at Cloudflare).
- [ ] You can open hPanel, the Cloudflare dashboard and GitHub (with 2FA on your account).
- [ ] A password manager is ready for every secret this runbook creates.
- [ ] Open change-control entry CC-KVM8-000 *Adopt the KVM 8 rig plan* in `01-logs/change-control.md`.

---

## The rig at a glance

| Item | Value |
|---|---|
| Hostname | `ttw-core` (Tailscale name too) |
| OS | Ubuntu 24.04 LTS, plain OS (no control panel) |
| Admin user | `quan` (set with `ADMIN_USER`), SSH key only, over Tailscale only |
| Inbound | None. UFW and the Hostinger firewall deny all inbound except UDP 41641 (Tailscale). |
| Outbound edge | `cloudflared` (systemd service) → Caddy on `127.0.0.1:8080` → containers by host name |
| Container runtime | Docker Engine + Compose plugin; daemon publishes ports to `127.0.0.1` by default |
| Layout on disk | `/srv/infra` (this repo's `infra/`), `/srv/repos` (area repo clones), `/srv/sites` (built static sites), `/srv/data` (volumes), `/etc/ttw` (secrets, mode 600) |
| Backups | restic → Cloudflare R2 bucket `ttw-backups`, nightly 03:15 UTC; Hostinger weekly snapshots; monthly restore test |
| Time | UTC on the host; Odoo and n8n display in America/Chicago |

### Service map

The **owner repo** decides the content; this repo decides how the service runs. *Zone* is the Docker network and the Cloudflare Access posture.

| # | Address | Service | Zone | Owner repo | Runs as | Memory cap | Data |
|---|---|---|---|---|---|---|---|
| 1 | `techtheworld.win`, `www.` | Landing page (3D universe) | Public | efv-kb | Static, Caddy | (Caddy) | none |
| 2 | `sound.`, `games.`, `film.` | EFV realms | Public | efv-kb | Static, Caddy; Sound audio from R2 | (Caddy) | R2 |
| 3 | `kb.` | EFV Library, full edition | Team | efv-kb | Static + Library API | 512 MB | Postgres `library` |
| 4 | `tools.` | EFV Library, public edition | Members | efv-kb | Static + Library API | (shared) | Postgres `library` |
| 4a | `kb.` and `tools.` at `/media-api/` | EFV Media Server: Transcriber and Media Grabber engine (yt-dlp, ffmpeg, optional Whisper); one container per edition | Team; Members after E4 | efv-kb (`deploy/media-server/`) | Docker, `edge` network, no published port | 4 GB each, 3 CPUs | volumes (files deleted after 24 h team / 4 h members) |
| 5 | `efv.` | EFV website | Public | efv-kb | WordPress + MariaDB | 1 GB | MariaDB `efv_wp` |
| 6 | `erp.` | Odoo back office | Team | techdojo-ots | Odoo Community | 6 GB | Postgres `odoo` |
| 7 | `shop.` | Ogun Tech Solutions store + EFV merch | Public | techdojo-ots | Odoo website | (Odoo) | Postgres `odoo` |
| 8 | `finds.` | Consignment marketplace | Public | techdojo-ots | Odoo website | (Odoo) | Postgres `odoo` |
| 9 | `live.` | Live and hybrid shops | Public | techdojo-ots | Odoo website + POS | (Odoo) | Postgres `odoo` |
| 10 | `wear.` | Clothing shop (**on hold**: see `NETWORK-PLAN.md`) | Public | to decide | Odoo website | (Odoo) | Postgres `odoo` |
| 10a | `alamode.` | A La Mode showcase (collections, mock boutique, atelier customiser; nothing for sale) | Public | aLaMode-kb | Static, Caddy | (Caddy) | none |
| 11 | `learn.` | Archive and courses (all four areas) | Public | shared; each area supplies its courses | Odoo eLearning + video host | (Odoo) | Postgres `odoo` |
| 12 | `maps.` | AP public data dashboard | Public | the-ap-project | Static MapLibre + Martin tiles | 512 MB | Postgres `apgis` (public schema only) |
| 13 | `gis.` | AP team map (private layers) | Team | the-ap-project | Static MapLibre + Martin tiles | (shared) | Postgres `apgis` |
| 14 | `n8n.` | Automation (editor Team; `/webhook/*` Public) | Team / Public | techdojo-ots | n8n | 2 GB | Postgres `n8n` |
| 15 | `dash.` | IT pro dev dashboard (guests read-only) | Team + guests | techdojo-ots | Static + n8n feed | 512 MB | Postgres `dash` |
| 16 | `status.` | Uptime status page | Team | techdojo-ots | Uptime Kuma | 256 MB | volume |
| 17 | (none) | code-server, Dockge, Adminer, Netdata | Management | techdojo-ots | Bound to the Tailscale IP | 2 GB total | volumes |
| 18 | (none) | Discord role bot | Public egress only | techdojo-ots | n8n workflow or small container | 256 MB | Postgres `n8n` |
| — | (none) | Postgres 16 + PostGIS | Data | techdojo-ots | `postgis/postgis` | 4 GB | volume |
| — | (none) | MariaDB | Data | techdojo-ots | `mariadb` LTS | 1 GB | volume |

The memory caps add up to about 18–19 GB, leaving room for the OS, Docker, page cache and a staging copy of a service.

---

## Who owns what

The rule: **the area repos own content and builds; this repo owns the host and how things run on it.** One chat per repo, each working from its own runbook:

| Repo | Its runbook | It ships to the rig | It asks the rig for |
|---|---|---|---|
| `techdojo-ots` (this) | this file | the host, `infra/`, Odoo (all companies), n8n, monitoring, backups, `dash.`, `status.`, Ogun Tech's shop content | — |
| `efv-kb` | `deploy/KVM8-RUNBOOK.md` | static builds for `kb.`, `tools.`, the landing page and realms; the Library API; WordPress theme and content for `efv.`; EFV's Odoo data (merch, Sound physical, courses) | hosts, Access apps, a `library` database, R2 buckets for Sound audio and Games downloads, the deploy hook |
| `aLaMode-kb` | `stack/kvm8/RUNBOOK.md` | a static lookbook build for `alamode.` | the `alamode.` host, a read-only deploy key, Git LFS in the deploy step, an n8n post when a collection goes live |
| `the-ap-project` | `operations/kvm8/RUNBOOK.md` | the PostGIS schema and loader, public-layer exports, the `maps.` and `gis.` web maps, AP Odoo data (services, courses) | an `apgis` database with PostGIS, Martin, two hosts (one public, one team), QGIS access over Tailscale, the deploy hook |

### The deploy contract

Every area repo that ships to the rig adds one file at its root, `kvm8.json`, so the rig can build it without knowing its insides:

```json
{
  "repo": "efv-kb",
  "branch": "main",
  "builds": [
    { "name": "kb",    "run": "python3 tools/efv.py export", "output": "site", "host": "kb.techtheworld.win" },
    { "name": "www",   "run": "", "output": "deploy/landing", "host": "techtheworld.win" }
  ],
  "healthcheck": [ "https://kb.techtheworld.win/version.txt" ]
}
```

- `run` executes inside a throwaway build container (`python:3.12-slim` plus `git`, or `node:22-slim` if the repo asks for it), never as root on the host.
- `output` is copied atomically to `/srv/sites/<name>/` (build to a temp folder, then rename), so a failed build never leaves a half-published site.
- Each repo's chat writes and maintains its own `kvm8.json`; this repo's chat owns the script that reads it (`infra/scripts/ttw-deploy`).
- Private repos (`the-ap-project`, and any others) are cloned with a **read-only deploy key** per repo. The key lives in `/etc/ttw/keys/`.

---

## Phase 0: Prep (no server changes)

**Preconditions:** none.

**Procedure:**

1. **GitHub organisation:** create `efv-team` (free). Settings ▸ Authentication security ▸ *Require two-factor authentication*. Invite yourself. This is the team's identity source for Cloudflare Access.
2. **Cloudflare Zero Trust:** open Zero Trust, pick a team name (for example `techtheworld`), choose the Free plan.
3. **Login method:** Zero Trust ▸ Settings ▸ Authentication ▸ add **GitHub** (create the OAuth app in GitHub as Cloudflare instructs). Add **One-time PIN** too; it's only for read-only guests on `dash.`.
4. **Access groups:**
   - `team`: GitHub organisation `efv-team`;
   - `admins`: your GitHub username;
   - `dash-guests`: emails, maintained by hand, each with an expiry date.
5. **R2:**
   - create the buckets `ttw-backups`, `efv-sound-media`, `efv-games-downloads`;
   - create an API token scoped to those buckets (Object Read & Write);
   - store the access key, secret and S3 endpoint in the password manager.
6. **Transactional email:** pick a sending provider for Odoo, n8n and sign-in links, for example Brevo, Postmark, Resend or Amazon SES. Hostinger VPSs commonly restrict outbound port 25, so send on 587. Then:
   - add the provider's SPF, DKIM and DMARC records in Cloudflare DNS;
   - use Cloudflare Email Routing to *receive* mail at `@techtheworld.win`.
7. **Tailscale:** create the tailnet (sign in with GitHub) and install Tailscale on your computer and phone.
8. **SSH key:** `ssh-keygen -t ed25519 -C "ttw-core"` on your computer, if you don't have one.
9. **Decisions to record as ADRs before Phase 3:**
   - ADR-01: Docker Compose on one host (not k3s or Proxmox on the VPS);
   - ADR-02: Cloudflare Tunnel plus Tailscale and no inbound ports;
   - ADR-03: shared Postgres with a database per app;
   - ADR-04: GitHub plus Access for the team, authentik deferred;
   - ADR-05: Odoo Community multi-company for all four areas.

**Validation:**

- You can sign in to a test Access application with GitHub.
- A non-member GitHub account is refused.
- The R2 token can list the buckets: `aws s3 ls --endpoint-url <r2-endpoint>`, or `rclone lsd`.
- A test email from the provider reaches an outside inbox, with SPF and DKIM passing.

**Rollback:** nothing to undo. Accounts can be deleted.

---

## Phase 1: Provision the KVM 8 in hPanel

**Preconditions:** Phase 0 done. You have the SSH public key.

**Procedure:** follow [`base-server/README.md`](base-server/README.md) section 1:

1. Install a plain OS: **Ubuntu 24.04 LTS**.
2. Choose the data centre closest to most visitors.
3. Set a long root password and keep it for the hPanel browser terminal only.
4. Add your SSH key.
5. Wait for **Running**, then note the public IPv4 (and IPv6, if one is given).

Also:

6. Take a Hostinger **snapshot** named `00-fresh-install`.
7. Fill in `06-compute/hosts/kvm8-rig/host.md` (create it from the host template): plan, data centre, IP, purchase date, renewal date. Keep the IP out of public docs if the repo is public. This repo is a public portfolio, so record the IP in the password manager, not here.

**Validation:** `ssh root@<ip>` works with the key, and `lsb_release -a` shows 24.04.

**Rollback:** reinstall the OS from hPanel.

---

## Phase 2: Base hardening

**Preconditions:**

- Phase 1 done.
- Tailscale is installed on your computer.
- The root window stays open throughout.

**Procedure:** follow [`base-server/README.md`](base-server/README.md) sections 3–5:

1. On the host:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/quanwatson/techdojo-ots/main/06-compute/hosts/kvm8-rig/base-server/setup.sh -o setup.sh
   bash setup.sh base
   ```
   If the repo is private, paste the script in with `nano setup.sh`. Set `SWAP_GB=8` for the KVM 8: `SWAP_GB=8 bash setup.sh base`.
2. Open the Tailscale sign-in link it prints. In the Tailscale admin console:
   - name the machine `ttw-core`;
   - **disable key expiry** for it;
   - tag it `tag:server`.
3. From your computer: `ssh quan@ttw-core`.
4. Back in the root window: `bash setup.sh lockdown`.
5. hPanel ▸ VPS ▸ Security ▸ **Firewall**: create a rule set that allows inbound UDP 41641 only (drop everything else), and attach it.
6. Tailscale ACL: allow only `autogroup:admin` (you) to reach `tag:server`, on ports 22, 8443 (code-server), 5001 (Dockge), 19999 (Netdata), 8081 (Adminer) and 5432 (Postgres, for QGIS).
7. Snapshot `02-hardened`.

**Validation:**

- [ ] `ssh quan@ttw-core` works over Tailscale.
- [ ] `ssh root@<public-ip>` times out.
- [ ] An outside port check of 22, 80 and 443 on the public IP shows all closed.
- [ ] `sudo ufw status verbose` shows deny incoming, with only 41641/udp allowed.
- [ ] `docker run --rm hello-world` works as `quan`.
- [ ] `swapon --show` shows 8 GB.
- [ ] `systemctl status unattended-upgrades fail2ban` both show active.

**Rollback:**

- **Locked out:** use the hPanel browser terminal as root, then `ufw allow 22/tcp` and restore `/etc/ssh/sshd_config.d/`.
- **Worst case:** restore the `00-fresh-install` snapshot.

---

## Phase 3: Edge (Cloudflare Tunnel and Caddy)

**Preconditions:**

- Phase 2 validated.
- The `infra/` folder exists in this repo with the files below.

**Procedure:**

1. **Lay out the host:**
   ```bash
   sudo mkdir -p /srv/{infra,repos,sites,data,backups} /etc/ttw/keys
   sudo chown -R quan:quan /srv
   sudo chmod 700 /etc/ttw
   git clone https://github.com/quanwatson/techdojo-ots.git /srv/repos/techdojo-ots
   ln -s /srv/repos/techdojo-ots/06-compute/hosts/kvm8-rig/infra /srv/infra/current
   ```
2. **Docker networks**, one per zone, plus the data network. Create them once:
   ```bash
   for n in edge public members team mgmt data; do docker network create "ttw_$n"; done
   ```
   Caddy joins `edge` and every zone network. Apps join their zone, plus `data` if they use a database. The databases join `data` only.
3. **Caddy** (`infra/edge/compose.yml`):
   ```yaml
   services:
     caddy:
       image: caddy:2
       restart: unless-stopped
       ports: ["127.0.0.1:8080:8080"]
       volumes:
         - ./Caddyfile:/etc/caddy/Caddyfile:ro
         - /srv/sites:/srv/sites:ro
         - caddy_data:/data
       networks: [ttw_edge, ttw_public, ttw_members, ttw_team]
       mem_limit: 256m
   volumes: { caddy_data: {} }
   networks:
     ttw_edge: { external: true }
     ttw_public: { external: true }
     ttw_members: { external: true }
     ttw_team: { external: true }
   ```
   `infra/edge/Caddyfile` (TLS ends at Cloudflare; Caddy only sees plain HTTP from the tunnel on the loopback):
   ```caddyfile
   {
     auto_https off
     admin off
     servers { trusted_proxies static 127.0.0.1/32 ::1 }
   }
   (headers) {
     header {
       Strict-Transport-Security "max-age=31536000; includeSubDomains"
       X-Content-Type-Options nosniff
       Referrer-Policy strict-origin-when-cross-origin
       -Server
     }
   }
   (static) {
     import headers
     encode zstd gzip
     file_server
   }
   http://techtheworld.win:8080, http://www.techtheworld.win:8080 {
     root * /srv/sites/www
     import static
   }
   http://maintenance.techtheworld.win:8080 {
     respond "techtheworld.win is being built." 200
   }
   http://:8080 {
     respond "Not found" 404
   }
   ```
   Each later phase adds its own site block.
4. **Tunnel:** in Zero Trust ▸ Networks ▸ Tunnels, create the `ttw-core` tunnel and copy its token. Then on the host:
   ```bash
   sudo bash setup.sh tunnel <TOKEN>
   ```
5. **Public hostnames** in the tunnel config, all pointing at the service `http://localhost:8080`: `techtheworld.win` and `www.techtheworld.win` for now. Add each later host in its own phase, and only after its Access application exists (see Notes).
6. **Cloudflare zone settings:**
   - SSL/TLS **Full**; Always Use HTTPS on; minimum TLS 1.2;
   - HSTS on, once everything is stable;
   - WAF managed rules on; Bot Fight Mode on;
   - a rate-limit rule on `/web/login`, `/wp-login.php` and the sign-in paths.
7. **Placeholder landing:** `mkdir -p /srv/sites/www`, then copy in a one-line `index.html`. It's replaced in Phase 8.
8. Start Caddy: `docker compose -f /srv/infra/current/edge/compose.yml up -d`.

**Validation:**

- [ ] `https://techtheworld.win` serves the placeholder with a valid Cloudflare certificate.
- [ ] `curl -sI http://<public-ip>` from outside fails (nothing listens publicly).
- [ ] `https://random.techtheworld.win` doesn't resolve, because no wildcard record exists.
- [ ] The tunnel shows **Healthy**.

**Rollback:**

- Remove the public hostnames from the tunnel and run `docker compose down`.
- DNS records the tunnel created are removed with the hostname.

---

## Phase 4: Data layer and backups

**Preconditions:** Phase 3 validated; the R2 token and buckets from Phase 0 exist.

**Procedure:**

1. **Secrets:** create `/etc/ttw/data.env` (mode 600, owner root) holding `POSTGRES_PASSWORD`, `MARIADB_ROOT_PASSWORD`, and one password per app database. Generate each with `openssl rand -base64 32`. Store them all in the password manager too.
2. **Postgres + PostGIS** (`infra/data/compose.yml`):
   ```yaml
   services:
     postgres:
       image: postgis/postgis:16-3.4   # pin; check for the current 16.x/3.x tag
       restart: unless-stopped
       env_file: /etc/ttw/data.env
       environment: { POSTGRES_USER: ttw_admin }
       volumes: [ "/srv/data/postgres:/var/lib/postgresql/data", "./initdb:/docker-entrypoint-initdb.d:ro" ]
       networks: [ttw_data]
       ports: [ "100.x.y.z:5432:5432" ]   # the host's Tailscale IP only, for QGIS and Adminer
       shm_size: 512m
       mem_limit: 4g
       command: >
         postgres -c shared_buffers=1GB -c effective_cache_size=3GB -c work_mem=16MB
                  -c maintenance_work_mem=256MB -c max_connections=200
     mariadb:
       image: mariadb:lts
       restart: unless-stopped
       env_file: /etc/ttw/data.env
       volumes: [ "/srv/data/mariadb:/var/lib/mysql" ]
       networks: [ttw_data]
       mem_limit: 1g
   networks: { ttw_data: { external: true } }
   ```
   `infra/data/initdb/01-roles.sh` creates one role and one database per app: `odoo`, `n8n`, `library`, `dash`, `apgis` (with `CREATE EXTENSION postgis` in `apgis` only). The script reads the passwords from the environment. No app gets superuser, except Odoo, which needs `CREATEDB` (and only that) to create its database.
3. **Backups** (`infra/backup/`):
   - install `restic` on the host;
   - `/etc/ttw/backup.env` holds the R2 keys, `RESTIC_REPOSITORY=s3:<r2-endpoint>/ttw-backups` and `RESTIC_PASSWORD`;
   - store the restic password **outside the server** as well (password manager plus a printed copy), because without it the backups can't be read.
   - `infra/backup/backup.sh`, run nightly by a systemd timer at 03:15 UTC:
     1. `pg_dumpall` (via `docker exec`) and `mariadb-dump --all-databases` into `/srv/backups/db/`;
     2. `restic backup /srv/backups/db /srv/data --exclude /srv/data/postgres --exclude /srv/data/mariadb /etc/ttw` (live database files are excluded; the dumps cover them);
     3. `restic forget --keep-daily 7 --keep-weekly 5 --keep-monthly 12 --prune`;
     4. post the result to n8n once Phase 7 exists; until then, write it to the journal.
   - Hostinger weekly snapshots stay on.
4. Start the stack, then run the backup once by hand.

**Validation:**

- [ ] `psql` over Tailscale from your computer connects as `ttw_admin`.
- [ ] Each app role can connect only to its own database.
- [ ] `restic snapshots` lists the first snapshot.
- [ ] **Restore test:** `restic restore latest --target /tmp/restore-test`, then load the dump into a scratch container and count the tables. Write the result in `09-operations/backups.md`.

**Rollback:** `docker compose down`, remove `/srv/data/postgres` and `/srv/data/mariadb` (nothing is in them yet), then fix and rerun.

---

## Phase 5: Management zone (Tailscale only)

**Preconditions:** Phase 4 validated.

**Procedure:** `infra/mgmt/compose.yml`, with every port bound to the host's **Tailscale IP** only:

| Tool | Image | Port | Notes |
|---|---|---|---|
| code-server | `codercom/code-server` | 8443 | Workspace `/srv`; password in `/etc/ttw/mgmt.env` |
| Dockge | `louislam/dockge` | 5001 | Stacks dir `/srv/infra/current`; read the Compose files, don't fork them in the UI |
| Adminer | `adminer` | 8081 | Joins `ttw_data` |
| Netdata | `netdata/netdata` | 19999 | Host metrics; claim to Netdata Cloud optional |
| Uptime Kuma | `louislam/uptime-kuma:1` | (via Caddy) | Joins `ttw_team`, published as `status.` in Phase 7 |

**Validation:**

- [ ] Each tool opens from your computer over Tailscale.
- [ ] Each tool fails from your phone with Tailscale switched off.
- [ ] An outside port scan still shows nothing open.

**Rollback:** `docker compose down` for the mgmt stack.

---

## Phase 6: Deploy pipeline

**Preconditions:** Phase 5 validated. At least one area repo has a `kvm8.json`. `efv-kb` comes first.

**Procedure:**

1. **Deploy keys:**
   - for each repo, `ssh-keygen -t ed25519 -f /etc/ttw/keys/<repo> -N ""`;
   - add the `.pub` as a **read-only** deploy key in that repo's GitHub settings;
   - add a `Host github-<repo>` entry in `/root/.ssh/config` that uses that key.
2. **`infra/scripts/ttw-deploy <repo>`:**
   1. `git fetch` and a hard reset of `/srv/repos/<repo>` to `origin/<branch>`;
   2. if the commit is new, read `kvm8.json`;
   3. for each build, run `run` in a throwaway container with the repo mounted read-only and a writable output volume;
   4. copy `output` to `/srv/sites/.<name>.new`, swap it in with `mv` (`.<name>.old` is kept for one rollback);
   5. run each healthcheck with `curl --fail`;
   6. log to journald and post to n8n (from Phase 7).
3. **Timer:** a systemd timer runs `ttw-deploy --all` every 5 minutes. In Phase 7, an n8n webhook triggered by GitHub push events runs it straight away. The timer stays as the fallback, so nothing ever needs an inbound connection to the host.
4. **Rollback command:** `ttw-deploy --rollback <name>` swaps `.<name>.old` back.

**Validation:**

- [ ] A trivial commit to `efv-kb` `main` appears on the site within 5 minutes.
- [ ] A deliberately broken build leaves the live site unchanged and logs the failure.
- [ ] `--rollback` restores the previous build.

**Rollback:** disable the timer. Sites stay as last published.

---

## Phase 7: Team zone: Access, n8n, status, dashboard shell

**Preconditions:** Phase 6 validated.

**Procedure:**

1. **Access applications** (create each *before* its tunnel hostname):

   | Application | Domain and path | Policy |
   |---|---|---|
   | Team apps | `kb.`, `erp.`, `n8n.`, `status.`, `gis.` (all paths) | Allow `team` |
   | n8n webhooks | `n8n.techtheworld.win/webhook/*` and `/webhook-test/*` | **Bypass** (Stripe, GitHub and the forms must reach them; every workflow checks a signature or secret) |
   | Dashboard | `dash.` | Allow `admins`, *or* `dash-guests` with OTP; 14-day sessions for guests |
   | Odoo backend on shop hosts | `shop.`, `wear.`, `finds.`, `live.`, `learn.` paths `/web/login`, `/odoo`, `/web/database` | Allow `team` (customers use `/shop` and `/my`; staff sign in on `erp.`) |

   Session duration: 24 h for the team, 14 days for guests.
2. **n8n** (`infra/team/n8n.yml`):
   - image `n8nio/n8n`, pinned;
   - `DB_TYPE=postgresdb` against the `n8n` database;
   - `N8N_HOST=n8n.techtheworld.win`, `WEBHOOK_URL=https://n8n.techtheworld.win/`;
   - `N8N_ENCRYPTION_KEY` from `/etc/ttw/n8n.env` (back it up: credentials can't be decrypted without it);
   - `N8N_PROXY_HOPS=1`, `GENERIC_TIMEZONE=America/Chicago`;
   - `mem_limit: 2g`.

   Caddy block:
   ```caddyfile
   http://n8n.techtheworld.win:8080 { import headers; reverse_proxy n8n:5678 }
   ```
3. **First workflows:**
   - *GitHub push → ttw-deploy*: the webhook checks the GitHub HMAC signature, then runs the deploy through a small authenticated endpoint on the host. The endpoint is a systemd socket on a Unix socket mounted into n8n, never a TCP port.
   - *Backup report*: nightly; alerts on failure.
   - *Disk over 80 %*: an alert.
4. **Uptime Kuma** at `status.`:
   - monitors for every public host and the tunnel;
   - notifications through the email provider, plus Discord later.
5. **`dash.`:** a placeholder page for now; the n8n data feed comes in Phase 11.

**Validation:**

- [ ] A team member reaches `n8n.` after GitHub sign-in.
- [ ] A stranger is stopped at Cloudflare.
- [ ] `curl https://n8n.techtheworld.win/webhook/<test>` reaches the test workflow without sign-in.
- [ ] A push to `efv-kb` deploys within a minute and the report arrives.

**Rollback:** remove the tunnel hostnames, then the Access apps, then stop the stack.

---

## Phase 8: EFV sites (the `efv-kb` runbook does the content)

**Preconditions:**

- Phase 7 validated.
- `efv-kb` has `kvm8.json` with the builds `kb`, `tools`, `www`, `sound`, `games` and `film` (see its runbook).

**Procedure:**

1. Add the Caddy blocks:
   - static `file_server` for `/srv/sites/kb`, `tools`, `www`, `sound`, `games` and `film`;
   - the security headers from `efv-kb/deploy/_headers`, translated into Caddy `header` directives.
2. Add the tunnel hostnames for `kb.` (Access first), `sound.`, `games.`, `film.` and `tools.`.
   - `tools.` stays behind an Access policy (`team` only) until the members sign-in exists. That comes from `efv-kb`'s runbook phase E4.
3. **Library API**, once `efv-kb` builds it (accounts, admin portal, invites, audit log): a container on `ttw_team` + `ttw_members` + `ttw_data`, using the `library` database. It validates the `Cf-Access-Jwt-Assertion` header against the team's Access certificate, as a second check behind Cloudflare.
4. **WordPress for `efv.`:**
   - `wordpress:php8.3-apache` pinned, on `ttw_public` + `ttw_data`, using MariaDB `efv_wp`, with `mem_limit: 1g`;
   - an Access app on `efv.techtheworld.win/wp-admin*` and `/wp-login.php` (Allow `team`);
   - few plugins, with auto-updates on.
5. **R2 for Sound and Games:**
   - make the buckets `efv-sound-media` and `efv-games-downloads` available on custom domains `media.techtheworld.win` and `dl.techtheworld.win`, served by Cloudflare;
   - Sound's full-length streams use signed URLs issued by the Library API later (efv-kb phase E6). Until then, only previews are public.

**Validation:**

- [ ] All six static hosts load.
- [ ] `kb.` needs GitHub sign-in.
- [ ] The landing page's *Travel* to each realm and *Return to orbit* work on the live addresses.
- [ ] `version.txt` on `kb.` matches the latest efv-kb commit's build time.
- [ ] `wp-admin` is blocked for strangers.

**Rollback:** remove the hostnames; `/srv/sites/*.old` holds the previous builds.

---

## Phase 9: Odoo Community (all four companies)

**Preconditions:** Phase 4 data layer healthy; the email provider ready; Phase 7 Access apps in place for `erp.`.

**Procedure:**

1. **Image:** the official `odoo` image, pinned to the newest Community major (check Docker Hub's `odoo` tags and Odoo's release notes; write the version in an ADR). Odoo joins `ttw_team`, `ttw_public` and `ttw_data`.
2. **`infra/odoo/odoo.conf`** (secrets come from `/etc/ttw/odoo.env` through the entrypoint):
   ```ini
   [options]
   db_host = postgres
   db_user = odoo
   db_name = odoo
   dbfilter = ^odoo$
   list_db = False
   proxy_mode = True
   workers = 4
   max_cron_threads = 1
   limit_memory_soft = 1610612736
   limit_memory_hard = 2147483648
   limit_time_cpu = 120
   limit_time_real = 240
   data_dir = /var/lib/odoo
   admin_passwd = <from odoo.env, long random; this is the database master password>
   ```
   Compose: `mem_limit: 6g`, a volume `/srv/data/odoo:/var/lib/odoo`, and a `./addons:/mnt/extra-addons:ro` mount for any community modules (each one recorded in an ADR).
3. **Caddy:** one block for every Odoo host:
   ```caddyfile
   http://erp.techtheworld.win:8080, http://shop.techtheworld.win:8080, http://wear.techtheworld.win:8080,
   http://finds.techtheworld.win:8080, http://live.techtheworld.win:8080, http://learn.techtheworld.win:8080 {
     import headers
     request_body { max_size 64MB }
     reverse_proxy /websocket odoo:8072
     reverse_proxy odoo:8069
   }
   ```
4. **First run:**
   - create the `odoo` database with demo data **off**;
   - set the language and the timezone America/Chicago;
   - in Settings, set `web.base.url` to `https://erp.techtheworld.win` and freeze it (`web.base.url.freeze`).
5. **Multi-company:** enable it; the main company is Ogun Tech Solutions. Add the companies **EFV** and **AP Project**. A La Mode doesn't sell, so it has no company. Give each its own:
   - logo and address;
   - currency USD;
   - chart of accounts (US);
   - fiscal settings.

   Which legal entity each company is remains an open decision (see `VENTURES-PLAN.md`); Odoo keeps the books separate either way.
6. **Apps:** install the Community apps listed in `NETWORK-PLAN.md` ▸ *Odoo*, in this order:
   1. Contacts, Invoicing, Sales, CRM;
   2. Inventory, Purchase, Manufacturing;
   3. Website, eCommerce, Point of Sale;
   4. eLearning, Events, Surveys, Blog, Forum;
   5. Project, Timesheets, Employees, Discuss, Calendar, Email Marketing.
7. **Users:** you as administrator. Each team member gets an Odoo user limited to their company or companies.
8. **Email:** outgoing server set to the provider on 587 (STARTTLS); incoming through the provider's inbound route or Email Routing forwarding.
9. **Websites:** create one website per host and set each one's domain. Assign each to its company:

   | Website | Company |
   |---|---|
   | `shop.` | Ogun Tech Solutions |
   | `finds.` | Ogun Tech Solutions |
   | `live.` | Ogun Tech Solutions |
   | `wear.` | To decide (on hold) |
   | `learn.` | Ogun Tech Solutions (shared catalogue; courses carry their company) |

   Leave each website unpublished (behind the coming-soon page) until its area's runbook says it's ready.
10. **Tunnel hostnames:** add `erp.` and the website hosts, each one only when that website is ready to be seen.

**Validation:**

- [ ] Signing in at `erp.` goes GitHub (Access) → Odoo.
- [ ] `/web/login` on `shop.` is blocked for strangers.
- [ ] `/web/database/manager` is unavailable (`list_db = False`).
- [ ] A test quote becomes an invoice in each company.
- [ ] An outgoing email arrives.
- [ ] Odoo's memory stays under its cap with 4 workers (`docker stats`).
- [ ] Tonight's backup contains the `odoo` database and the filestore (`/srv/data/odoo`).

**Rollback:**

- drop the `odoo` database and clear `/srv/data/odoo` (nothing live yet);
- after go-live, restore the last dump and filestore from restic.

---

## Phase 10: Payments (Stripe, test mode first)

**Preconditions:** Phase 9 validated; a Stripe account (one per legal entity once those are decided).

**Procedure:**

1. Stripe **test** keys in `/etc/ttw/stripe.env` and in Odoo ▸ Payment Providers ▸ Stripe (per company).
2. Odoo checkout on `shop.`: a test card order → paid invoice.
3. **Library subscriptions** (efv-kb phase E5):
   - Stripe Checkout plus the customer portal;
   - Stripe webhooks to `n8n.../webhook/stripe`, signature-checked;
   - n8n switches members on and off in the Library API.
4. Switch to **live** keys only after a full test pass, and write it in the change-control log.

**Validation:**

- [ ] A test order is paid and invoiced.
- [ ] A test subscription switches access on, and cancelling switches it off.
- [ ] Stripe's webhook log shows 2xx responses.

**Rollback:** set Odoo's provider back to test or disabled, and pause the n8n workflows.

---

## Phase 11: Dashboard (`dash.`) and operations feed

**Preconditions:** Phases 7–10 running.

**Procedure:**

1. n8n collects, every 15 minutes, into the `dash` database:
   - Uptime Kuma status;
   - the last deploy per site;
   - the last backup result;
   - disk and memory (from Netdata's API over the Docker network);
   - Odoo counts (orders, open quotes, members);
   - Stripe MRR (from the live keys).
2. `dash.` is a static page that reads a JSON endpoint served by a small read-only API container.
   - **Guests** see the showcase view: uptime, deploys, the architecture diagram.
   - **Admins** also see money and customer numbers. The API checks the Access JWT's identity before including them.
3. **Guest procedure:** add the guest's email to `dash-guests` with an expiry date, then send them `https://dash.techtheworld.win`.

**Validation:**

- [ ] A guest email gets an OTP and sees the showcase only.
- [ ] Removing the email ends their access at the next session check.

**Rollback:** remove the `dash.` hostname.

---

## Phase 12: Area onboarding

Each area's own chat runs its runbook. This repo's chat only provides what they ask for:

| Area | From this rig | Done when |
|---|---|---|
| **Ogun Tech Solutions** (this repo) | `shop.` catalogue, MSP CRM pipeline, contracts as Odoo products with recurring invoices (Community: manual or scheduled invoices, not Enterprise Subscriptions), `finds.` consignment flow, `live.` POS | A test MSP client is quoted, invoiced and paid; a test consignment item is submitted → picked up → sold → seller payout recorded |
| **A La Mode** (`aLaMode-kb`) | `alamode.` static host; Git LFS fetch in `ttw-deploy` for this repo; n8n *new collection* post | See its runbook |
| **AP Project** (`the-ap-project`) | `apgis` database with PostGIS; Martin on `ttw_public` + `ttw_team` + `ttw_data`; hosts `maps.` (public) and `gis.` (team); QGIS access to `apgis` over Tailscale | See its runbook |
| **EFV** (`efv-kb`) | Everything in Phase 8; EFV company products in Odoo (merch, Sound physical, courses) | See its runbook |

**Martin (vector tiles) for the AP Project:**
- image `ghcr.io/maplibre/martin`, pinned;
- it connects as a **read-only** role:
  - `apgis_public` reads only the `ap_public` schema, for `maps.`;
  - `apgis_team` reads `ap`, for `gis.`.

  That's two Martin instances (or two configs), so the public one can never see private layers.
- Caddy routes `maps.techtheworld.win/tiles/*` → `martin-public:3000` and `gis.techtheworld.win/tiles/*` → `martin-team:3000`.

---

## Phase 13: Learning platform (`learn.`) and video

**Preconditions:** Phase 9; the video host decided (Bunny Stream or Cloudflare Stream), recorded as an ADR.

**Procedure:**

1. Odoo eLearning on the `learn.` website.
2. Course categories per area: EFV, Ogun Tech, AP Project, plus free A La Mode process write-ups if wanted.
3. Videos are uploaded to the video host and embedded by URL; no video files go on this disk.
4. Paid courses use the eCommerce checkout.
5. n8n: course bought → enrol → Discord role.

**Validation:** a test student buys a course, watches an embedded video, passes a quiz and gets a certificate.

**Rollback:** unpublish the courses.

---

## Phase 14: Discord roles and live selling

**Procedure:**

1. Create a Discord application and bot with only the *Manage Roles* permission.
2. Put its token in `/etc/ttw/discord.env`.
3. n8n does the role sync: on a purchase, subscription or expiry, add or remove the role. Members link their Discord account once, through OAuth on their account page.
4. `live.`: an Odoo website page with the stream embed link (it opens on YouTube, Twitch or TikTok) and a *Shop the live* product list.
5. Set up Odoo POS for pop-ups, with a card reader.

**Validation:** a test purchase grants the role. A POS sale removes the item from the website stock.

---

## Phase 15: EFV Sound streaming

From `efv-kb` phase E6. The rig provides:

- signed-URL issuance in the Library API (short-lived, for each listener with a subscription);
- R2 lifecycle rules;
- CORS on `media.` for `sound.` only.

HLS segments are produced off the server (a local or RunPod job) and uploaded to R2. The KVM never transcodes audio during peak hours.

**Validation:** a subscriber streams a hi-res track. A copied URL stops working after it expires.

---

## Phase 16: Operations (ongoing)

| Every | Task | Where it's recorded |
|---|---|---|
| Day (automatic) | Security updates; nightly backup + report | journald, n8n |
| Week | Review and update container images (pull, `docker compose up -d`, check `status.`); `docker image prune` | `09-operations/patching.md` |
| Month | **Restore test** of one database and one site from restic; review Access logs and Tailscale devices; check R2 and Hostinger usage | `09-operations/backups.md`, `09-operations/maintenance.md` |
| Quarter | Rotate the n8n webhook secrets and the deploy keys; review memory caps against `docker stats` history; rebuild-from-scratch drill on a throwaway VPS (optional, a strong portfolio piece) | `01-logs/build-journal.md` |
| Incident | Follow `09-operations/incidents.md`; write a short post-incident note | `09-operations/incidents.md` |

---

## Validation (whole rig)

- [ ] Outside port scan of the public IP: nothing open.
- [ ] Every public host loads over HTTPS. Every team host demands GitHub sign-in. Every management tool is reachable only over Tailscale.
- [ ] A push to any area repo redeploys its site without anyone touching the server.
- [ ] Last night's backup exists, and this month's restore test passed.
- [ ] `docker stats`: total memory under 50 % of 32 GB at idle.
- [ ] Rebuild drill: this runbook + restic + the password manager rebuild the rig on a fresh VPS.

## Rollback (whole rig)

- **Per phase:** see each phase.
- **Whole host:**
  1. restore a Hostinger snapshot (`02-hardened` or a later one); or
  2. build a fresh VPS through Phases 1–5, `restic restore` `/etc/ttw` and `/srv/data`, load the database dumps, re-run `ttw-deploy --all`, then point the tunnel at the new host.

  DNS doesn't change, because every address is a tunnel hostname.

## Notes

- **Access before DNS:** when a team host's tunnel hostname is added before its Access application, it's public until the app exists. Always create the Access app first.
- **Docker and UFW:** Docker writes its own iptables rules and ignores UFW for published ports. That's why `setup.sh` sets the daemon's default bind to `127.0.0.1`, and why management ports bind to the Tailscale IP. Never publish a port as `0.0.0.0`.
- **Odoo websocket:** without the `/websocket` route to port 8072, live chat and Discuss fail quietly.
- **Odoo websites and `web.base.url`:** freeze it to `erp.`. Each website's own domain field handles shop links.
- **Enterprise-only Odoo apps** (Subscriptions, Helpdesk, Appointments, Rental, Sign, Documents, Studio, Knowledge) aren't available. The plan uses the Community workarounds listed in `NETWORK-PLAN.md`.
- **The homelab's Odoo control plane** (`14-runbooks/runbook-odoo-control-plane.md`, internal, IT-Glue-like at `odoo.corp.techtheworld.win`) is a separate, internal-only instance in the lab. The rig's Odoo at `erp.` is the business system. Keep them separate (record this as an ADR), or decide to retire the lab one.
- **Look:** every web interface on the rig (the sites, `dash.`, `status.` pages you customise, admin portals) uses **EFV Noir**, the base theme in `efv-kb/brand/efv-noir/`: black and paper white, deep gold, blood red, hunter green, velvet purple, and EFV Warlord for titles.
- **Public repo:** this repo is a portfolio. Never commit IPs, tokens, `.env` files, customer data or the AP Project's private data. `infra/` holds `*.env.example` files only.
- **Repo name:** the user calls this repo *techtheworld-ots*; on GitHub it's `quanwatson/techdojo-ots`. Every URL here uses the GitHub name. If it's renamed, GitHub redirects the old URLs, but update `setup.sh`'s download line and the deploy keys anyway.
- **KVM 4 first?** Phases 1–9 fit on a KVM 4 with Odoo at 2 workers. Upgrade in place in hPanel before Phase 12 opens any shop to the public, then raise Odoo to 4 workers.

---

## Where this lives

This folder is the home of the KVM 8 rig: the rig is managed by Ogun Tech Solutions, so its runbook, plans and infrastructure live here in `techdojo-ots`. Each area repo keeps a **handoff runbook** for only what it puts on the rig:

| Repo | Handoff runbook |
|---|---|
| `efv-kb` | `deploy/KVM8-RUNBOOK.md` |
| `aLaMode-kb` | `stack/kvm8/RUNBOOK.md` |
| `the-ap-project` | `operations/kvm8/RUNBOOK.md` |

When an area needs something from the rig (a host, a database, an Access app, an n8n flow), its chat asks for it against the *Who owns what* table above, and this repo's chat makes the change here.
