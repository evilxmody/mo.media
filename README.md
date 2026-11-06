# MO MEDIA — Mohamed Elsayed | Portfolio

## Deploy on GitHub Pages + Google SEO (read this first)

**Nothing is invented:** your real GitHub Pages URL and your social profile URLs were not provided yet, so `seo.config.json` has clearly marked `REPLACE_...` placeholders. Until `siteUrl` is set, canonical / og:url / og:image / JSON-LD / `sitemap.xml` are intentionally NOT generated (so no wrong URL can be indexed).

### 1) Fill `seo.config.json` once (site address + SEO texts). Social links and e-mail are now read from `index.html` [EDIT-1B]
- `siteUrl` — your public site URL, with a trailing slash:
  - repo named `USERNAME.github.io` → `https://USERNAME.github.io/`
  - any other repo `REPO` → `https://USERNAME.github.io/REPO/`
  - (never the `github.com/...` repository address)
- `social.instagram / facebook / tiktok / whatsapp` — your official profile URLs (WhatsApp as `https://wa.me/COUNTRYCODENUMBER`). Leave `REPLACE_...` for an account you do not have: it is omitted everywhere.
- `email` (optional public contact email). `title`, `description`, `country` are already set.

### 2) Generate the SEO files
`node tools/apply-seo.mjs` (Node 18+, no installs). It writes: the `<head>` SEO block in `index.html` (title, description, canonical, Open Graph, Twitter card, favicons, JSON-LD `WebSite` + `Organization` + `Person`), the visible social links in `js/data.js`, `robots.txt`, `sitemap.xml`, `404.html`, `.nojekyll`. Re-run it whenever you change `seo.config.json`.

### 3) Publish
**A. GitHub Actions (recommended).** Create a repo, upload the *contents* of this folder (so `index.html` is at the repo root, including the hidden `.github` folder). Settings → Pages → Build and deployment → Source: **GitHub Actions**. Every push to `main` runs the script in strict mode (fails with a clear message while `siteUrl` is still a placeholder) and deploys.
**B. Deploy from a branch.** Run step 2 locally, commit everything (including generated `robots.txt`, `sitemap.xml`, `404.html`), then Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.

The site uses relative paths, so it works under `https://USERNAME.github.io/REPO/` (tested by serving it under a sub-path), no server routing is used, and `404.html` is the GitHub Pages error page (it is `noindex` on purpose).

### 4) Google Search Console
1. Open Search Console → **Add property** → **URL prefix** → paste your exact `siteUrl` (the Domain option needs DNS access, which `github.io` does not give you).
2. Verify with the **HTML tag** method: copy the `content` value of the `google-site-verification` meta tag into `googleSiteVerification` in `seo.config.json`, run step 2, deploy, then click **Verify**. Keep the tag in place.
3. **Sitemaps** → enter `sitemap.xml` → **Submit**. Important: crawlers read `robots.txt` only at the host root, and for a project site (`USERNAME.github.io/REPO/`) that root file belongs to a different repo, so the `Sitemap:` line in this `robots.txt` is not discovered there — submit the sitemap manually as above. (A `USERNAME.github.io` repo or a custom domain does serve it at the root.)
4. **URL Inspection** → paste the homepage URL → **Test live URL** → **Request indexing**.
5. Check **Pages** (indexing) later. Indexing and ranking take time (days to weeks) and are not guaranteed by any setting here.

### 5) Custom domain later
Change only `siteUrl` to the new domain, re-run step 2 (canonical, og:url, og:image, JSON-LD, sitemap, robots and 404 all regenerate), add the `CNAME`/custom-domain setting and DNS records in GitHub Pages, add a **new** Search Console property for the new URL (new verification token → `googleSiteVerification`), submit the new `sitemap.xml`, request indexing, and update the website link in your Instagram / Facebook / TikTok profiles.

### Brand + social tips
- `sameAs` lists only Instagram, Facebook and TikTok (public profiles). WhatsApp is a contact link, so it is shown on the site but not in `sameAs`.
- Put the site URL in each social bio/website field and use "MO MEDIA" + "Mohamed Elsayed" the same way everywhere — this is what connects the profiles to the site. Open Graph tags control link previews, they do not link profiles by themselves.
- The Arabic text is switched by JavaScript; the HTML that is crawled is the English default.

---

Static project, no build step. GSAP, ScrollTrigger, Three.js and Lenis load from jsDelivr (optional: if blocked, the site still works with CSS fallbacks).

## Run
Double-click `index.html`, or `python3 -m http.server 5173` and open http://localhost:5173

## Where to replace things
- **All content** → `index.html` only (name, links, contact, showreel, projects, gallery, music, Arabic/English text). Beginner steps: **MEDIA-GUIDE.md**. `js/data.js` is just the loader that reads those HTML blocks; do not edit it.
- **Images** → `assets/img/` (covers, gallery, `portrait.svg` = About photo). Any JPG/PNG/WebP/SVG; write the file name in `index.html`.
- **Videos** → `assets/video/` (MP4/WebM). `sample-*.webm` are test clips: delete/replace. Set `video:'assets/video/yours.mp4'`.
- **Social icons** → `assets/icons/` (instagram, whatsapp, facebook, tiktok). **Software icons** → photoshop, premiere-pro, after-effects, capcut (same folder). Social URLs: `links` in `js/data.js` (empty = icon shown disabled).
- **Logo** → `assets/logo/mo-media.png`. **CapCut icon** → `assets/icons/capcut.png`. Ps/Pr/Ae tiles are in `ICONS` (`js/main.js`).
- **UI text EN/AR** → `I18N` in `js/main.js`. **Colors** → `:root` in `css/style.css`. **Space art** → `assets/space/` (nebula.jpg, planet.png, rock*.png).

## Notes
Intro plays on every load (setting in `index.html` [EDIT-1A]), has Skip, a 3-layer failsafe, and a calm version for reduced-motion. Do not autoplay: videos start only when the user presses play.

## Space scene (hero) — where things live
- Moon / Earth: CSS layers (no WebGL needed). Surfaces slide slowly behind a fixed light overlay, so lighting never rotates. Textures: `assets/space/moon-tex.jpg`, `earth-tex.jpg`, `earth-clouds.png`; lighting: `moon-shade.png`, `earth-shade.png`. Rotation speeds: `.mtex`, `.etex`, `.ecl` in `css/style.css` (seconds per cycle).
- Rings: SVG in `index.html` (`.r1 .r2 .r3` around the moon, `.r4` around Earth); each has its own keyframes (`k1–k4`) and duration, so they never move in sync.
- Shooting stars: canvas `#shoot` (script block "Random shooting stars" in `js/main.js`; interval `R(3500,11000)` ms, max 2 at once, fewer/slower on phones).
- Reduced motion: moon/Earth/rings stay still and shooting stars are off.
