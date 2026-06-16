# Media & Storage Guide

> **Audience:** Developers building client projects (Next.js, React, or Node.js) that use the ECOD backend for media storage, image optimisation, and file delivery.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Client Project                               │
│   (nirvisham / any-other / Node script / automation)            │
├──────────────────────────────────────────────────────────────────┤
│              @ecodrix/erix-api  (SDK)                           │
│         ecod.media.*  /  ecod.storage.*                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP  (x-api-key + x-client-code)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                  ECOD Backend  (this repo)                       │
│  POST /api/saas/images          ← upload + optimize              │
│  GET  /api/saas/storage/files   ← list files                    │
│  POST /api/saas/storage/upload-url + /confirm-upload            │
│       ↕ presigned PUT (goes directly to R2, no proxy)           │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│            Cloudflare R2  (object storage)                       │
│  Every tenant bucket is isolated:  tenants/{CLIENT_CODE}/...     │
│                                                                  │
│  Image served via CDN:                                           │
│  https://cdn.domain.com/{key}                                    │
│                                                                  │
│  Image served via Cloudflare transformation:                     │
│  https://cdn.domain.com/cdn-cgi/image/width=150,format=auto/{key}
└──────────────────────────────────────────────────────────────────┘
```

---

## What the Backend Returns — Media Response Shape

Every upload or list endpoint now returns a **consistent shape** for all media types:

```ts
interface MediaMeta {
  url: string;          // Raw CDN URL — always present, all types
  type: MediaType;      // "image" | "video" | "audio" | "document"
  variants?: {          // ONLY for images. undefined for video/audio/docs.
    thumb:  string;     // 150px WebP — list thumbnails, chat bubbles
    medium: string;     // 600px WebP — modal previews, product cards
    full:   string;     // 1200px WebP — hero sections, lightbox
    raw:    string;     // Original CDN URL, no transformation
  };
}
```

### Why `variants` is image-only

Cloudflare `/cdn-cgi/image/` only transforms **raster images** (JPEG, PNG, WebP, AVIF, GIF).
Video, audio, and documents are served directly from R2 via the CDN — no transformation possible.

| Media | variants? | How to display |
|-------|-----------|---------------|
| JPEG / PNG / WebP / AVIF / GIF | ✅ Yes | `<img src={variants.thumb}>` |
| SVG | ❌ No (vector) | `<img src={url}>` |
| MP4 / WebM / MOV | ❌ No | `<video src={url}>` |
| MP3 / OGG / WAV / AAC | ❌ No | `<audio src={url}>` |
| PDF / DOCX / ZIP | ❌ No | `<a href={url}>Download</a>` |

---

## SDK Quick Start

### 1. Install the package

```bash
pnpm add @ecodrix/erix-api
```

### 2. Create the client — once, at app startup

```ts
// lib/ecod.ts  (or lib/erix.ts — wherever you keep singletons)
import { Ecodrix } from "@ecodrix/erix-api";

export const ecod = new Ecodrix({
  apiKey:     process.env.ECOD_API_KEY!,
  clientCode: process.env.ECOD_CLIENT_CODE!,
  baseUrl:    process.env.ECOD_API_URL,   // optional, defaults to https://api.ecodrix.com
});
```

### 3. Environment variables (`.env`)

```bash
# Required
ECOD_API_KEY=your_api_key_here
ECOD_CLIENT_CODE=ERIX_CLNT_XXXXXX

# Optional — override if using a self-hosted backend
ECOD_API_URL=https://api.ecodrix.com
```

---

## Media Operations

### Upload a file (any type) — `ecod.media.upload()`

This is the **recommended** path. It orchestrates the presigned upload transparently:

1. Asks the backend for a short-lived `PUT` URL
2. Uploads **directly to R2** (bypasses the API — maximum throughput)
3. Confirms the upload with the backend (quota tracking, audit log)

```ts
import { readFileSync } from "fs";
import { ecod } from "@/lib/ecod";

// Node.js — Buffer
const buffer = readFileSync("./invoice.pdf");
const { data } = await ecod.media.upload(buffer, {
  folder:      "invoices",
  filename:    "invoice-april-2026.pdf",
  contentType: "application/pdf",
});

console.log(data.url);  // → https://cdn.domain.com/tenants/CLNT/invoices/invoice-april-2026.pdf
console.log(data.type); // → "document"
// data.variants is undefined — PDFs cannot be Cloudflare-transformed
```

```ts
// Browser — File object from <input type="file">
const file = inputRef.current.files[0];
const { data } = await ecod.media.upload(file, {
  folder:      "avatars",
  filename:    file.name,
  contentType: file.type,
});

