# SeaSync: Maritime Offline-First Data Management System
> **"Work offline. Sync everywhere."**  
> *Engineered by Westmere for shipboard and shoreside fleet management.*

---

## 1. Overview & Executive Summary

**SeaSync** is an enterprise-grade Progressive Web Application (PWA) designed to operate reliably in mid-ocean zero-connectivity conditions onboard maritime merchant vessels. Ship crews (Crew, Officers, Masters) can record complex navigation fixes, machinery telemetry, safety drills, bunker deliveries, and upload multi-megabyte technical manuals without any active internet link.

All data is committed locally first into IndexedDB via **Dexie.js**. When a satellite uplink (Starlink, Inmarsat, FleetBroadband) is detected or restored, SeaSync's idempotent sync engine automatically schedules, batches, and uploads pending reports and 256KB chunked attachments to the central shore server with verified cryptographic acknowledgements.

---

## 2. Key Architecture Pillars

### 2.1 Zero-Loss Offline Local Storage
- **Primary Datastore**: Browser IndexedDB wrapped by Dexie.js (`seasync_client`).
- **IndexedDB Persistence**: Automatically calls `navigator.storage.persist()` on launch to protect against browser eviction.
- **Persistent Queue**: `syncQueue` table tracks operations with exponential backoff timestamps (`nextAttemptAt`) and survives browser restarts, reboots, and power cycles.

### 2.2 Idempotency & Zero Duplicates
- Every record submission generates a deterministic UUIDv4 idempotency key.
- The shore server caches this token in an `idempotencyStore`.
- If satellite packet loss causes the client to retry 3 or 5 times, the shore server returns the identical verified acknowledgement without creating duplicate records.

### 2.3 Resumable Chunked File Uploads
- Large PDFs, Excel logs, and photos are partitioned into **256 KB binary chunks**.
- Each chunk has its SHA-256 hash verified using the Web Crypto API (`crypto.subtle`).
- Interrupted uploads resume from the last acknowledged chunk rather than restarting from zero.

### 2.4 Three-Way Version Conflict Resolution
- Skew detection compares vessel version (`clientVersion`) vs shore version (`serverVersion`) and `serverUpdatedAt`.
- Interactive side-by-side reconciliation tool (`/conflicts`):
  1. **Keep Mine (Vessel)**: Local changes override shore updates (version incremented).
  2. **Keep Server (Shore)**: Adopts shore changes without data corruption.
  3. **Field-by-Field Merge**: Granular selection of local vs server attributes.

### 2.5 Disaster Recovery & Web Crypto AES-GCM
- Full local database snapshot export into an encrypted `.seasync` binary container.
- Key derived using **PBKDF2 with 100,000 iterations** and SHA-256.
- Data encrypted via **AES-GCM (256-bit key)**.
- Safe restore with UUID deduplication to guarantee zero silent overwrites.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with CSS custom properties (solid flat maritime palette, Light & Dark mode support)
- **Routing**: React Router v6
- **Animations**: Framer Motion, custom hooks (`useScrollReveal`, `useCounter`)
- **Local Storage**: Dexie.js (IndexedDB)
- **State Management**: Zustand
- **Form Engine**: `react-hook-form` + `zod`
- **Charts**: Recharts
- **Icons**: Lucide React
- **Export Engines**: SheetJS (`xlsx`) for Excel/CSV, `jspdf` for Maritime PDF Reports
- **PWA**: `vite-plugin-pwa` (Workbox Service Worker, precaching, web app manifest)
- **Unit Testing**: Vitest

---

## 4. Solid Flat Maritime Design System

SeaSync uses strict solid flat colors with no gradients or blur effects:
- **Deep Navy** (`#0A2540`): Primary header and sidebar
- **Ocean Blue** (`#1565C0`): Primary interactive CTAs
- **Teal** (`#00A7A7`): Online status pill and highlights
- **Sea Green** (`#1FAF6B`): Synced status and verified acknowledgements
- **Signal Orange** (`#FF7A1A`): Pending sync queue and attention alerts
- **Coral Red** (`#E5484D`): Failed uploads and hazard notifications
- **Sunshine Yellow** (`#F5B700`): Local drafts and warning thresholds
- **Violet** (`#6D4AFF`): Document attachments and conflict notices
- **Sand Ivory** (`#F6F3EC`): Light mode background
- **Ink** (`#0B1220`): Dark mode background

