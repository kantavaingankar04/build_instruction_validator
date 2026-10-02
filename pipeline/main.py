# main.py
import os
from config import BATCH_REGISTRY
from ingest import ingest_artifacts
from extractor import extract_wiki_steps
from ast_parser import extract_script_commands
from comparator import generate_discrepancy_report
from reporter import generate_html_report
from github_integrator import create_remediation_pr

def run_pipeline():
    print("=== AI Build Instruction Validator (Batch Edition) ===")
    
    raw_input_user = input("Enter your GitHub username (for forked repos): ")
    github_user = raw_input_user.strip("/").split("/")[-1]
    
    for package, details in BATCH_REGISTRY.items():
        print(f"\n===========================================")
        print(f"[*] Starting Validation for: {package} v{details['version']}")
        print(f"===========================================")
        
        # Phase 1: Batch Ingestion
        wiki_text, script_text = ingest_artifacts(
            github_user, package, details['wiki_url'], details['script_path']
        )
        
        if not wiki_text or not script_text:
            print(f"[-] Skipping {package} due to download error.")
            continue
            
        # Phase 2: Extraction & Parsing
        print(f"  -> Normalizing Wiki Text via llama3.2:3b...")
        wiki_spec = extract_wiki_steps(wiki_text)
        
        print(f"  -> Parsing Bash Script via AST...")
        safe_name = package.lower().replace(" ", "_")
        script_commands = extract_script_commands(f"data/{safe_name}_script.sh")
        
        # Phase 3: Reconciliation Engine
        report = generate_discrepancy_report(wiki_spec, script_commands)
        print(f"  -> Compliance Score: {report['compliance_score']}%")
        
        # Phase 4.1: Rich HTML Reporting
        report_name = f"discrepancy_report_{safe_name}.html"
        generate_html_report(report, report_name)
        
        # Phase 4.2: GitHub Integration (PR Automation)
        if len(report['missing_steps']) > 0:
            create_remediation_pr(github_user, package, details['script_path'], report)
        else:
            print(f"[+] Perfect match for {package}. No PR required.")

if __name__ == "__main__":
    run_pipeline()