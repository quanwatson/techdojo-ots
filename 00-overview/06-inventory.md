# Inventory Overview

This is a quick, human-readable snapshot of the core assets in the lab. Serials, detailed specs, and lifecycle data live separately under `10-hardware/inventory/` — this file is meant to be the summary view, the same way an executive summary and a detailed asset database serve different purposes in a real IT shop.

## Domains
- External domain: `techtheworld.win`
- Internal namespace: `corp.techtheworld.win`

## Compute and endpoints
- Primary authoring / remote desktop: Dell OptiPlex 3080
- Virtualization host: Lenovo ThinkCentre M720s (Proxmox VE planned)
- Thin client / terminal: Raspberry Pi (role still TBD)
- Production host (cloud): Hostinger KVM 8 VPS `ttw-core`, runs every site and service on `techtheworld.win`. See `06-compute/hosts/kvm8-rig/`.

## Network infrastructure
- Firewall / router: repurposed Untangle hardware, running pfSense
- Switch: Cisco Catalyst 3560, 8-port, managed
- Wireless access point: TBD, planned for a later phase

## Keeping this current

This file stays a summary — no serials or sensitive details get added here, ever. I only touch it when a core asset gets added, removed, repurposed, or when a role changes meaningfully. The detailed records under `10-hardware/inventory/` are the ones that actually get versioned as things change day to day.

This reflects the current, intentional scope of the lab — not everything I own, just what's actually in play.
