# The focus areas, one server: venture plan

## The focus areas

These are the core projects and ventures being explored, each with its planet, following the traditional occult correspondences. **Earth (Gaia)**, **Saturn** and **Pluto** were chosen by the owner; the rest are matched to their classical meanings.

| # | Focus area | Planet | Why that planet | Where it lives | Projects tagged to it |
|---|---|---|---|---|---|
| 1 | **Technology** | ♅ Uranus | Invention, electricity, networks, sudden breakthroughs | `techdojo-ots` | The homelab and its runbooks; the KVM 8 rig; the Training Control Center; Ogun Tech Solutions services (managed IT, vCIO, hosted apps, IT training); `dash.` and `status.` |
| 2 | **Enterprise & economics** | ♃ Jupiter | Wealth, expansion, commerce, good fortune | `tme-kb` (private): Malkuth Enterprise Trust Co., Malkuth Holdings Co and its twelve series, capital and the raise, the Biz Dev Hub; plus Odoo on the rig | Odoo back office (`erp.`) for every company; the Ogun Tech shop (`shop.`), the consignment marketplace (`finds.`), live and hybrid shops (`live.`); Stripe; Library subscriptions and the blank-copy licence; the entities, money and contracts below |
| 3 | **Mass comm & media** | ☿ Mercury | The messenger: writing, broadcasting, publishing, signals | `efv-kb` | The EFV Library and Media Writing Hub with its production apps and ComfyUI workflows; EFV Sound, EFV Film (Ordo Mentis: 7+1, The Island I Promised You) and EFV Games; the EFV website (`efv.`); EFV Tools (`tools.`); production packages and AI production services; the `techtheworld.win` universe |
| 4 | **Creative arts & fashion** | ♀ Venus | Beauty, art, adornment, design | `aLaMode-kb` (+ the brand kit in `efv-kb`) | A La Mode: the learning path, the collections, the showcase, the 3D maison and the atelier customiser; the EFV Noir design system and the EFV Warlord typeface |
| A | **National affairs & development** | ☉ Sun | Sovereignty, leadership, the centre a people organise around | `the-ap-project` | The governance-design track: the charter and stakeholder seat, the SOS 13+1 trust model, the five zones, the Transition Committee, the modernised Green Book, the legal pathways (home rule, incorporation, land trusts, federal routes) and the capital concepts |
| B | **Urban planning & development** | 🜨 Earth (Gaia) | Owner's choice: the land itself, the living ground every plan is built on | `the-ap-project` | The planning track: the territory profile, zoning concept, phasing roadmap and site-analysis method; the GIS library, the ten priority maps and the PostGIS geodatabase (`maps.`, `gis.`); the Cities: Skylines II digital twin; GIS and site-report services |
| C | **Human advocacy** | ♄ Saturn | Owner's choice: justice, duty, protection, the long view | `the-ap-project` | Cahokia heritage and tribal consultation; the environment and public-health and equity layers (floodplain, brownfields, environmental justice); the public data dashboard; community engagement; education and heritage content; community land trusts |
| — | **Self-mastery** (private) | ♇ Pluto | Owner's choice: transformation, depth, rebirth | Private: no repo and no public site | Not tracked here |

Planets not yet used, if an area needs a second: ☽ Moon (home, the public, the people; a second for human advocacy), ♂ Mars (defence, drive, construction; a second for national affairs or urban planning), ♆ Neptune (film, music, dreams; a natural second for mass comm & media).

## The knowledge bases

| Area | Knowledge base | What it already holds |
|---|---|---|
| **Mass comm & media** (and the EFV side of creative arts) | `efv-kb` | The EFV Library: the Media Writing Hub, 15 production apps, 56 ComfyUI workflows, scripts and departments |
| **Creative arts & fashion** | `aLaMode-kb` | A La Mode's idea → sketch → pattern → muslin → sample workflow, with Seamly2D, Inkscape, Ink/Stitch and Blender, and machine runbooks |
| **Technology** | `techdojo-ots` (Ogun Tech Solutions) | A documented homelab (Proxmox, segmentation, runbooks, change control), an Odoo control-plane runbook, and a 36-month Solutions Architect + vCIO track |
| **A · B · C** | `the-ap-project` | The AP Base planning record for the American Bottom: GIS library, ten priority maps, capital and governance concepts, and a Cities: Skylines II digital twin |

This plan picks **real business models** for three of the areas (A La Mode is a learning studio and showcase, not a business), says what each one needs from the server, and orders them so the first ones can earn while the slower ones grow. Prices are starting points to test against competitors, not guarantees. This is a planning document, not legal, tax or financial advice.

