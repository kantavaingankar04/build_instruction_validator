import re

BANNED_PATTERNS = [
    r"rm\s+-rf\s+/",
    r"chmod\s+777",
    r"chmod\s+-R\s+777",
    r"chown\s+-R\s+root",
    r"mkfs",
    r"dd\s+if="
]

def apply_security_guard(report_dict: dict) -> dict:
    """
    Scans the AI-generated discrepancy report for malicious or extremely dangerous 
    commands hallucinated in the suggestedPatchSnippet. Overrides them deterministically.
    """
    if "discrepancies" not in report_dict:
        return report_dict

    for discrepancy in report_dict["discrepancies"]:
        patch = discrepancy.get("suggestedPatchSnippet", "")
        
        for pattern in BANNED_PATTERNS:
            if re.search(pattern, patch, re.IGNORECASE):
                # We found a security violation! Overriding the AI's output.
                discrepancy["severity"] = "CRITICAL"
                discrepancy["title"] = f"SECURITY BLOCK: {discrepancy['title']}"
                discrepancy["description"] = f"BLOCKED BY GUARDRAIL: The AI attempted to suggest a highly destructive command matching '{pattern}'. Original explanation: {discrepancy.get('description', '')}"
                discrepancy["remediation"] = "MANUAL REVIEW REQUIRED. Do not execute the suggested AI patch."
                discrepancy["suggestedPatchSnippet"] = "# SECURITY BLOCK: DANGEROUS COMMAND REMOVED"
                break # Move to next discrepancy

    return report_dict
