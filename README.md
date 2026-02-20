# Quorum MVP

An AI-powered document analysis system featuring a "Social Brain" architecture for adversarial reasoning and intelligent PII detection with human-in-the-loop validation.

## Overview

Quorum is an advanced document analysis platform that uses multiple AI agents to provide comprehensive analysis of complex documents (contracts, legal agreements, technical specifications). The system employs an adversarial "Social Brain" approach where different AI agents debate and challenge each other's interpretations, resulting in more thorough and balanced analysis.

### Key Features

- **Multi-Agent "Social Brain" Architecture**: Three specialized AI agents work together:
  - **The Creator**: Drafts initial summaries and extractions (Claude 3.7 Sonnet)
  - **The Skeptic**: Challenges assumptions and finds loopholes (DeepSeek)
  - **The Optimizer**: Synthesizes perspectives and calculates conflict scores (GPT-4o)

- **Privacy-First PII Detection**: Built-in Microsoft Presidio integration with:
  - Automatic PII detection and redaction
  - Interactive human-in-the-loop validation workbench
  - Reversible pseudonymization for audit trails
  - Privacy preview before analysis

- **Intelligent Conflict Scoring**: Semantic analysis of agent disagreements to highlight areas requiring human attention

- **Interactive Remediation**: AI-assisted document improvement with streaming responses

- **Export & Reporting**: Generate comprehensive analysis reports in multiple formats (PDF, DOCX, JSON)

## Tech Stack

### Backend
- **Framework**: Python 3.11 + FastAPI
- **Orchestration**: LangGraph (StateGraph) for agent workflows
- **AI Models**:
  - Claude 3.7 Sonnet (via LangChain Anthropic)
  - DeepSeek API (via LangChain OpenAI adapter)
  - GPT-4o (via LangChain OpenAI)
- **PII Detection**: Microsoft Presidio (Analyzer + Anonymizer)
- **Database**: SQLite (via LangGraph checkpointing) with future PostgreSQL/pgvector support
- **Mock Data**: Faker library for testing

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: React 19 with Server Components
- **Document Processing**: diff, docx, jspdf for export capabilities

## Project Structure

```
quorum-mvp/
├── backend/
│   ├── main.py              # FastAPI endpoints
│   ├── graph.py             # LangGraph workflows
│   ├── prompts.py           # Agent system prompts
│   ├── core/                # Business logic (PII engine, sessions)
│   ├── models/              # Pydantic models
│   ├── storage/             # Persistence layer
│   └── utils/               # Helper functions
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx     # Landing page with upload
│       │   └── report/      # Analysis dashboard
│       ├── components/
│       │   ├── RedlineDiff.tsx
│       │   └── ui/          # shadcn components
│       └── lib/
│           ├── exportReport.ts
│           └── utils.ts
│
├── data/                    # Sample contracts and checkpoints
├── scripts/                 # Utility scripts
└── docs/
    ├── ARCHITECTURE_PROPOSAL.md
    ├── FILE_LAYOUT.md
    ├── COMPARISON_WORKBENCH_GUIDE.md
    ├── CONFLICT_SCORE_FORMULA.md
    └── MANUAL_PII_TAGGING_GUIDE.md
```

## Installation

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm or yarn

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/crystaljin1001/Quorum-AI.git
cd quorum-mvp
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys:
# - ANTHROPIC_API_KEY (for Claude)
# - OPENAI_API_KEY (for GPT-4o)
# - DEEPSEEK_API_KEY (for Skeptic agent)
```

5. Start the backend server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Configure environment (if needed):
```bash
# Create .env.local if custom backend URL is required
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Usage

### Basic Document Analysis

1. **Upload Document**: Navigate to the homepage and upload a document (TXT, PDF, DOCX)

2. **Privacy Preview**: Review detected PII entities before analysis
   - Dismiss false positives
   - Manually tag missed PII
   - Approve to continue

3. **Analysis**: The Social Brain agents process the document:
   - Creator extracts key information
   - Skeptic identifies concerns and contradictions
   - Optimizer synthesizes final analysis with conflict score

