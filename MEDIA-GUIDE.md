# MEDIA-GUIDE (beginner friendly)

**You only edit `index.html`.** Open it in Notepad or VS Code. At the very top there is a big note with a
list of sections. Press **Ctrl+F**, type a tag like `EDIT-1D`, and you jump straight to that section.
After saving, refresh the browser with **Ctrl+F5**.

## 1. Replace a file (picture, video, music)
1. Put your file inside the `assets` folder (pictures in `assets/img`, videos in `assets/video`, music in `assets/audio`).
2. In `index.html` write its name where the old one was, for example:
   `src="assets/img/old.svg"` becomes `src="assets/img/my-photo.jpg"`.
   (Or keep the old name: just replace the file with a new file that has the same name.)
- Use small letters, no spaces: `night-city.jpg`, not `Night City.JPG`.
- Pictures: JPG/PNG/WebP, about 1600 px wide. Videos: MP4 (under about 50 MB). Music: MP3.

## 2. Where is everything? (search the tag with Ctrl+F)
| Tag | What it controls |
|---|---|
| `EDIT-1A` | Logo and the tool icons (Photoshop, Premiere...) |
| `EDIT-1B` | Instagram / WhatsApp / Facebook / TikTok / e-mail links (change once, used everywhere) |
| `EDIT-1C` | Showreel video (the "Watch Showreel" button) |
| `EDIT-1D` | **Projects**: cards, titles, descriptions, tags, covers, videos, posters, gallery |
| `EDIT-1E` | Photography gallery photos |
| `EDIT-1F` | Background music and greeting voice (file, volume, timing) |
| `EDIT-2A` to `EDIT-2H` | Page text: intro, menu, hero + 3 floating cards, section titles, About, Contact, Footer |

## 3. Projects (`EDIT-1D`)
Each `<article class="project"> ... </article>` is one project. The order in the file is the order on the site.
- **Add:** copy one whole block (from `<article` to `</article>`), paste it right after, change the text and files.
- **Delete:** remove the whole block.
- **Reorder:** cut a whole block and paste it somewhere else.
- **Edit:** change the title (`<h3>`), the two descriptions (`lang="en"` and `lang="ar"`), the tags (`<li>`),
  the cover (`<img class="cover" src="...">`), the video (`<video src="..." poster="...">`) and the extra pictures (`<ul class="gallery">`).
- `data-type="video"` or `"photo"` decides the filter. `data-ratio` is now optional: the site reads the real size of your video or picture automatically (vertical 9:16, wide 16:9, square, photos in their natural shape). It is only used as a fallback if the file cannot be read.
- A photo project has **no** `<video>` line. A video project that has no video yet can also leave the `<video>` line out: visitors then see only the cover (no play button).
- Quotes, `&` and `<` in titles/descriptions are safe now. (Only the English/Arabic text you write is shown; titles and the small category label are shown as-is in both languages.)

Example, a new project:
```html
<article class="project" data-type="video" data-ratio="16:9" data-category="VIDEO EDITING">
  <h3>Wedding Film</h3>
  <p lang="en">A short cinematic wedding film.</p>
  <p lang="ar">فيلم زفاف سينمائي قصير.</p>
  <ul class="tags"><li>Premiere Pro</li><li>Color Grading</li></ul>
  <img class="cover" src="assets/img/wedding-cover.jpg" alt="Wedding Film">
  <video src="assets/video/wedding.mp4" poster=""></video>
  <ul class="gallery"><li><img src="assets/img/wedding-2.jpg" alt=""></li></ul>
</article>
```

## 4. Photos (`EDIT-1E`)
One line per photo (`data-cat` = portrait, street, nature or urban):
```html
<figure data-cat="nature"><img src="assets/img/mountain.jpg" alt="Mountain at sunrise"></figure>
```
Copy a line to add, delete a line to remove, move a line to reorder.

## 5. Arabic and English
Text between the tags is English. Arabic is written in `data-ar="..."` on the same tag:
```html
<h2 data-ar="أبرز المشاريع">Featured Projects</h2>
```
In projects use two paragraphs: `<p lang="en">` and `<p lang="ar">`.

## 6. Music and voice (`EDIT-1F`)
```html
<audio class="music" src="assets/audio/skyfall.mp3" data-volume="0.6" data-fade-in="3" data-start-at="0" loop></audio>
<audio class="voice" src="assets/audio/mo-media-greeting.mp3" data-start-at="3" data-duck-to="0.2" ...></audio>
```
- `data-volume` loudness 0 to 1 (0.6 = 60%). `data-fade-in` seconds of fade-in. `data-start-at` (music) = start the song from that second.
- Voice (**OFF until you add your recording**): record "Hello to MO MEDIA Portfolio", save it as `assets/audio/mo-media-greeting.mp3`,
  then in the `<audio class="voice" ...>` line change `data-enabled="no"` to `data-enabled="yes"`.
  While it says `no`, the site never asks for the file (no errors). If you say `yes` but the file is missing, the site still works; only the voice is skipped.
  `data-start-at` = seconds after the intro starts (3 = when the name appears). `data-duck-to` = how loud the music stays while you speak (0.2 = 20%).
  `data-duck-fade` / `data-restore-fade` = seconds to lower / restore the music. Pressing "Skip intro" cancels the voice.
- No music at all: delete the `<audio class="music" ...>` line.
- **Sound on phones/browsers:** browsers do not allow sound before the visitor touches the page. A small hint "Tap anywhere for sound" appears and the first tap starts the music (and the voice, if the intro is still playing). This is a browser rule for every website.

## 7. If something looks wrong
- A missing picture shows a dark placeholder; a missing video shows "Video file not found"; missing music/voice is skipped.
- Check the file name and the folder (small letters, same spelling).
- Press **Ctrl+Z** in your editor to undo your last change.

## 8. One-time setup before publishing (not daily editing)
1. Open `seo.config.json` and replace the whole `siteUrl` value with your real public address, for example
   `https://YOURNAME.github.io/YOUR-REPO/` (a normal repository) or `https://YOURNAME.github.io/` (a repository named `YOURNAME.github.io`).
   Until you do this the publish step stops on purpose (the "strict" check), so a half-finished site is never published.
2. On GitHub: **Settings > Pages > Build and deployment > Source = GitHub Actions**. Push your files to the `main` branch.
3. Wait for the green check in the **Actions** tab, then open your address. Links and e-mail are read from `index.html` (`EDIT-1B`), not from `seo.config.json`.
4. Replace the sample pictures/videos/texts marked "(Sample)" with your own work, and make sure you have the right to use the music file.
