# gift-for-aom-2026

This is the birthday web app. It runs in this order: password → gift box → messages → handwriting photos → ending → video download.

It's a plain static site with no frameworks and no `npm install`. The full design is in [PLAN.md](PLAN.md).

## Folders

```
birthday-app/
├── content/              ← YOU EDIT THIS
│   ├── messages.txt      the messages, one line per screen (ไปต่อ between them)
│   ├── bridge.txt        one short line shown before the photos (optional)
│   ├── ending.txt        last screen: first line is the title, the rest are small lines
│   ├── photos/           handwriting photos: 01.jpg, 02.jpg, … (1200 × 1600 px)
│   └── song/             one .mp3 or .m4a file
├── src/                  the app (HTML, CSS, JS, three.js); no need to touch
├── scripts/
│   ├── build.mjs         checks content/ and builds public/
│   └── deploy.mjs        deploys to staging or production with the Vercel CLI
├── vercel.json           Vercel build settings and cache headers
└── public/               build output (generated, don't edit)
```

## Adding your content by hand

### 1. Text on the black background
- Open `content/messages.txt` and write **one message per line**, in order. Each line is one screen, and she taps **ไปต่อ** to see the next.
- Lines starting with `#` are notes and are ignored. Empty lines are ignored too.
- The lines in there now are **placeholders**. Replace them with your own words.
- `bridge.txt` holds the single line before the photos. Delete its text to skip it.
- `ending.txt` holds the last screen: the first line is the big title, and the lines after it are small.

### 2. Handwriting photos
| | |
|---|---|
| **Size** | **1200 × 1600 px**, portrait **3:4** |
| **Format** | JPEG (`.jpg`), or PNG/WebP |
| **File size** | under 1 MB each, 1.5 MB at most |
| **Names** | `01.jpg`, `02.jpg`, `03.jpg`, … (they play in this order) |

- Each photo is shown for 4.5 s with a slow zoom and a crossfade. She can tap to pause.
- Photos are fitted without cropping, so other sizes work too. `npm run check` will warn you about them.
- Delete the `_placeholder-*.jpg` samples once your photos are in. They're only used while the folder has no real photos.

### 3. The song
- Put **one** `.mp3` or `.m4a` file in `content/song/`. Any file name works.
- 128–192 kbps is plenty, which comes to about 3–5 MB.
- It starts on the 10th gift tap and keeps playing through the messages, photos and the download page. It loops if it ends early.
- The downloaded video has the song too: it fades in at the start and fades out, with the picture, over the last 3 s.
- Use a copy you bought or own. Don't rip it from YouTube.

### Check your content
```bash
npm run check        # lists what it found and warns about photo sizes, missing song, etc.
npm run dev          # builds and serves http://localhost:3000 to try it yourself
```
The password is **21102001**, set in `src/app.js` as `PASSWORD`.

## Deploying (Vercel): staging and production

| Environment | URL | Who can open it | Use it for |
|---|---|---|---|
| **Staging** | `https://gift-for-aom-2026-staging.vercel.app` | Only you (Vercel login) | Checking every change on your iPhone and iPad |
| **Production** | `https://gift-for-aom-2026.vercel.app` | Anyone with the link | The link you send her |

Vercel runs `node scripts/build.mjs` and serves `public/`, as set in `vercel.json`. A build fails if `messages.txt` is empty, so a broken version never goes live.

### Option A: GitHub (automatic, recommended)
1. Push this folder to a GitHub repo named `gift-for-aom-2026`.
2. In Vercel, use **Add New → Project** and import the repo. Leave the framework preset as **Other**; the settings come from `vercel.json`.
3. Set **Production branch** to `main`.
4. Create a `staging` branch. In **Settings → Domains**, add `gift-for-aom-2026-staging.vercel.app` and assign it to the **`staging`** git branch.
5. After that:
   - Pushing to `staging` updates the staging URL.
   - Merging `staging` → `main` updates production.

### Option B: Vercel CLI from your computer
```bash
npx vercel login               # once
npm run deploy:staging         # preview deploy, aliased to the staging URL
npm run deploy:production      # asks you to type the project name to confirm
```
`deploy.mjs` checks your content first, links the folder to the `gift-for-aom-2026` project on its first run, then deploys.

### Privacy
- Staging previews are protected by Vercel Authentication by default, so only you can open them.
- Production is public to anyone with the link. It's marked `noindex`, so search engines won't list it.
- The date password only gates the screen. Someone who reads the page source could find it, and the photos are reachable by URL.

## On her phone
- **Best in:** Safari on iPhone and iPad, or Chrome on Android.
- **Haptics:** a light tick on each tap. iPhone needs iOS 18 or newer with System Haptics on.
- **Sound:** starts on the 10th gift tap. A speaker button in the top-right corner mutes it.
- **Video:** made on the phone in real time, so a 60 s video takes about 60 s. On iPhone it opens the share sheet so she can tap **Save Video** into Photos.
