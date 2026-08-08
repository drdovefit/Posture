# PostureLab

A local-first **posture analysis** web app. Upload or capture a photo and
PostureLab auto-detects your body landmarks, draws a plumb line and posture
lines curated to your stance, measures alignment, and scores it — all in the
browser. Nothing leaves your device.

Inspired by clinical postural-assessment tools (e.g. Bodiometer): front, side,
and back views, multiple biomechanical markers, progress tracking over time,
shareable reports, and a pain diary.

## Features

- **Upload or camera capture** with a live plumb-line alignment guide.
- **Three views** — side (lateral), front (anterior), back (posterior).
- **AI landmark detection** via MediaPipe Pose (33 points), mapped to clinical
  markers, then **drag any point** to fine-tune. Runs fully client-side; model
  and WASM are bundled for offline use.
- **Measurement engine** (pure, unit-tested):
  - Side: forward-head angle, trunk lean, hip/pelvis position, knee alignment,
    overall plumb alignment.
  - Front/back: head tilt, shoulder level, pelvic level, lateral body shift,
    knee valgus/varus.
  - Each metric graded good / mild / moderate with plain-language explanations
    and a normal reference range, combined into a **0–100 posture score**.
- **Corrective focus areas** — educational stretch/strengthen suggestions mapped
  from flagged findings.
- **Progress tracking** — history, score trend chart, before/after comparison.
- **Pain diary** — log discomfort by region/severity and chart it over time.
- **PDF report** — annotated image, measurements, and score, ready to share.
- **Multiple clients/profiles**, **dark mode**, **installable PWA** (offline).
- **Local-first storage** (IndexedDB via Dexie) — private, no account, no server.

## Tech stack

Vite · React · TypeScript · Tailwind CSS · MediaPipe Tasks-Vision · Dexie
(IndexedDB) · Recharts · jsPDF · vite-plugin-pwa.

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # production build
npm run preview    # preview the production build
npm test           # run the unit tests (Vitest)
```

Open the dev URL, pick a view, and upload a full-body photo.

### Photo tips for accurate results

- Full body in frame, plain background, even lighting.
- Camera at hip height, ~3 m away, held level.
- Fitted clothing so the shoulder/hip/knee/ankle joints are visible.

## Project structure

```
src/
  lib/
    types.ts             # domain types
    db.ts                # Dexie schema + helpers
    measure/             # pure geometry + per-view metrics + scoring (tested)
    pose/                # MediaPipe landmarker, 33→clinical mapping, overlay spec
    report/              # annotated-image renderer + PDF export
  components/            # PostureEditor (draggable overlay), ScoreRing, MetricList…
  features/
    dashboard/  analysis/  history/  pain/  capture/
  state/                # theme, active client, blob-url hooks
public/models/          # bundled MediaPipe .task model + WASM (offline)
```

## How auto-detection works

`PoseLandmarker` returns 33 normalized landmarks. `lib/pose/mapping.ts` selects
the clinically relevant ones per view (for side views it picks the more-visible
side; for front/back it orders each pair by screen position for intuitive
left/right readouts). If the model can't load or no body is found, the app drops
in draggable default points so you can place them manually. `lib/measure`
computes all angles/offsets from the (possibly hand-adjusted) landmarks.

## Privacy & disclaimer

All photos and data are stored only in your browser (IndexedDB) and never
uploaded. PostureLab is an **educational and self-tracking tool** — it does not
diagnose, treat, or replace assessment by a qualified healthcare professional.
Photo-based measurements are estimates that depend on camera angle and pose.

## Roadmap

- Optional cloud sync + clinician dashboard (the data model is kept
  id-based/sync-friendly for this).
- Angle arcs and per-segment numeric labels drawn on the overlay.
- Multi-view combined assessments and printable multi-page reports.
