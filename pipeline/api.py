# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

# Import your existing pipeline modules
from config import BATCH_REGISTRY
from ingest import ingest_artifacts
from extractor import extract_wiki_steps
from ast_parser import extract_script_commands
from comparator import generate_discrepancy_report
from security_guard import apply_security_guard

app = FastAPI(title="AI Build Validator API")

# Enable CORS for your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ValidationRequest(BaseModel):
    github_user: str
    package_name: str

@app.post("/api/validate")
async def validate_package(req: ValidationRequest):
    details = BATCH_REGISTRY.get(req.package_name)
    if not details:
        raise HTTPException(status_code=404, detail="Package not found in registry")
        
    try:
        # 1. Ingest
        wiki_text, script_text = ingest_artifacts(
            req.github_user, req.package_name, details['wiki_url'], details['script_path']
        )
        
        # 2. Extract
        wiki_spec = extract_wiki_steps(wiki_text)
        safe_name = req.package_name.lower().replace(" ", "_")
        script_commands = extract_script_commands(f"data/{safe_name}_script.sh")
        
        # 3. Reconcile
        report = generate_discrepancy_report(wiki_spec, script_commands)
        
        # 4. Security Guardrail
        safe_report = apply_security_guard(report)
        
        return {"status": "success", "data": safe_report}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/packages")
async def get_packages():
    """Returns the list of available packages configured in the batch registry."""
    return {"status": "success", "packages": list(BATCH_REGISTRY.keys())}
