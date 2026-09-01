# 🌿 PlantGuard — AI Plant Disease Detection Web App

A complete rebuild of the original Streamlit/TensorFlow prototype as a modern,
edge-deployed web application: **Hono + TypeScript on Cloudflare Workers/Pages**,
with **real AI (GPT-5 vision + chat)** replacing the fixed 35-class CNN model,
**Cloudflare D1** replacing local JSON files, and **real weather data**
replacing the old random-number forecast.

## Project Overview
- **Name**: PlantGuard
- **Goal**: Let farmers and plant lovers diagnose plant diseases from a photo,
  chat with an AI plant-care expert, browse AI-generated disease/cultivation
  guides, track their diagnosis history, check real weather forecasts, and
  discuss with a farmer community — all in one fast, edge-deployed web app.
- **Rebuilt from**: original Python/Streamlit/TensorFlow prototype
  (see `docs/OLD_PROJECT_NOTES.md`-style history in git log) — fully migrated
  to TypeScript + Hono because Cloudflare Pages/Workers cannot run
  Python/TensorFlow.

## ✅ Currently Completed Features

1. **AI Vision Diagnosis** (`/#/diagnosis`)
   - Upload any leaf photo (png/jpg/jpeg, up to 8MB)
   - GPT-5 vision model identifies the plant species, detects disease vs.
     healthy, estimates confidence + severity, and explains symptoms,
     spread, treatment, and prevention — **not limited to a fixed list of
     35 classes** like the old CNN model was.
   - Rejects non-leaf images automatically.
   - Every diagnosis is saved to D1 + the leaf photo is stored in R2.

2. **AI Plant Care Chatbot** (`/#/chatbot`)
   - Full conversational AI assistant (GPT-5) for any plant/farming question.
   - Conversation history persisted per-session in D1.
   - Clear-conversation button.

3. **Disease Library** (`/#/library`)
   - Browse any of 20+ common diseases; AI generates symptoms/spread/
     treatment/prevention on demand and caches the result in D1
     (`disease_cache` table) so repeat lookups are instant and cheap.

4. **Cultivation Tips** (`/#/tips`)
   - Browse any of 16 common plants/crops; AI generates a full cultivation
     guide (watering, sunlight, temperature, soil, fertilizer, spacing,
     extra tips), cached in D1 (`cultivation_cache` table).

5. **Real Weather Forecast** (`/#/weather`)
   - IP-based location auto-detection (`ip-api.com`)
   - City search via geocoding (Open-Meteo Geocoding API)
   - **Real** current conditions + 7-day forecast (Open-Meteo Forecast API)
     — replaces the old prototype's `np.random`-generated fake forecast.

6. **Farmer Community Forum** (`/#/community`)
   - Create posts, like/unlike (one like per browser session), comment,
     delete own posts. All persisted in D1 (`posts`, `comments`, `post_likes`).

