# savoyaground/home

Code for the savoya.com Home page. Webflow keeps the page; this repo keeps its code.
Files are served through jsDelivr, always pinned to a **full** commit hash.

## Files

| File | Where it loads | What it does |
|---|---|---|
| `home.css` | Home → Head (stylesheet) | Hero video layer, slider track, hidden scrollbars on scroll rows, list text size on iOS, hidden reCAPTCHA badge |
| `home.js` | Home → Footer (`defer`) | 1 Vehicle selector · 2 Stat icons · 3 Count-ups · 4 Sliders · 5 Review schema |
| `img/stat-*.webp` | loaded by `home.js` on phones/tablets | Still versions of the 4 Lordicon stat icons (96×96) |
| `webflow/home-head.html` | paste into Home → Page settings → Custom code → Head | Inline hero fade + hero video script, then links |
| `webflow/home-footer.html` | paste into Home → Footer | Vehicle selector CSS + `home.js` |
| `webflow/home-faq-schema.json` | Home → Page settings → Schema markup (JSON-LD) | FAQ rich results |

### Why two things stay inline in Webflow
- **Hero fade CSS** – the headline is the page's LCP element; it must show before any file arrives.
- **Hero video script** – must act before the video starts downloading. Phones/tablets (≤991px) get no
  video; desktop plays the 2.9 MB HubSpot file (`www2.savoya.com/hubfs/Website/Heros/savoya-hero-1280-web.mp4`)
  instead of Webflow's 6 MB re-encode.

## What `home.js` depends on in Webflow

| Section | Classes it looks for | Loads |
|---|---|---|
| Vehicle selector | `.vehicle-showcase` | Swiper 11 + `savoyaground/swiper@e690f04…/vehicle-selection-v1.js`, within 800px of the section |
| Stat icons | `.statbar-icon-block lord-icon.lordicon-dynamic` | Phones/tablets: `img/stat-*.webp`. Desktop: `core@7732114…/lordicons.js` after first interaction |
| Count-ups | `.countup2`, triggered by `.service-area` | — |
| Sliders | `.slider1` How We Do It · `.slider2` Testimonials · `.slider3` Chauffeur spotlight · `.slider4` Service areas | Splide 4.0.7, within 600px of a slider |
| Review schema | `.review-schema[data-author][data-review]` | — (one Review JSON-LD per card; Splide clones are created later, so they aren't counted) |

`window.SavoyaIcons` is the only global it sets (core/lordicons.js reads it).
If one section throws, it logs `[home] … failed` and the others still run.

## Updating
1. Edit, commit, push.
2. Copy the full commit hash (`git rev-parse HEAD`).
3. In Webflow, replace the hash in the Home head and footer tags (both point at the same commit).
4. Publish to staging, hard refresh, check 1280px and 390px.

## Removed in the Oct 28, 2026 cleanup (nothing on Home used them)
- Footer hero-video loader for `.bg-video-desktop__media[data-src]` and its CSS, `.hero-content` CSS
- Count-ups for `.countup`, `.counter` and the `.stats-section` observer
- Finsweet CMS Tabs (no `fs-cmstabs` elements on Home)
- `.primary-btn-txt` and `.hs-input` overrides (no matching elements; HubSpot forms render in iframes)
- jQuery use in the slider setup
- 25 KB of base64 icon images (now `img/*.webp`)
- Home's own Organization schema (the site-wide one in Site settings covers it)
