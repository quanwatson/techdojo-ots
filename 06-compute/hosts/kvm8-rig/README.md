# KVM 8 rig: `ttw-core`

The production host for `techtheworld.win`: a Hostinger KVM 8 VPS that runs every site and service for the four areas (EFV, A La Mode, Ogun Tech Solutions, the AP Project), with no open inbound ports. Public traffic comes through Cloudflare Tunnel; admin access is over Tailscale only.

| File | Read it for |
|---|---|
| [`RUNBOOK.md`](RUNBOOK.md) | **Start here.** The build, phase by phase, with validation and rollback for each phase |
| [`NETWORK-PLAN.md`](NETWORK-PLAN.md) | The design: services, zones, sign-in, payments, Odoo, sizing, costs, decisions |
| [`VENTURES-PLAN.md`](VENTURES-PLAN.md) | What each area sells and in what order |
| [`base-server/`](base-server/) | The Phase 2 script and its walkthrough |
| `infra/` | Created from Phase 3 onwards: everything that runs on the host, as Compose files and scripts |

**Status:** plan only. Nothing is built yet. Next: `RUNBOOK.md` Phase 0.

Each area repo has its own runbook for what it puts on the rig:

| Repo | Runbook |
|---|---|
| `efv-kb` | `deploy/KVM8-RUNBOOK.md` |
| `alamode-kb` | `stack/kvm8/RUNBOOK.md` |
| `the-ap-project` | `operations/kvm8/RUNBOOK.md` |