console.log(data.variants?.thumb);  // → 150px WebP via Cloudflare (if image)
console.log(data.type);             // → "image"
```

---

### Upload via backend proxy — `POST /api/saas/images`

Use this when the SDK is not available (e.g. a raw `fetch` call from a Next.js API route or a browser form).

```ts
// Next.js API route  (app/api/upload/route.ts)
export async function POST(request: Request) {
  const formData = await request.formData();

  const res = await fetch(`${process.env.ECOD_API_URL}/api/saas/images`, {
    method: "POST",
    headers: {
      "x-api-key":     process.env.ECOD_API_KEY!,
      "x-client-code": process.env.ECOD_CLIENT_CODE!,
      // Do NOT set Content-Type — let fetch set the boundary for multipart
    },
    body: formData,
  });

  const json = await res.json();
  // json.data is an array: MediaMeta[]
  // { url, type, variants?, name, fileName, key }
  const item = Array.isArray(json.data) ? json.data[0] : json.data;
  return Response.json({ success: true, ...item });
}
```

> [!IMPORTANT]
> Do **NOT** strip the response to just `{ url }`. Always forward the full `item` object
> so calling components can access `variants` for Cloudflare-optimised delivery.

---

### List files in a folder

```ts
// Returns: { files: MediaMeta[], count, totalSizeBytes }
const { data } = await ecod.media.list("products");

for (const file of data.files) {
  if (file.type === "image") {
    console.log(file.variants?.thumb); // Cloudflare 150px WebP
  } else {
    console.log(file.url); // raw CDN for video/audio/doc
  }
}
```

With date sharding (folders that use YYYY/MM structure):

```ts
const { data } = await ecod.storage.files.list("whatsapp", { year: "2026", month: "04" });
```

---

### Delete a file

```ts
await ecod.media.delete("tenants/CLNT/products/banner.jpg");
// or via storage resource
await ecod.storage.files.delete("tenants/CLNT/invoices/old.pdf");
```

---

### Presigned download URL (private files)

```ts
const { data } = await ecod.media.getDownloadUrl("tenants/CLNT/private/report.pdf");
// data.downloadUrl is time-limited (expires)
window.open(data.downloadUrl);
```

---

### Check storage quota

```ts
const { data } = await ecod.media.getUsage();
// { usedBytes, quotaBytes, usagePercent, folders[], isSuspended }
console.log(`${(data.usedBytes / 1024 / 1024).toFixed(1)} MB used`);
```

---

## Using `variants` in UI Components

### In React / Next.js

```tsx
interface MediaMeta {
  url:      string;
  type:     "image" | "video" | "audio" | "document";
  variants?: { thumb: string; medium: string; full: string; raw: string };
}

function MediaPreview({ item }: { item: MediaMeta }) {
  if (item.type === "image") {
    return (
      <img
        src={item.variants?.thumb ?? item.url}    // Cloudflare 150px WebP
        srcSet={`
          ${item.variants?.thumb ?? item.url}  150w,
          ${item.variants?.medium ?? item.url} 600w,
          ${item.variants?.full ?? item.url}  1200w
        `}
        sizes="(max-width: 640px) 150px, (max-width: 1024px) 600px, 1200px"
        alt=""
        loading="lazy"
      />
    );
  }

  if (item.type === "video") {
    return <video src={item.url} controls />;
  }

  if (item.type === "audio") {
    return <audio src={item.url} controls />;
  }

  // document
  return <a href={item.url} target="_blank" rel="noreferrer">Download</a>;
}
```

### Picking the right variant

| Use case | Variant |
|----------|---------|
| Image library grid, chat bubble | `variants.thumb` (150px) |
| Product card, modal preview | `variants.medium` (600px) |
| Hero, lightbox, detail view | `variants.full` (1200px) |
| Downloaded / saved to DB | `url` or `variants.raw` |
| Legacy fallback (no variants) | `url` |

Always use `variants?.thumb ?? url` (with optional chaining + null coalesce) so legacy uploads and non-image media fall back gracefully to the raw URL.

---

## WhatsApp Chat Media (special case)

WhatsApp chat uploads use a separate endpoint: `POST /api/saas/chat/upload`.

This endpoint is called by `message-input.tsx` automatically via the in-app `erix` client. The response shape is the same `MediaMeta` object, so the inbox components handle all types:

```
Upload flow:
  message-input → POST /api/saas/chat/upload
                ← { url, type, variants? }
                                      ↓ image?      ↓ video/audio/doc?
                              variants.thumb        url (raw CDN)
                              in chat bubble        in chat bubble
```

Inbound media (from the customer's phone) is processed in the background by `whatsapp.service.ts`. It downloads the media from Meta, optimises it via Sharp, and uploads it to R2. The final URL is emitted via a `message_updated` socket event. The frontend handles this as a `mediaUrl` without variants (since the R2 key is not re-surfaced in the socket event).

---

## Adding a New Client Project

Follow these steps to connect any new Next.js / Node.js project to the ECOD media backend.

### Step 1 — Install the SDK

```bash
pnpm add @ecodrix/erix-api
```

### Step 2 — Add environment variables

```bash
# .env.local  (Next.js) or  .env  (Node)
ECOD_API_KEY=your_api_key           # from ECOD Dashboard → Settings → API Keys
ECOD_CLIENT_CODE=ERIX_CLNT_XXXXXX  # your tenant code
ECOD_API_URL=https://api.ecodrix.com
```

### Step 3 — Create the singleton client

```ts
// src/lib/ecod.ts
import { Ecodrix } from "@ecodrix/erix-api";

