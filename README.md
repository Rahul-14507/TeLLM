# TeLLM — AI-Powered Socratic Tutoring Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Groq](https://img.shields.io/badge/LLM-Groq_Llama_3.3-orange?style=flat-square)](https://groq.com/)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL_%2B_pgvector-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

**TeLLM** is a high-performance, AI-driven EdTech platform designed to foster critical thinking through the **Socratic Method**. Unlike traditional tutors that provide direct answers, TeLLM guides students through problem-solving using progressive hints, intelligent questioning, and real-time interactive simulations.

---

## 🚀 Key Features

*   **Socratic Chat Engine**: Powered by **Groq's Llama 3.3-70B**, providing near-instantaneous, pedagogically sound tutoring.
*   **Deep RAG Integration**: Ingests school curriculums and textbooks to provide context-aware, syllabus-aligned guidance.
*   **Multi-Level Hint System**: Dynamic hint levels (1-5) that adapt to student needs—from broad conceptual prompts to specific formula guidance.
*   **Interactive Simulations**: Seamlessly dispatches physics and math simulations (e.g., Projectile Motion, Ohm's Law) directly into the chat flow.
*   **Teacher Analytics Dashboard**: Monitor student progress, track hint level distribution, and review flagged bypass attempts.
*   **Dual-Layer Security**: Advanced injection guards and rate-limiting to ensure academic integrity and system stability.

---

## 🏗️ Technical Architecture

TeLLM follows a modern, scalable microservices-inspired monorepo structure:

```text
TeLLM/
├── apps/
│   ├── api/          # FastAPI Backend (Python 3.10+)
│   │   ├── services/ # AI Logic: Socratic Engine, RAG, Intent Classifier
│   │   └── routers/  # REST Endpoints: Chat, Curriculum, Analytics
│   └── web/          # Next.js Frontend (App Router, Tailwind, Framer Motion)
├── packages/
│   ├── db/           # Database models, migrations (pgvector)
│   └── sim-lib/      # Interactive simulation templates
└── scripts/          # Administrative & Sync utilities
```

**Stack Highlights:**
- **AI**: Groq API (Llama 3.3-70B), Local `SentenceTransformers` (all-MiniLM-L6-v2) for embeddings.
- **Storage**: PostgreSQL with `pgvector` for semantic search, Redis for session management and rate limiting.
- **Styling**: Premium dark-mode UI with Tailwind CSS and Framer Motion animations.

---

## 🛠️ Getting Started

### Prerequisites
- **Docker & Docker Compose** (for DB and Redis)
- **Node.js 20+**
- **Python 3.10+**
- **Groq API Key** (obtainable at [console.groq.com](https://console.groq.com/))

### 1. Environment Setup
Clone the repository and configure your `.env` file in the root:

```env
DATABASE_URL=postgresql://tellm:tellm_dev@localhost:5432/tellm
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET=your_secret_key
```

### 2. Launch Infrastructure
Start the database and cache services:
```bash
docker compose up postgres redis -d
```

### 3. Initialize & Sync Data
Install dependencies and sync your textbooks from the RAG-Tutorials project:
```bash
# Install Backend dependencies
cd apps/api
pip install -r requirements.txt
alembic upgrade head

# Sync RAG Data (Linking RAG-Tutorials/data)
python ../../scripts/sync_data.py
```

### 4. Start the Application
Run both the backend and frontend development servers:

**Backend (Port 8000):**
```bash
cd apps/api
uvicorn main:app --reload
```

**Frontend (Port 3000):**
```bash
cd apps/web
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the landing page and chat.

---

## 📊 Administrative Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js frontend |
| `uvicorn main:app` | Starts the FastAPI backend |
| `alembic upgrade head` | Runs latest DB migrations |
| `python scripts/sync_data.py` | Syncs textbooks from RAG-Tutorials |

---

## 🛡️ Security & Integrity
TeLLM implements a **Dual-Layer Injection Guard**:
1.  **Middleware Guard**: Pattern-matching against common jailbreak and prompt-injection signatures.
2.  **Instructional Guard**: CRITICAL system-level instructions in the Socratic Engine to prevent "tell me the answer" bypasses.

---

## 📄 License
TeLLM is licensed under the MIT License.
