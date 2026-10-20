# Birthday App: Implementation Plan

Current build: [Birthday Gift Box](https://claude.ai/artifact/7MP6tTZFub7tgE83U2yXtR). It covers the password screen, the gift box taps and the confetti. Everything below extends that page. The final version is **deployed on Vercel** (section 5), and the artifact stays as a quick preview.

## Flow

1. **Password**: unchanged. She enters 8 digits (21102001).
2. **Gift box**: unchanged. After 10 taps it opens with confetti. **The song starts on the last tap.**
3. **Fade to the content section.**
4. **Messages (3.1)**: sentences shown one at a time, each with a ไปต่อ button.
5. **Handwriting photos (3.2)**: an automatic slideshow.
6. **Ending screen**: a closing line plus a **ดาวน์โหลดวิดีโอ** button.

## Screenplay draft

This is a scene-by-scene draft of what she sees, hears and does. Times are approximate. **The Thai lines in scene 4 are placeholders** for Tawan to rewrite in their own words.

| # | Scene | On screen | She does | Sound | Moves on when |
|---|---|---|---|---|---|
| 1 | **Password** | Black screen. ใส่วันเกิดของคุณ (ววดดปปปป), eight boxes, keypad | Types 21102001 | Haptic tick on each key | Correct date: boxes glow purple, then a 0.9 s fade |
| 2 | **Gift box** | White, blue and purple gift with a soft glow and twinkles. กดซ้ำๆเพื่อเปิดกล่องของขวัญของคุณ, progress bar | Taps 10 times. The box grows, wobbles, and the lid hops | Haptic on each tap | 10th tap |
| 3 | **Opening** | Flash, the lid floats off, confetti bursts out, side cannons fire, then rain | Watches | **Song starts** and fades in over 2 s | After about 4.5 s, fade to black |
| 4 | **Messages** | One line at a time on black, with ไปต่อ below each | Taps ไปต่อ | Song continues | After the last line |
| 5 | **Bridge** | "ของขวัญชิ้นนี้ทำด้วยมือของเราเอง" fades in, then out | Waits 2.5 s | Song continues | Automatically |
| 6 | **Handwriting photos** | Photos crossfade with a slow zoom, about 4 s each, with a thin progress bar | Can tap to pause or resume | Song continues | After the last photo |
| 7 | **Ending** | "สุขสันต์วันเกิดนะ" plus a short sign-off, and a ดาวน์โหลดวิดีโอ button | Taps download, or just stays | Song fades to a low volume | Stays here |
| 8 | **Making the video** | A progress ring with "กำลังสร้างวิดีโอ…" and a percentage | Waits about as long as the video | Muted on screen while recording | Share sheet or Save Video |

### Scene 4: draft lines (placeholders, replace with your own)

1. สุขสันต์วันเกิดนะ คนเก่งของเรา
2. ขอบคุณที่เกิดมา และขอบคุณที่เลือกอยู่ข้างกันทุกวัน
3. ทุกวินาทีที่มีเธอ เป็นวินาทีที่เราอยากเก็บไว้ตลอดไป
4. ปีนี้ขอให้เธอยิ้มเยอะๆ ได้ทำสิ่งที่รัก และไม่ต้องเหนื่อยคนเดียว
5. เราเตรียมของขวัญเล็กๆ ไว้ให้ ทำด้วยมือทุกชิ้นเลยนะ
6. ไปดูกันเลย →

(The last line's button can read ไปดูกัน instead of ไปต่อ.)

### Scene 7: draft sign-off

> สุขสันต์วันเกิดนะ
> รักเธอที่สุด — Tawan

### The downloaded video (scene 8 output)

| Time | Shows |
|---|---|
| 0–3 s | Title card: "สุขสันต์วันเกิด" with a small gift icon |
| 3 s per line | Each scene 4 line as its own card |
| 2.5 s | Bridge line |
| 4 s per photo | Each handwriting photo with the slow zoom |
| last 3 s | Sign-off card, as the song fades out |

## 1. Messages (3.1)

- Plain black background with Mitr text, matching the current placeholder.
- Each sentence fades and rises in gently. The ไปต่อ button appears about 0.8 s later, so she reads before tapping.
- Tapping ไปต่อ fades the current sentence out and brings the next one in. A soft haptic plays on each tap, using the same iPhone and Android trick as now.
- A few faint twinkles from the gift scene drift in the background (three.js) to keep the look consistent.
- After the last sentence, ไปต่อ leads into the photos.
- **Needed from Tawan:** the sentences, in order.

## 2. Handwriting photos (3.2)

- The photos play automatically, about 4 s each. Each one crossfades into the next with a slow zoom (Ken Burns style).
- Each photo is fitted to the screen without cropping the handwriting, on black, for both portrait iPhone and landscape iPad.
- A thin continuous progress bar runs along the bottom, in the same blue-to-purple style as the gift meter.
- Tapping pauses or resumes, in case she wants to read a page longer.
- Photos are resized to about 1600 px on the long side and compressed to JPEG/WebP, then published as files alongside the page so it loads quickly.
- **Needed from Tawan:** the photos uploaded in this thread, in order.

## 3. Music (เซปโตวินาที by Asia7), sound only

There is no visible player, only sound. YouTube's rules don't allow playing its audio with the player hidden, so the song comes from an **audio file Tawan supplies** (for example a copy they bought or own). It is hosted with the site on Vercel, for a private gift only. I won't pull audio from YouTube.

**How it works**
- The file is `audio/septo.mp3` (or `.m4a`), played through Web Audio. It's preloaded while she's on the password screen.
- It starts on the **10th gift tap**, inside the tap handler, since iPhone only allows audio after a tap. It fades in over about 2 s.
- It plays through 3.1 and 3.2. It loops with a short crossfade if it ends early, and fades out at the ending screen.
- The only UI is a tiny speaker icon in a corner (mute/unmute), clear of the iPhone safe areas.
- Because it's a real audio file, **the same song goes into the downloaded video** too.
- If the file fails to load, the page carries on silently.
- The artifact preview can use the same file, published alongside the page.

**Needed from Tawan:** the song as an MP3 or M4A file, uploaded in this thread.

## 4. Video download

The ending screen has a **ดาวน์โหลดวิดีโอ** button. It makes a video of the messages and photos with the song, built on her own device.

**How it works**
1. When she taps the button, the page draws the video on a hidden canvas at 1080×1920 (portrait, for sharing to Stories).
   - The video opens with a title card, then each message as its own card for about 3 s, then each photo for about 4 s with the same crossfade and zoom.
2. The canvas and the song (mixed through Web Audio) are recorded together with `MediaRecorder`.
   - Safari on iPhone and iPad produces **MP4 (H.264/AAC)**. Chrome produces WebM, or MP4 where it is supported.
3. Recording happens in real time, so a 60 s video takes about 60 s to make. A progress ring shows "กำลังสร้างวิดีโอ…" with a percentage.
4. When it finishes:
   - On **iPhone/iPad**, the page opens the share sheet (`navigator.share({ files: [video] })`) so she can tap **Save Video** straight into Photos.
   - On **other browsers**, a normal `<a download>` link saves the file.
   - Both work on the Vercel site. The artifact preview would need its `downloads` capability instead.

**Notes and risks**
- The video length depends on the content. Roughly 3 s × messages + 4 s × photos + 3 s for the intro and outro. For example, 8 messages and 10 photos come to about 70 s.
- The song is trimmed to the video length and fades out at the end.
- File size is about 15–30 MB at 1080p, 6 Mbps. If saving hits a size limit, it falls back to 720p.
- An optional speed-up is to use WebCodecs plus an MP4 muxer, which makes the video faster than real time on newer devices. This is only worth adding if the real-time wait feels too long in testing.
- If the screen locks it would interrupt recording, so the page requests a screen wake lock while it records.

## 5. Deployment (Vercel)

- **Structure:** a plain static site with no build step:
  - `index.html`: the page with inline CSS/JS
  - `photos/`: the compressed handwriting images
  - `audio/`: the song file
  - `vendor/three.min.js`: self-hosted, so the page doesn't depend on a CDN
- The files live in the project's shared folder under `birthday-app/site/`, so every thread works on the same copy.
- **Deploy:** a Vercel static project with the framework preset "Other" and no build command. It goes up from this project through the Vercel connection, or Tawan can push it to a GitHub repo that Vercel deploys on every push. The default is a direct deploy, with GitHub optional.
- **URL:** the free `*.vercel.app` address, e.g. `hbd-xxxx.vercel.app`, or a custom domain if Tawan has one.
- **Headers** (`vercel.json`): long cache for `photos/`, `audio/` and `vendor/`, and no cache for `index.html`, so fixes show up right away.
- **Privacy:** the date password only gates the screen. Anyone who reads the page source could find it, and the photos are reachable by URL. That's fine for a surprise, but don't put anything truly private in it. The deployment can also be kept unlisted (no search indexing via `<meta name="robots" content="noindex">`).
- **Preview first:** each change is checked on a Vercel preview URL on a real iPhone and iPad before it goes to the production URL she'll get.

## 6. Build order

1. Move the current page into `birthday-app/site/` and do a first Vercel deploy. This proves the pipeline and gives the real URL.
2. Add the music on the last gift tap, plus the mute icon. *(needs the audio file)*
3. Build the messages section with ไปต่อ. *(needs the sentences)*
4. Build the photo slideshow. *(needs the photos)*
5. Add the ending screen and the video export, then test on iPhone Safari and iPad Safari via the preview URL.
6. Final polish, promote to production, and send her the link.

## Open questions for Tawan

- **Ending line:** what should the closing screen say? The default is "สุขสันต์วันเกิดนะ".
- **Video orientation:** the default is **portrait 9:16**. Square 1:1 is the other option.
- **Video contents:** should the video include the opening gift box and confetti too? The default is **no**, only messages and photos.
