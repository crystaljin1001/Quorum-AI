Quorum Architecture Guidelines
Tech Stack
Backend: Python 3.11 + FastAPI.

Orchestration: LangGraph (StateGraph).

Frontend: Next.js (App Router) + Tailwind CSS + Shadcn/UI.

Database: PostgreSQL (Supabase or Railway) with pgvector.

The "Social Brain" Logic (Strict Adherence Required)
The Creator: Uses ChatAnthropic (Claude 3.7 Sonnet). Task: Draft extraction/summary.

The Skeptic: Uses ChatOpenAI pointed to DeepSeek API (base_url="https://api.deepseek.com"). Task: Find loopholes/contradictions. MUST be adversarial.

The Optimizer: Uses ChatOpenAI (GPT-4o). Task: Synthesize and output JSON with conflict_score.

Security Rules
NEVER print PII to console logs.

All documents must pass through a "Redaction Layer" (Microsoft Presidio) before hitting LLMs.

Mock all data for now (use Faker library).

Deployment Architecture
Frontend: Next.js deployed to Vercel.

Backend: FastAPI deployed to Railway.

Critical Requirement: The backend MUST include a Dockerfile. Do NOT try to deploy Python code to Vercel Functions. We need a long-running container for the LangGraph agents.
