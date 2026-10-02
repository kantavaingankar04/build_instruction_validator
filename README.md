# Linux on IBM Z — AI Build Instruction Validator

Automated validation engine that compares **Build Instructions (BI)** from the [Linux on IBM Z docs wiki](https://github.com/linux-on-ibm-z/docs/wiki) against **automation bash scripts** from [linux-on-ibm-z/scripts](https://github.com/linux-on-ibm-z/scripts), identifying discrepancies and generating remediation Pull Requests.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│  PackageSelector → SourceViewer → AuditBanner       │
│  ComplianceScoreCard → DiscrepancyList → DiffViewer │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/analyze
┌──────────────────────▼──────────────────────────────┐
│              Express API (server/)                   │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ Rule-Based AST  │  │  Python Pipeline (LLM)   │  │
│  │ Baseline Engine │  │  extractor → ast_parser   │  │
│  │ (always runs)   │  │  → comparator (semantic)  │  │
│  └─────────────────┘  └──────────────────────────┘  │
│            ↓ merge results ↓                         │
│  ValidationReport → Remediation Script → Diff        │
└─────────────────────────────────────────────────────┘
```

## Features

- **Dual-Engine Analysis** — deterministic AST rule engine + LLM-powered semantic comparison
- **GitHub Proxy** — auto-fetches wiki markdown and raw scripts from GitHub URLs
- **Side-by-Side Viewer** — compare BI documentation against bash scripts with line counts
- **Unified Diff** — visual diff of original vs. remediated script
- **Batch Auditor** — validate multiple packages concurrently
- **Export Reports** — HTML, Markdown, JSON, and PDF formats
- **Fork PR Automation** — create remediation PRs on your GitHub fork (upstream guard enforced)

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Ollama** with `llama3.2:3b` pulled locally

## Quick Start

```bash
# 1. Install Node dependencies
npm install

# 2. Set up the Python pipeline
npm run setup:pipeline

# 3. Pull the local LLM model
ollama pull llama3.2:3b

# 4. Copy and configure environment
cp .env.example .env

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── server/              # Express API server
│   └── index.ts         # API routes (analyze, fetch-github, create-pr)
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── data/            # Sample package fixtures
│   ├── services/        # Client-side analysis engine
│   └── types/           # TypeScript interfaces
├── pipeline/            # Python AI validation pipeline
│   ├── cli_runner.py    # Entry point (called by server via subprocess)
│   ├── extractor.py     # LLM-based markdown → structured JSON
│   ├── ast_parser.py    # bashlex AST command extraction
│   ├── comparator.py    # Semantic embedding similarity matching
│   ├── schemas.py       # Pydantic data models
│   └── requirements.txt # Python dependencies
├── index.html           # Vite entry point
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze` | Run full validation pipeline (wiki + script → report) |
| `POST` | `/api/fetch-github` | Proxy-fetch raw content from GitHub URLs |
| `POST` | `/api/create-pr` | Create remediation PR on a forked repository |

## Production Build

```bash
npm run build
npm start
```

## License

Apache License 2.0