---

## The shared platform

Every area uses the same parts of the server, so each new venture adds content and products, not new infrastructure:

| Shared part | Used by every area for |
|---|---|
| **Odoo Community** (multi-company: EFV, Ogun Tech Solutions, AP Project; A La Mode doesn't sell, so it needs no company) | Products, orders, invoices, clients, projects, stock, with books kept per company |
| **Odoo websites** | One shop or site per venture, on its own address |
| **`learn.`** (Odoo eLearning + video host) | Courses and paid downloads from all four areas, in one catalogue |
| **The guild** (Discord) | One community with a wing per area; purchases unlock rooms |
| **n8n** | Order handling, client onboarding, reports and the links between everything |
| **The landing page** | A universe with one star system per area (see the end of this plan) |
| **Stripe** | All payments, separated per company |

---

## 1. Mass comm and creative arts (EFV)

| # | Business model | Who pays | Starting price to test | Runs on | First proof (90 days) |
|---|---|---|---|---|---|
| 1.1 | **EFV Tools subscription**: the hosted public edition of the Library | Writers, indie filmmakers, content creators | $11.11/month, $111/year (from the Library pricing) | `tools.`, Stripe, n8n | 33 beta invites; 10 convert to paid |
| 1.2 | **Blank copy licence**: the Library to self-host | Small studios, schools, agencies | $222 one time, 12 months of updates | `shop.` digital product | 3 sales |
| 1.3 | **Production packages**: music videos, short ads, social content, written and planned with the Media Writing Hub | Local businesses, independent artists | Fixed packages, for example a 30-second ad or a lyric video at a set price, a full music video quoted | Odoo (quotes, projects, invoices), `efv.` portfolio | 2 paid projects, both used as case studies |
| 1.4 | **AI production services**: ComfyUI workflows run for clients (product shots, B-roll, thumbnails, stills) | Brands, YouTubers, shops (including your own) | Per pack, for example 20 product images | n8n job queue + a rented GPU (RunPod), Odoo invoicing | 5 paid packs |
| 1.5 | **Courses**: screenwriting, A/V scripts for ads and music videos, AI-assisted production | Aspiring creators | One-off course price or included with Tools | `learn.` | 1 course live, 50 students including free |
| 1.6 | **Merch and media**: EFV merch, plus a channel or podcast with sponsorships later | Fans and the audience | Print-on-demand margin; sponsorships when audience allows | `shop.`, `live.` | Merch store live |
| 1.7 | **EFV Sound**: streaming subscriptions for EFV's own catalogue, physical copies (vinyl, cassette, CD, signed, pre-orders) and *Release with EFV* for other artists | Listeners, collectors, independent artists | Subscription in line with the Tools price; physical at typical indie prices; release services per release | `sound.`, R2, Stripe, Odoo | 1 release with a funded vinyl pre-order |
| 1.8 | **EFV Games**: free browser games that bring people in, paid demos and full games later, mod jams and community | Players | Free to start; paid builds when the Gnostica demo is ready | `games.`, R2, Discord | Gnostica: Sunrise Protocol Part 1 demo out; 500 plays of the browser games |
| 1.9 | **EFV Film**: the showcase that pitches EFV's slate to producers and partners | Production companies, funders, brands | Not sold directly: it opens development and co-production deals | `film.`, Odoo leads | 3 pitch-deck requests from the target list |

**Why it works:** the tools are already built, so subscriptions and licences cost almost nothing to deliver. Production work brings in cash now and feeds the portfolio. Sound, Games and Film each get their own realm in the universe, so the creative work is the front door to everything else.

---

## 2. Fashion (A La Mode): a studio, not a business

A La Mode is **not a venture**. It's a learning studio: learning the craft from idea to sample, and making a handful of experimental collections that showcase creativity in fashion. **Nothing is for sale.**

| What | How | On the server | First proof (90 days) |
|---|---|---|---|
| **Learning** | The learning path in `aLaMode-kb`: machine basics, a first commercial pattern, then drafting in Seamly2D | Nothing; it lives in the repo | First muslin and first finished piece |
| **Collections** | Small, experimental groups of 3–8 looks around one idea, each with a brief, line plan and lookbook | — | First capsule collection (3 looks) finished and photographed |
| **The showcase** | A static lookbook site built from the repo: each collection's idea, palette, looks and process | `alamode.techtheworld.win` (static; no Odoo, no payments) | The lookbook is live with the first collection |
| **Sharing** | New collections posted to the guild and socials; optional free process write-ups on `learn.` | n8n posts | One collection shared |

**How it helps the other areas:** the collections give EFV wardrobe and styling for its films and music videos, and the showcase is a creative portfolio alongside EFV's work. A La Mode adds almost no load to the server: one static site.

---|---|---|---|---|---|
| 2.1 | **Digital sewing patterns**: PDF patterns in several sizes, drafted in Seamly2D, with instructions | Home sewists worldwide | Typical indie pattern prices (roughly $10–20 each); bundles | `wear.` digital products, `learn.` for sew-along videos | 3 patterns published, first 50 sales |
| 2.2 | **Made-to-order and custom pieces** | Clients who want fit, fabric or design choices | Priced from materials + hours + margin, with a deposit up front | Odoo Manufacturing (pattern → cutting → sewing → finishing as steps), `wear.` | 5 custom orders delivered |
| 2.3 | **Used and vintage resale**, graded and photographed | Budget- and sustainability-minded buyers | Per piece | `wear.` one-off listings | 30 pieces sold |
| 2.4 | **Custom embroidery**: Ink/Stitch designs on garments and merch, plus the design files | Teams, small brands, events | Per piece plus setup; design files sold separately | Odoo, `wear.` | 3 small-batch orders |
| 2.5 | **Sewing and patternmaking classes**: online, and in person as pop-ups | Beginners | Per class or per course | `learn.`, `live.` (pop-ups), Point of Sale | 1 course, 1 in-person class |
| 2.6 | **Capsule drops**: small, numbered collections sold live | Followers | Per piece | `live.` | 1 drop sells through |

**Why it works:** digital patterns sell again and again for the cost of drafting them once. Custom work and resale bring cash in while the brand grows. Every project already leaves a documented trail in `aLaMode-kb`, which becomes course material.

---

## 3. Technology (Ogun Tech Solutions)

| # | Business model | Who pays | Starting price to test | Runs on | First proof (90 days) |
|---|---|---|---|---|---|
| 3.1 | **Managed IT for small businesses (MSP)**: help desk, devices, backups, security baseline, monthly report | Offices with 3–25 people | Per user per month (common MSP pricing; check local competitors) with a set-up fee | Odoo (clients, contracts, recurring invoices, project tickets), Uptime Kuma, Tailscale, n8n reports | 2 retainer clients |
| 3.2 | **vCIO and network design**: assessments, roadmaps, network and Wi-Fi redesigns, using the homelab's runbook method | Growing small businesses, nonprofits | Fixed-price assessment, then a project quote | Odoo projects, document templates from `techdojo-ots` | 3 assessments |
| 3.3 | **Hosted business apps**: Odoo, n8n and the EFV Library run for clients, the way this server runs them for you | Small businesses that want Odoo without the IT | Monthly per app plus set-up | A separate client server per customer (never on your own KVM), managed over Tailscale | 1 hosted client |
| 3.4 | **Tech shop**: refurbished and new gear, homelab kits, network gear | Students, homelabbers, small offices | Per item | `shop.`, `finds.` for used gear | First 50 orders |
| 3.5 | **IT training**: homelab-to-career courses, certification study paths, runbook and change-control templates | Career changers, students | Per course; template packs as downloads | `learn.`, `shop.` | 1 course, 1 template pack |
| 3.6 | **The server itself as proof**: this KVM, documented in `techdojo-ots`, shown to employers and clients | Employers, clients | — | `dash.` showcase (guest access) | Portfolio page and dashboard live |

**Why it works:** managed IT is recurring, high-margin revenue. The homelab and this server are the proof that you run infrastructure properly. Hosted apps reuse exactly what you're building here.

**One rule:** client systems never run on your own KVM. Each client gets its own server, billed to them, so one client's problem can't touch your ventures or another client.

---

## 4. Geopolitical land development (the AP Project)

The AP Project's own guardrails apply. It's a conceptual planning, civic-design and education initiative. Its real-world paths stay within existing law: municipal incorporation and home rule, community land trusts, cooperatives, development authorities, compacts. Licensed counsel and financial advisers are needed where the work requires them. Parcel, ownership and stakeholder data stay private.

The business models here earn from the **planning and GIS skills** the project builds:

| # | Business model | Who pays | Starting price to test | Runs on | First proof (90 days) |
|---|---|---|---|---|---|
| 4.1 | **GIS and site-analysis services**: site-selection and land-use reports, maps and parcel research from public data | Small developers, nonprofits, churches, community groups | Fixed-price report per site; hourly for mapping | PostGIS + a map server on the KVM (private), Odoo projects and invoices | 3 paid site reports |
| 4.2 | **Community planning support**: surveys, public meetings, engagement reports and plan summaries | Municipalities, community development corporations, neighbourhood groups | Per engagement | Odoo Surveys and Events, `learn.` for public explainers | 1 engagement |
| 4.3 | **Grant and funding packages**: the maps, data and narrative behind grant applications (with grant writers or the client's own staff) | Community land trusts, nonprofits, local agencies | Per package | PostGIS maps, document templates | 2 packages delivered |
| 4.4 | **Education and heritage content**: Cahokia and American Bottom history, urban-planning basics, and the digital twin as video | General public, schools, heritage tourism | Free content plus paid courses, tours and talks; sponsorships | `learn.`, Cities: Skylines II and later Unreal footage | 1 course, a short video series |
| 4.5 | **Public data dashboards**: neighbourhood-level demographics, land use and infrastructure from public sources only | Local media, researchers, residents | Free to grow the audience; custom dashboards for paying clients | A public map site on the KVM | 1 public dashboard |
| 4.6 | **Long-term development work**: community land trust and cooperative projects, done with licensed partners | Investors and partners (through proper legal structures) | Not priced: depends on counsel, structures and regulation | Private project record | A first partner meeting with a clear, lawful structure |

**Why it works:** the AP Project builds real skills in GIS, data, planning and community engagement. Those skills sell to local organisations now, while the long-term vision develops slowly and lawfully with the right partners.

**New on the server for this area:**
- PostGIS, a Postgres extension in the shared database server;
- a small vector-tile map server (for example Martin);
- a MapLibre web map for public dashboards.

Together these use about 0.3–0.6 GB. Private parcel and stakeholder layers stay in the team zone behind sign-in.

---

## What to do first

| When | EFV | A La Mode | Ogun Tech Solutions | AP Project |
|---|---|---|---|---|
| **Months 0–3** | Tools beta (33 invites); 2 production clients | Machine basics; first pattern and muslin | 2 MSP clients; 3 assessments | GIS stack on the server; first site report |
| **Months 3–6** | Tools paid; first course | First capsule collection; lookbook site live | First hosted client; tech shop | Public dashboard; first engagement |
| **Months 6–12** | Blank copy licence; AI production packs | Second and third collections: new techniques, embroidery, 3D draping | Training course; template packs | Education series; grant packages |

**Start with:** Ogun Tech managed IT and EFV production packages. They bring cash in fastest and cost almost nothing to start. EFV Tools is the scalable product to build alongside them.

**Measure every month, per business area** (A La Mode is tracked by collections finished, not money):
- revenue and the number of paying customers;
- repeat customers;
- hours spent;
- one product metric each:
  - EFV: Tools subscribers;
  - A La Mode: pieces finished and collections showcased;
  - Ogun Tech: clients on retainer;
  - AP Project: reports delivered.

n8n collects these numbers onto the `dash.` dashboard.

---

## Running four businesses properly (basics, not advice)

- **Entities:** decide with an accountant whether each area is its own LLC or a trade name under one company. Odoo Community's multi-company setup keeps the books separate either way.
- **Money:** a separate bank account and Stripe account (or Stripe account per company) for each entity, bookkeeping in Odoo, and sales tax handled for physical and digital products where you sell.
- **Contracts:** standard agreements for production work, MSP clients (service levels, data handling), and consignment sellers.
- **Insurance:** general liability for in-person work and pop-ups; professional liability and cyber cover for the MSP work.
- **AP Project:** licensed counsel before any real land, trust or investment structure; nothing beyond public data goes public.

---

## On the landing page: four star systems

The universe grows from one solar system into **four star systems**, one per area. Each venture is a world in its area's system:

| System | Its worlds |
|---|---|
| EFV (a warm gold sun) | EFV, TOOLS, LEARN (creative courses), KB (hidden) |
| A La Mode (a rose-white sun) | One world per collection, and the lookbook |
| Ogun Tech Solutions (a blue-white sun) | SHOP, FINDS, IT services, DASH |
| AP Project (a deep red giant) | Public dashboard, heritage and education, the digital twin |

You'd fly between systems, and each opens into its own worlds.

---

## Decisions needed

1. **Entities:** one company with trade names, or a company per area.
2. **Which two models to start** (suggested: Ogun Tech managed IT and EFV production packages).
3. **The technology knowledge base's name:** you called it *techtheworld-ots*; the repository is `techdojo-ots`. Rename it, or keep the name?
4. **The landing page:** build the four-system universe now, or after the first ventures launch.