4. **Review Results**: View the comprehensive analysis dashboard with:
   - Executive summary
   - Skeptic's critique
   - Conflict score (0-100)
   - Bi-directional entity linking
   - Export options

### Document Remediation

1. From the analysis dashboard, click "Suggest Improvements"
2. Review streaming AI suggestions
3. View side-by-side diff comparison
4. Export improved version

## API Endpoints

### Analysis Endpoints
- `POST /analyze` - Submit document for analysis
- `POST /pii/preview` - Preview PII detections
- `POST /remediate` - Get document improvement suggestions

### Session Management (Enhanced)
- `POST /sessions/create` - Start new analysis session
- `POST /sessions/{id}/approve-pii` - Resume after PII review
- `GET /sessions/{id}/state` - Get current session state

### Health Check
- `GET /health` - Server health status

## Security & Privacy

### Critical Security Rules
1. **No PII Logging**: PII is NEVER printed to console logs or stored unencrypted
2. **Redaction Layer**: All documents pass through Microsoft Presidio before LLM processing
3. **Pseudonymization**: Reversible mapping system (e.g., `[PERSON_1]`) instead of permanent deletion
4. **Session Isolation**: Each analysis session is cryptographically isolated
5. **Mock Data**: All development/testing uses Faker-generated data

### Deployment Constraints
- Backend MUST be deployed as a long-running container (Railway, AWS ECS)
- DO NOT deploy Python code to Vercel Functions (LangGraph requires persistent state)
- Frontend can be deployed to Vercel/Netlify

## Development

### Architecture Guidelines (MUST READ)

See [CLAUDE.md](./CLAUDE.md) for strict architectural requirements, including:
- The Skeptic MUST use DeepSeek API (adversarial requirement)
- Never print PII to logs
- Backend requires Dockerfile for containerization

### Key Documentation
- [ARCHITECTURE_PROPOSAL.md](./ARCHITECTURE_PROPOSAL.md) - Enhanced PII system design
- [FILE_LAYOUT.md](./FILE_LAYOUT.md) - Detailed file organization
- [CONFLICT_SCORE_FORMULA.md](./CONFLICT_SCORE_FORMULA.md) - Scoring methodology
- [COMPARISON_WORKBENCH_GUIDE.md](./COMPARISON_WORKBENCH_GUIDE.md) - Remediation UI guide

### Running Tests
```bash
# Backend tests (to be implemented)
cd backend
pytest

# Frontend tests (to be implemented)
cd frontend
npm test
```

## Deployment

### Backend (Railway)
```bash
# Railway deployment with Dockerfile
railway up
```

### Frontend (Vercel)
```bash
# Deploy to Vercel
cd frontend
vercel --prod
```

## Roadmap

### Phase 1: Core PII Engine ✓
- [x] Implement PIIEngine with reversible mapping
- [x] Basic PII detection and anonymization
- [x] Session management foundations

### Phase 2: Human-in-the-Loop (In Progress)
- [ ] Interactive PII workbench component
- [ ] Interrupt/resume workflow with checkpointing
- [ ] Manual PII tagging interface

### Phase 3: Telemetry & Data Moat
- [ ] Dwell time tracking
- [ ] Manual correction analytics
- [ ] Data moat construction for model improvement

### Phase 4: Advanced Features
- [ ] Conflict score visualization
- [ ] Multi-document batch processing
- [ ] Advanced export options

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Specify license here]

## Contact

Crystal Jin - [@crystaljin1001](https://github.com/crystaljin1001)

Project Link: [https://github.com/crystaljin1001/Quorum-AI](https://github.com/crystaljin1001/Quorum-AI)

## Acknowledgments

- Built with [LangGraph](https://github.com/langchain-ai/langgraph) for agent orchestration
- PII detection powered by [Microsoft Presidio](https://github.com/microsoft/presidio)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Multi-model AI integration via [LangChain](https://www.langchain.com/)