if (!process.env.ECOD_API_KEY) throw new Error("ECOD_API_KEY is not set");
if (!process.env.ECOD_CLIENT_CODE) throw new Error("ECOD_CLIENT_CODE is not set");

export const ecod = new Ecodrix({
  apiKey:     process.env.ECOD_API_KEY,
  clientCode: process.env.ECOD_CLIENT_CODE,
  baseUrl:    process.env.ECOD_API_URL,
});
```

### Step 4 — Use in server actions or API routes

```ts
// app/api/product-image/route.ts
import { ecod } from "@/lib/ecod";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("image") as File;
  const buf  = Buffer.from(await file.arrayBuffer());

  const { data } = await ecod.media.upload(buf, {
    folder:      "products",
    filename:    file.name,
    contentType: file.type,
  });

  // data = { url, type: "image", variants: { thumb, medium, full, raw }, key, fileName }
  return Response.json({ success: true, ...data });
}
```

### Step 5 — Consume in components

```tsx
// components/ProductImage.tsx
import type { MediaMeta } from "@ecodrix/erix-api";

export function ProductImage({ media }: { media: MediaMeta }) {
  return (
    <img
      src={media.variants?.medium ?? media.url}
      alt=""
      loading="lazy"
      className="w-full aspect-square object-cover"
    />
  );
}
```

---

## Upload Folder Conventions

All uploads are namespaced under `tenants/{CLIENT_CODE}/`. Never include this prefix manually — the backend adds it automatically.

| Use case | Folder to pass |
|----------|---------------|
| Product images | `"products"` |
| Blog / service images | `"media"` or `"blogs"` |
| User avatars / profiles | `"profile"` |
| WhatsApp chat media | `"chat"` (set automatically by chat route) |
| Customer-uploaded documents | `"documents"` |
| Review / testimonial images | `"reviews"` |
| Custom folder | `ecod.media.createFolder("my-folder")` first |

---

## Security Rules

- The backend enforces **tenant isolation** — a client with code `CLNT_A` cannot read or write `CLNT_B` files.
- All API calls require both `x-api-key` and `x-client-code` headers. The SDK sets these automatically.
- **Never expose `ECOD_API_KEY` in client-side browser code.** Always proxy through a Next.js API route or server action.
- Presigned upload URLs expire in 1 hour. Confirm uploads promptly after the `PUT` succeeds.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Stripping `variants` in a proxy and only forwarding `url` | Forward the full `item` object from `json.data[0]` |
| Checking `src.type === "image/jpeg"` (MIME) | Check `src.type === "image"` (categorical) |
| Using `variants.thumb` for a video thumbnail | `variants` is `undefined` for video — fall back to `url` |
| Passing `folder: "tenants/CLNT/products"` with the prefix | Pass `folder: "products"` — the backend prepends the prefix |
| Creating a new `Ecodrix` instance on every request | Create once as a module-level singleton in `lib/ecod.ts` |
| Setting `Content-Type: application/json` on a FormData upload | Omit `Content-Type` — let the browser/Node set the `multipart` boundary |

---

## API Reference

### `ecod.media`

| Method | Description |
|--------|-------------|
| `upload(file, { folder, filename, contentType })` | Upload any file. Returns `{ url, type, variants?, key }` |
| `list(folder, { year?, month? })` | List files in a folder |
| `delete(key)` | Delete a file by key |
| `getDownloadUrl(key)` | Get a time-limited presigned download URL |
| `getUsage()` | Get storage quota and usage |
| `createFolder(name)` | Create a new folder |

### `ecod.storage`

| Method | Description |
|--------|-------------|
| `storage.usage()` | Same as `media.getUsage()` |
| `storage.files.list(folder, params?)` | Same as `media.list()` |
| `storage.files.getUploadUrl(params)` | Low-level: get presigned PUT URL |
| `storage.files.confirmUpload({ key, sizeBytes })` | Low-level: confirm after direct PUT |
| `storage.files.getDownloadUrl(key)` | Same as `media.getDownloadUrl()` |
| `storage.files.delete(key)` | Same as `media.delete()` |
| `storage.folders.create(name)` | Same as `media.createFolder()` |
| `storage.folders.delete(path)` | Delete a folder |

> **Prefer `ecod.media.*`** for application code. `ecod.storage.*` is a lower-level wrapper for when you need fine control (e.g., the two-step presigned upload flow without the orchestration).
