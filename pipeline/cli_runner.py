import sys
import json
import os
from extractor import extract_wiki_steps
from ast_parser import extract_script_commands
from comparator import generate_discrepancy_report
import datetime

def report_progress(step_id):
    print(f"__PROGRESS_STEP__:{step_id}", flush=True)

def main():
    if len(sys.argv) != 6:
        print("Usage: cli_runner.py <pkg> <ver> <wiki_file> <script_file> <distro>")
        sys.exit(1)
        
    pkg = sys.argv[1]
    ver = sys.argv[2]
    wiki_file = sys.argv[3]
    script_file = sys.argv[4]
    distro = sys.argv[5]
    
    with open(wiki_file, "r") as f:
        wiki_text = f.read()
        
    report_progress(0)
    
    # AI Extraction using the python pipeline
    report_progress(1)
    wiki_spec = extract_wiki_steps(wiki_text)
    report_progress(2)
    script_commands = extract_script_commands(script_file)
    
    # Comparison logic
    report_progress(3)
    report = generate_discrepancy_report(wiki_spec, script_commands)
    
    report_progress(4)    
    
    # Normalize types because the 3B model often ignores Enum constraints
    for d in report.get("discrepancies", []):
        if "type" in d:
            normalized_type = d["type"].upper().replace(" ", "_")
            if "MISSING" in normalized_type:
                d["type"] = "MISSING_STEP"
            elif "PARAMETER" in normalized_type:
                d["type"] = "PARAMETER_MISMATCH"
            elif "VERSION" in normalized_type:
                d["type"] = "VERSION_INCONSISTENCY"
            elif "ADDITIONAL" in normalized_type:
                d["type"] = "ADDITIONAL_SCRIPT_STEP"
            else:
                d["type"] = normalized_type

    missing_steps = len([d for d in report.get("discrepancies", []) if d["type"] == "MISSING_STEP"])
    additional = len([d for d in report.get("discrepancies", []) if d["type"] == "ADDITIONAL_SCRIPT_STEP"])
    param_mismatch = len([d for d in report.get("discrepancies", []) if d["type"] == "PARAMETER_MISMATCH"])
    version_inconsistencies = len([d for d in report.get("discrepancies", []) if d["type"] == "VERSION_INCONSISTENCY"])
    
    remed_script = list(script_commands)
    for d in report["discrepancies"]:
        if d["type"] == "MISSING_STEP":
            remed_script.append(d.get("suggestedPatchSnippet", ""))
            
    final_report = {
        "packageName": pkg,
        "packageVersion": ver,
        "timestamp": datetime.datetime.now().isoformat(),
        "distroTarget": distro,
        "complianceScore": report.get("complianceScore", 0),
        "totalExpectedSteps": report.get("total_wiki_steps", 0),
        "matchedSteps": report.get("matched_steps", 0),
        "missingSteps": missing_steps,
        "additionalSteps": additional,
        "parameterMismatches": param_mismatch,
        "versionInconsistencies": version_inconsistencies,
        "summary": report.get("summary", "AI comparison completed via Python pipeline."),
        "discrepancies": report.get("discrepancies", []),
        "extractedBiSteps": [f"{s.command} {s.parameters}" for s in wiki_spec.steps],
        "extractedScriptSteps": [{"stepId": f"cmd-{i}", "command": c, "lineNumber": i} for i, c in enumerate(script_commands)],
        "suggestedRemediationScript": "\n".join(remed_script),
        "unifiedDiff": "",
        "engine": "Python Pipeline (langchain_ollama + bashlex)"
    }
    
    print(json.dumps(final_report))

if __name__ == "__main__":
    main()
