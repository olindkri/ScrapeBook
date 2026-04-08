# ScrapeBook

A web app for arranging small images on A4 pages for scrapbook printing. Users place, move, and resize images, auto-pack them for minimal waste, then print from the browser.

**Live:** https://scrapebook-app.web.app
**Firebase Console:** https://console.firebase.google.com/project/scrapebook-app

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| State | Zustand |
| Drag/Resize | react-rnd |
| Bin Packing | maxrects-packer |
| Auth | Firebase Auth (email/password) |
| Database | Firestore (Spark/free plan) |
| Hosting | Firebase Hosting |
| Styling | CSS Modules |

No backend server. No Firebase Storage (avoided to stay on free plan). Images are compressed client-side and stored as base64 in Firestore.

## Architecture

### Key Design Decisions

- **All coordinates/dimensions in millimeters.** Screen display multiplies by a `scaleFactor` (px/mm). Print output uses mm directly. This ensures 1:1 physical accuracy when printing.
- **Two render layers per page:** An interactive layer (react-rnd, scaled pixels) visible on screen, and a print layer (absolute positioning in mm) visible only during print. They never interfere.
- **Images stored as base64 in Firestore**, not Firebase Storage. Each image is its own document in a subcollection (stays under 1MB/doc). Images are compressed to JPEG quality 0.7 and max 1200px before storage.
- **Explicit save** with auto-save every 60s. Not real-time sync — avoids excessive Firestore writes from drag/resize.

### Data Flow

```
User adds image file
  → blob URL created for instant preview
  → compressImageToBase64() runs in background
  → base64 stored in Zustand state
  → On save: base64 written to Firestore subcollection
  → On load: base64 fetched and used as img src
```

### Firestore Data Model

```
users/{userId}/projects/{projectId}
  ├── name, status, createdAt, updatedAt
  ├── pages: [{ id, order, images: [{ id, x, y, width, height, naturalWidth, naturalHeight }] }]
  └── /images/{imageId}          ← subcollection
        └── base64: string       ← compressed JPEG data URL
```

Project metadata (positions/sizes) is in the project document. Image pixel data is in a subcollection (one doc per image) to stay under Firestore's 1MB/doc limit.

### Security Rules

Firestore rules enforce user-scoped access: users can only read/write their own `users/{userId}/projects/**` path. Auth UID must match the path.

## File Structure

```
src/
  main.tsx                          # Entry: Firebase init, AuthGate wrapper
  App.tsx                           # Router: ProjectList or Editor, auto-save, keyboard shortcuts
  App.module.css

  firebase/
    config.ts                       # Firebase app/auth/db initialization (env vars)
    auth.ts                         # signIn, signUp, logOut wrappers
    firestore.ts                    # Project CRUD, image subcollection, batched writes

  store/
    useStore.ts                     # Zustand: all state + actions (project, page, image management)

  hooks/
    useAuth.ts                      # onAuthStateChanged → { user, loading }
    useResponsiveScale.ts           # Dynamic scale: 3 on desktop, fits viewport on mobile

  components/
    Auth/
      AuthGate.tsx                  # Loading → LoginForm → children
      LoginForm.tsx                 # Email/password with sign-in/register toggle
    ProjectList/
      ProjectList.tsx               # List, create, delete, open projects
    Toolbar/
      Toolbar.tsx                   # Back, Add Images, Add Page, Save, Print
    PageCanvas/
      PageCanvas.tsx                # A4 container with print + interactive layers
    ImageItem/
      ImageItem.tsx                 # react-rnd wrapper: drag, resize, delete

  lib/
    types.ts                        # ScrapeBookImage, Page, Project interfaces
    constants.ts                    # A4 dimensions (210×297mm), default scale, image size
    imageUtils.ts                   # compressImageToBase64 (max 1200px, JPEG 0.7)
    packing.ts                      # MaxRectsPacker wrapper: autoPackImages → { packed, overflow }

  styles/
    global.css                      # Reset, safe-area insets, system fonts
    print.css                       # @page A4, margin 0
```

## Development

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
firebase deploy      # Deploy hosting + Firestore rules
```

Environment variables in `.env.local` (not committed):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=scrapebook-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=scrapebook-app
VITE_FIREBASE_STORAGE_BUCKET=scrapebook-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Mobile Responsiveness

- **Desktop (≥768px):** scale factor = 3 (A4 renders at 630×891px)
- **Mobile (<768px):** scale = `(viewportWidth - 32) / 210`, canvas fits screen
- `touch-action: none` on draggable elements for iOS Safari
- Safe area insets via `env(safe-area-inset-*)`
- Toolbar wraps to two rows on narrow screens
- Delete button enlarged to 30×30px on mobile for touch targets

## Print System

Print uses a completely separate render path:
- `@page { size: A4 portrait; margin: 0 }`
- Interactive layer hidden, print layer shown
- Print layer uses mm units directly: `left: Xmm; top: Ymm; width: Wmm; height: Hmm`
- Toolbar/controls hidden via `@media print`
- `page-break-after: always` between pages

## Constraints & Limits

- **Firestore free tier:** 1GB storage, 50K reads/day, 20K writes/day
- **Image compression:** Max 1200px dimension, JPEG quality 0.7 (~50-200KB per image as base64)
- **Firestore doc limit:** 1MB — images are in subcollection to avoid this
- **Batch writes:** 400 per batch (Firestore limit is 500)
- **No Firebase Storage** — project uses Spark (free) plan only
