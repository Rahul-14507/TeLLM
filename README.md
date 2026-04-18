# TeLLM — AI-Powered Socratic Tutoring Platform

> **TeLLM** is an AI-powered EdTech SaaS platform that guides students through problem-solving using the Socratic method — asking the right questions instead of giving away answers. Built for schools and tutoring centers preparing for their first student pilots.

---

## ✨ What It Does

| Feature | Description |
|---|---|
| **Socratic Chat Engine** | Guides students through homework using progressive hints (levels 1–5), never giving direct answers |
| **Intent Classification** | Automatically classifies each message as Homework, Conceptual, Clarify, or Off-Topic and adapts the response accordingly |
| **Interactive Simulations** | Renders physics simulations (projectile motion, pendulum, wave superposition, Ohm's law) inline in the chat when relevant |
| **RAG-Powered Curriculum** | Teachers upload PDFs; the system embeds them with OpenAI and retrieves relevant context during conversations |
| **Teacher Analytics Dashboard** | Real-time view of student activity, hint level distributions, flagged bypass attempts, and session replays |
| **Prompt Injection Guard** | Two-layer defense — a pattern-matching middleware and an in-prompt CRITICAL instruction block — prevents jailbreak attempts |
| **Rate Limiting** | Redis-backed limit of 30 messages per student per hour to encourage reflection |

---

## 🏗️ Architecture

```
TeLLM/
├── apps/
│   ├── api/          # FastAPI backend (Python 3.11)
│   │   ├── routers/  # auth, chat, curriculum, analytics
│   │   ├── services/ # socratic_engine, intent_classifier, rag_service, sim_dispatcher
│   │   └── middleware/ # injection_guard
│   └── web/          # Next.js 16 frontend (TypeScript)
│       └── src/app/
│           ├── chat/       # Student chat interface (SSE streaming)
│           └── dashboard/  # Teacher analytics dashboard (server components)
├── packages/
│   ├── db/           # SQLAlchemy models + pgvector schema
│   └── sim-lib/      # HTML simulation templates (self-contained)
└── docker-compose.yml
```

**Tech Stack:**
- **Frontend:** Next.js 16, Tailwind CSS, Framer Motion, Lucide React
- **Backend:** FastAPI, Uvicorn, Pydantic, Python-JOSE
- **AI:** Anthropic Claude (Socratic engine), OpenAI `text-embedding-3-small` (RAG)
- **Storage:** PostgreSQL + pgvector (curriculum embeddings), Redis (caching, rate limiting, sessions)
- **Infrastructure:** Docker, Docker Compose, GitHub Actions CI

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v4+) — **required**
- An [Anthropic API Key](https://console.anthropic.com/) (for the Socratic engine)
- Node.js `>=20.9.0` & npm (for local frontend development only)
- Python `3.11` (for local backend development only)

---

### Option A — Docker (Recommended)

This starts all 4 services (Postgres, Redis, API, Web) in one command.

**1. Clone and configure**

```bash
git clone https://github.com/your-org/tellm.git
cd tellm
cp .env.example .env
```

**2. Fill in your `.env`**

```env
DATABASE_URL=postgresql://tellm:tellm_dev@localhost:5432/tellm
REDIS_URL=redis://localhost:6379
LLM_MODEL=claude-sonnet-4-6
ANTHROPIC_API_KEY=sk-ant-...      # Your Anthropic key — required
JWT_SECRET=change_me_in_production
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

**3. Build and launch**

```bash
docker compose up --build
```

The first build downloads images and installs dependencies (~3–5 minutes). Subsequent starts are fast.

| Service | URL |
|---|---|
| Student Chat | http://localhost:3000/chat |
| Teacher Dashboard | http://localhost:3000/dashboard |
| API (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

**4. Stop everything**

```bash
docker compose down
```

---

### Option B — Local Development

Use this if you are actively developing and want hot-reload on both services.

#### Backend (FastAPI)

```bash
cd apps/api

# Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy root .env (already loaded via pydantic-settings)
# Then start the dev server
uvicorn main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Frontend (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

#### Infrastructure (Postgres + Redis only)

For local dev, you still need the database and cache. Run just the infrastructure services:

```bash
docker compose up postgres redis -d
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic Claude API key |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens — use a strong random string in production |
| `LLM_MODEL` | ✗ | Claude model ID (default: `claude-sonnet-4-6`) |
| `NEXT_PUBLIC_API_URL` | ✗ | Backend URL visible to the browser (default: `http://localhost:8000`) |

---

## 🌊 Key Workflows

### Student Chat Flow

```
Student message
  → Injection Guard (middleware: pattern match + 1000-char sanitization)
  → Rate Limiter (Redis: 30 msg/hour)
  → Intent Classifier (Claude: HOMEWORK / CONCEPTUAL / CLARIFY / OFFTOPIC)
  → Socratic Engine or RAG Explainer
  → SSE stream to browser
  → [Optional] Simulation card rendered inline
```

### Curriculum Upload Flow

```
Teacher uploads PDF
  → PDF parsed with pypdf
  → Chunked (600 chars, 80 overlap)
  → Embedded via OpenAI text-embedding-3-small
  → Stored in PostgreSQL + pgvector
  → Retrieved during student sessions via cosine similarity
```

---

## 🧪 Running Tests

```bash
# Backend
cd apps/api
pytest tests/

# Frontend lint
cd apps/web
npm run lint
```

CI runs automatically on every push to `main` via GitHub Actions (`.github/workflows/ci.yml`).

---

## 🐳 Docker Services

| Container | Image | Port |
|---|---|---|
| `tellm-db` | `ankane/pgvector:latest` | `5432` |
| `tellm-redis` | `redis:7-alpine` | `6379` |
| `tellm-api` | Built from `apps/api/` | `8000` |
| `tellm-web` | Built from `apps/web/` | `3000` |

All services run on the `tellm-net` bridge network.

---

## 🔒 Security Notes

- All student input is sanitized (HTML stripped, max 1000 characters)
- Prompt injection is blocked at two layers: middleware pattern-matching and an in-prompt `CRITICAL` instruction
- Rate limiting prevents abuse and encourages students to try problems themselves
- JWTs are required on all authenticated routes
- RAG context is cached in Redis (10-min TTL) to reduce API costs

---

## 📄 License

MIT — see [LICENSE](LICENSE)