7. **Diagnosis History** (`/#/history`)
   - Every AI diagnosis is listed with stats (total, avg confidence,
     today's count), expandable detail, and delete.

8. **Landing page + dashboard** — modern animated marketing landing page,
   then a card-based dashboard linking to every feature.

## 🌐 URLs
- **Local dev (sandbox)**: `http://localhost:3000`
- **Production**: not yet deployed — see "Deployment" below.
- **GitHub**: https://github.com/muhammadnaveedgurmanii-png/PlantGuard

### API Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/diagnosis/analyze` | multipart `image` upload → AI diagnosis |
| GET | `/api/diagnosis/history?date=YYYY-MM-DD` | list this session's diagnoses |
| DELETE | `/api/diagnosis/history/:id` | delete a diagnosis record |
| GET | `/api/diagnosis/image/:key` | serve a stored leaf image from R2 |
| POST | `/api/chat/send` `{message}` | send a chat message, get AI reply |
| GET | `/api/chat/history` | get this session's chat history |
| DELETE | `/api/chat/history` | clear chat history |
| GET | `/api/weather/detect` | IP-based location detection |
| GET | `/api/weather/forecast?city=X` or `?lat=&lon=` | real weather forecast |
| GET | `/api/community/posts` | list all posts + comments |
| POST | `/api/community/posts` `{author,title,content}` | create post |
| PUT | `/api/community/posts/:id` `{title,content}` | edit own post |
| DELETE | `/api/community/posts/:id` | delete own post |
| POST | `/api/community/posts/bulk-delete` `{ids}` | bulk delete own posts |
| POST | `/api/community/posts/:id/like` | toggle like |
| POST | `/api/community/posts/:id/comments` `{author,content}` | add comment |
| GET | `/api/library/plants` / `/api/library/diseases` | dropdown option lists |
| GET | `/api/library/cultivation?plant=X` | AI cultivation guide (cached) |
| GET | `/api/library/disease?name=X` | AI disease info (cached) |

## 🗄️ Data Architecture
- **Storage**: Cloudflare D1 (SQLite) for all structured data, Cloudflare R2
  for uploaded leaf photos. No local filesystem / JSON files (required for
  serverless/edge compatibility).
- **Tables** (see `migrations/0001_initial_schema.sql`):
  - `diagnoses` — every AI diagnosis result, keyed by anonymous session id
  - `posts`, `comments`, `post_likes` — community forum
  - `chat_messages` — AI chatbot conversation history per session
  - `cultivation_cache` — AI-generated cultivation guides, cached by plant name
  - `disease_cache` — AI-generated disease info, cached by disease name
- **Sessions**: anonymous per-browser session via an httpOnly cookie
  (`pg_session`), no login/signup required.
- **AI**: GPT-5 via the OpenAI-compatible Chat Completions API
  (`OPENAI_API_KEY` / `OPENAI_BASE_URL` — see Environment Variables below).

## 🧭 User Guide
1. Open the app → **Get Started** on the landing page.
2. From the dashboard, pick a feature:
   - **Plant Diagnosis**: upload a leaf photo → click "Analyze Leaf" → read
     the AI's diagnosis, symptoms, treatment, and prevention.
   - **AI Chat**: type any plant-care question and chat with the AI.
   - **Community**: read/create posts, like, comment.
   - **Disease Library / Cultivation Tips**: pick from the dropdown to get
     an AI-generated guide.
   - **History**: review your past diagnoses.
   - **Weather**: see your local (or any city's) real 7-day forecast.

## 🚀 Deployment
- **Platform**: Cloudflare Pages (Workers) — Hono backend + vanilla JS
  frontend (no framework build needed beyond Vite bundling the worker).
- **Status**: ❌ Not yet deployed to production (built & tested locally in
  the sandbox with `wrangler pages dev` + local D1/R2 emulation).
- **Tech Stack**: Hono 4 (TypeScript) · Cloudflare Workers/Pages · D1 (SQLite)
  · R2 (object storage) · GPT-5 (vision + chat) · Open-Meteo (weather) ·
  ip-api.com (geolocation) · Vanilla JS + Tailwind (CDN) frontend.
- **Required secrets in production** (`wrangler pages secret put <NAME>`):
  - `OPENAI_API_KEY`
  - `OPENAI_BASE_URL`
- **To deploy**: create the D1 database and R2 bucket in your own Cloudflare
  account, update the `database_id` in `wrangler.jsonc`, run
  `npm run db:migrate:prod`, set the secrets above, then `npm run deploy`.

## 🧪 Local Development
```bash
npm install
npm run build
npx wrangler d1 migrations apply plantguard-production --local
pm2 start ecosystem.config.cjs      # starts wrangler pages dev on :3000
curl http://localhost:3000
```
Create a `.dev.vars` file (gitignored) with:
```
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://api.openai.com/v1   # or your provider's compatible endpoint
```

## 📌 Migration Notes (from the old Streamlit prototype)
| Old (Streamlit/Python) | New (Hono/TypeScript) |
|---|---|
| TensorFlow `.h5` CNN, 35 fixed classes | GPT-5 vision — any plant/disease, richer explanations |
| `disease_details.json` (4/35 diseases filled) | AI-generated on demand for any disease, cached in D1 |
| `cultivation_data.json` (2 plants, partial) | AI-generated on demand for any plant, cached in D1 |
| Fake `np.random` 7-day forecast | Real Open-Meteo forecast API |
| `posts.json` / `diagnosis_history.json` files | Cloudflare D1 tables (works on serverless/edge) |
| No chatbot | Full AI chatbot with persisted history |
| Abandoned `pages/`, `models/`, `utils/` scaffolding | Removed; clean `src/routes/`, `src/lib/` structure |
| Single 1483-line `app.py` | Modular routes (`diagnosis.ts`, `chatbot.ts`, `weather.ts`, `community.ts`, `library.ts`) + `src/lib/` helpers |

## ⚠️ Known Limitations / Next Steps
- Not yet deployed to a live Cloudflare Pages URL (needs your Cloudflare
  account + API token to deploy — see `cf-byok-deploy` skill or hosted deploy).
- No user accounts — all data is scoped to an anonymous browser session
  cookie, not a real login. Community posts aren't tied to a real identity.
- AI-generated diagnosis/cultivation/disease content should be treated as
  advisory, not a substitute for professional agronomist consultation for
  high-value crops.
- Image uploads capped at 8MB; very large images should be resized client-side
  in a future iteration for faster uploads.
