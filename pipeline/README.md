# AI Assistant for Build Instruction Validation

A full-stack AI-powered validation engine developed for the *Linux on IBM Z* Mentorship Mini-Project (September 2026). 

This system automatically compares package Build Instructions (BI) documented in the Linux on IBM Z documentation repository with their corresponding automation scripts to identify discrepancies, ensure consistency, and automatically recommend remediations via GitHub Pull Requests.

---

## 📖 Table of Contents
- [Objective & Problem Statement](#objective--problem-statement)
- [System Architecture](#system-architecture)
- [Expected Functionality & Stretch Goals Achieved](#expected-functionality--stretch-goals-achieved)
- [Technology Stack](#technology-stack)
- [Getting Started (Build Instructions)](#getting-started-build-instructions)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup (FastAPI & AI Pipeline)](#1-backend-setup-fastapi--ai-pipeline)
  - [2. Frontend Setup (Next.js Dashboard)](#2-frontend-setup-nextjs-dashboard)
- [Usage Guide](#usage-guide)
  - [Using the Next.js Dashboard](#using-the-nextjs-dashboard)
  - [Using the CLI Batch Orchestrator](#using-the-cli-batch-orchestrator)
- [Data Storage & Caching](#data-storage--caching)
- [Limitations & Known Issues](#limitations--known-issues)

---

## 🎯 Objective & Problem Statement

**Objective:** Develop an AI-powered assistant that automatically compares package Build Instructions (BI) documented in the Linux on IBM Z documentation repository with their corresponding automation scripts and identifies any discrepancies.

**Problem Statement:** For each package, the automation script should accurately implement all steps defined in the Build Instructions. Manual verification is time-consuming and error-prone. The proposed AI Assistant analyzes both sources and highlights differences to ensure consistency and correctness.

---

## 🏗️ System Architecture

The system utilizes an **Extract-Normalize-Align-Audit** pipeline:

1. **Ingestion Module (`ingest.py`)**: Fetches unstructured Wiki Markdown (Build Instructions) and procedural Bash scripts directly from GitHub. Caches them locally in the `data/` directory.
2. **AI Extraction Module (`extractor.py`)**: Sends the raw Markdown to a local `llama3.2:3b` LLM via Ollama to semantically extract and normalize the expected build steps into a Pydantic Intermediate Representation (IR).
3. **AST Parser Module (`ast_parser.py`)**: Parses the raw Bash scripts into an Abstract Syntax Tree (AST) using `bashlex` to deterministically extract the executed commands.
4. **Comparator Engine (`comparator.py`)**: Reconciles the LLM-extracted intent with the AST-parsed execution to find missing steps, additional steps, and version mismatches.
5. **Reporter & UI (`api.py` / Next.js)**: Generates a JSON output which is visualized on a premium Glassmorphism-themed Next.js Dashboard.
6. **GitHub Integrator (`github_integrator.py`)**: Automatically creates a Pull Request with remediation steps against the **forked** repository if discrepancies are found.

---

## ✨ Expected Functionality & Stretch Goals Achieved

All base requirements and **all stretch goals** from the Mentorship PDF have been successfully implemented:

- ✅ **Accept Package Name**: Dynamic selection via FastAPI and Next.js dropdown.
- ✅ **Retrieve BI & Script**: Dynamic downloading and caching in the `data/` directory.
- ✅ **Compare Sources**: Fuzzy string and semantic matching engine.
- ✅ **Identify Discrepancies**: Flags missing steps and version mismatches.
- ✅ **Structured Discrepancy Report**: Returns detailed compliance scores and recommendations.
- 🚀 **Stretch Goal - LLM Techniques**: Uses Ollama (`llama3.2:3b`) for intelligent semantic extraction.
- 🚀 **Stretch Goal - Batch Validation**: Implemented via `config.py` (BATCH_REGISTRY) allowing seamless multi-package support.
- 🚀 **Stretch Goal - UI / Reports**: Implemented both an HTML generator (via Jinja2) and a complete interactive **Next.js frontend dashboard**.
- 🚀 **Stretch Goal - GitHub PR Automation**: Automatically creates remediation PRs against user forks (never upstream).

---

## 💻 Technology Stack

- **Backend API**: FastAPI, Python 3.11+, Uvicorn
- **AI / LLM**: Ollama (llama3.2:3b local inference), Pydantic, LangChain
- **AST Parsing**: `bashlex`
- **Frontend Dashboard**: Next.js (App Router), React, Tailwind CSS (Glassmorphism UI), Lucide Icons
- **Integrations**: PyGithub

---

## 🚀 Getting Started (Build Instructions)

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & npm
- **Ollama** installed locally and running `llama3.2:3b` (`ollama run llama3.2:3b`).
- A **GitHub Personal Access Token (PAT)** exported as `GITHUB_TOKEN` in your environment variables.

### 1. Backend Setup (FastAPI & AI Pipeline)

Open a terminal in the root directory:

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install Python dependencies
pip install fastapi uvicorn pydantic requests pygithub bashlex jinja2

# 3. Export your GitHub Token
export GITHUB_TOKEN="your_personal_access_token"

# 4. Start the FastAPI Backend
uvicorn api:app --reload
```
*The backend will start running on `http://127.0.0.1:8000`.*

### 2. Frontend Setup (Next.js Dashboard)

Open a **new** terminal tab in the root directory:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```
*The frontend will start running on `http://localhost:3000`.*

---

## 🛠️ Usage Guide

### Using the Next.js Dashboard
1. Open `http://localhost:3000` in your web browser.
2. Enter your GitHub username.
3. Select a package from the dropdown (e.g., `Alfresco`, `Apache Cassandra`).
4. Click **Run Audit**. The UI will fetch the artifacts, analyze the AST, and display an animated Discrepancy Matrix with your Compliance Score.

### Using the CLI Batch Orchestrator
If you prefer running the pipeline purely in the terminal and generating static HTML reports:
```bash
source .venv/bin/activate
export GITHUB_TOKEN="your_token"
python main.py
```
This will iterate through all packages in `config.py` and output `discrepancy_report_<package>.html` files.

---

## 📂 Data Storage & Caching

When a package is audited, its raw Wiki Markdown and Bash scripts are downloaded into the `data/` directory (e.g., `data/alfresco_wiki.md`). 
- **Persistent Cache**: These files remain on disk permanently until manually deleted.
- **Overwrites**: If you audit the same package again, the pipeline simply overwrites the existing files with the latest versions from GitHub. This acts as a reliable audit trail for AI debugging.

---

## ⚠️ Limitations & Known Issues

- **Bash AST Constraints**: The static AST parser (`bashlex`) strictly adheres to POSIX shell standards. It does not support advanced Bash 4.0+ features such as `[[ ... ]]` logical conditions. Scripts must be normalized to standard `[ ... ]` syntax for perfect parsing.
- **LLM Context Limits**: Heavily nested instructions or extremely long documentation wikis might hit the context limits of local models.