---

## 5. Getting Started & Development

### Installation
```bash
npm install
```

### Running Development Server
```bash
npm run dev
```

### Running Automated Test Suite
```bash
npm run test
```
*Executes all 5 Vitest suites: backoff jitter, idempotency deduplication, priority queue sorting, conflict detection, and Web Crypto AES-GCM roundtrip.*

### Production Build
```bash
npm run build
```
*Compiles TypeScript and bundles PWA assets into `dist/` with Workbox service worker precaching.*

---

## 6. Demo Accounts (1-Click Login Available)

On the `/login` screen, a quick-fill card allows instant authentication:
- **Master**: `master@seasync.demo` (Captain Erik Dahl — MV Westmere Voyager)
- **Chief Officer**: `officer@seasync.demo` (Chief Officer Sarah Lindholm)
- **Crew**: `crew@seasync.demo` (Able Seaman John Reyes)
- **Shore Admin**: `admin@seasync.demo` (Fleet Operations Director Marcus Vance)

---

## 7. How to Swap Mock Server for Production REST Backend

SeaSync isolates all server communication behind the typed `ApiClient` interface (`src/api/apiClient.ts`):

```typescript
// To connect to a live Node.js / PostgreSQL shoreside backend:
import { apiClient } from '@/api/apiClient';

// In src/app/App.tsx or Settings:
apiClient.setUseMock(false);
apiClient.setBaseUrl('https://fleet-api.yourcompany.com/v1');
```

The live backend should expose the matching endpoints:
1. `POST /api/records/sync/push` (Checks `X-Idempotency-Key` header)
2. `GET /api/records/sync/pull?vesselId=:id&since=:timestamp`
3. `POST /api/files/upload/chunk` (Accepts multipart/form-data with chunk byte stream)
4. `GET /api/vessels/:id/status`

---

## 8. Client Presentation Script (Demo Lab)

To showcase SeaSync's offline-first resilience to a ship-owner or fleet manager:

1. **Step 1: Local Creation at Sea**
   - Navigate to `/demo-lab` and click **"Simulate Mid-Ocean Offline"**.
   - Notice the persistent red banner: *"VESSEL OFFLINE MODE: Zero connection to shore."*
   - Go to `/records/new`, select **Noon Report**, fill in coordinates and click **"Submit to Pending Sync"**.
   - Show the green autosave indicator *"Saved locally in IndexedDB"*.
   - Refresh the browser or close and reopen the tab: data is 100% preserved.

2. **Step 2: Automatic Reconnection & Sync**
   - Return to `/demo-lab` and turn offline mode **OFF**.
   - Observe the header pill transition to **ONLINE** (green pulse).
   - The sync engine automatically wakes up, pushes the queued record, and updates status to **Synced** upon server ACK.

3. **Step 3: Resumable Chunked File Upload**
   - In `/demo-lab`, click **"Add 1 MB Chunked Attachment"**.
   - Set network quality to **"Flaky"** and click **"Interrupt Upload"**.
   - Go to `/documents` and watch the 256KB chunk progress resume seamlessly from where it stopped.

4. **Step 4: Three-Way Conflict Resolution**
   - In `/demo-lab`, click **"Trigger Version Conflict"**.
   - Go to `/conflicts` to demonstrate the side-by-side reconciliation interface (Keep Mine vs Keep Server vs Field-by-Field Merge).

5. **Step 5: Disaster Recovery**
   - In `/storage`, create an AES-GCM encrypted `.seasync` backup container with a passphrase.
   - Show how the database can be restored on any new bridge workstation without data loss.

---

## 9. License & Attribution
SeaSync is developed by Westmere Maritime Technology. All rights reserved.
