# HomeLab — Network, Systems, and Solutions Architecture Lab

**Focus area:** Technology · ♅ Uranus. The map of all the focus areas is in `06-compute/hosts/kvm8-rig/VENTURES-PLAN.md`.

## Overview

This repo documents a homelab I built to develop real skills in networking, systems administration, security, and solutions architecture — not just to have a pile of gear running in a closet.

I run it documentation-first and phase-gated, which is a fancy way of saying: I write down what I'm about to do and why before I do it, and I don't move to the next layer until the current one actually works. That's closer to how change gets managed in a real IT shop or MSP than how most home labs get built.

## What this is (and isn't)

It's a controlled, production-inspired environment with change control, validation, and rollback baked in from the start. I document it the way I'd document something supporting an actual organization, because that's the habit I'm trying to build.

It's not a pile of one-off experiments, a click-through tutorial repo, or a place where I bolt on every new tool I read about. If a folder in here doesn't have a reason for existing, it gets cut.

## Core principles

**Documentation-first.** Before I touch a config, I write down the intent, the risks, and how I'd roll it back if it goes sideways. Runbooks and checklists gate execution — they're not written after the fact to look tidy.

**Layered, phase-gated execution.** Changes go in one layer at a time — Layer 3 before Layer 2, planning before execution, validation before expansion. It's slower than just wiring everything up at once, but it means when something breaks, I usually know within one layer where to look.

**Real-world constraints, on purpose.** I'm running on older switch hardware with real IOS limitations, finite CPU and storage, and a household internet connection that has to stay up regardless of what I'm doing to the lab. Those constraints aren't a downside — they're most of the point. Anyone can build clean infrastructure on infinite resources.

## Repository navigation

**Start here:** `00-overview/` — vision, goals, architecture, environments, and the roadmap. Read `01-vision.md` first if you only read one file.

**Core documentation:**
- `01-logs/` — build journal (what actually changed), learning log (what I understood and when), session notes (so I can pick up where I left off)
- `03-network/` — firewall, routing, VLANs, switching
- `14-runbooks/` — step-by-step procedures, gated by phase

**Platform and services:** Proxmox virtualization, an internal CA and internal DNS (both planned), directory services and control-plane tooling (further out).

**Certification, career, and business track:**
- `training-program/` — the 36-month Solutions Architect + vCIO study plan, time log, and stack inventory
- `15-certifications/` — study notes, practice-exam logs, glossary
- `16-career/` — skill matrix history, monthly reviews, proof-of-work index
- `17-ots/` — Ogun Tech Solutions proof-of-work, SOPs, client docs
- `18-solutions-architecture-adrs/` — architecture decision records tied to the SA track

## Tooling and methodology, honestly

I used AI tools — research, drafting help, sanity-checking my thinking — the way I'd use a senior coworker or a good reference doc: to move faster and catch blind spots, not to skip the work. Every architecture decision, every config, every troubleshooting session, and every line of documentation here was done by me. If I didn't understand why something worked, I didn't ship it.

## For employers and reviewers

Start with `00-overview/`, then look at the build journal for real state changes, the runbooks for how I execute safely, and the learning log for growth over time. `README_FOR_EMPLOYERS.md` has more on the reasoning behind how this is built.

## The point of all this

The goal isn't to prove I can rack a server. It's to show how I think, plan, execute, and document — skills that transfer directly to enterprise IT, MSP work, and solutions architecture roles.
