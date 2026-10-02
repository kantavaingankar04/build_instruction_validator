import json
from langchain_core.prompts import PromptTemplate
from langchain_ollama import ChatOllama
from schemas import DiscrepancyReport

def generate_discrepancy_report(wiki_spec, script_commands):
    llm = ChatOllama(model="llama3.2:3b", temperature=0)
    structured_llm = llm.with_structured_output(DiscrepancyReport)
    
    prompt = PromptTemplate.from_template(
        "You are an elite IBM Z (s390x) Linux architecture auditor. Your task is to perform a strict, line-by-line validation of a bash script against the official Wiki instructions.\n\n"
        "<ROLE>\n"
        "You represent the absolute source of truth. The Wiki instructions are golden. The Bash script is the artifact being audited. Any deviation in the script is a discrepancy.\n"
        "</ROLE>\n\n"
        "<STRICT_CONSTRAINTS>\n"
        "1. NO HALLUCINATIONS: Only report factual discrepancies physically present in the provided text.\n"
        "2. NO CONVERSATIONAL REFERENCES: For 'biReference' and 'scriptReference', output EXACT bash code strings (e.g., 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-s390x'). NEVER output conversational text like 'Wiki: Step 2' or 'Script: line 5'.\n"
        "3. VERSION INTEGRITY: Only flag 'VERSION_INCONSISTENCY' if two different version numbers are explicitly used for the same tool. Do not guess.\n"
        "4. ARCHITECTURE COMPLIANCE: If the script uses 'amd64' or 'x86_64' but the Wiki uses 's390x', flag it as 'PARAMETER_MISMATCH'. The remediation MUST enforce the 's390x' value.\n"
        "5. MISSING STEPS: If a command exists in the Wiki but is entirely absent from the script, flag it as 'MISSING_STEP'.\n"
        "</STRICT_CONSTRAINTS>\n\n"
        "<FEW_SHOT_EXAMPLES>\n"
        "EXAMPLE DISCREPANCY JSON OUTPUT:\n"
        "{{\n"
        "  \"id\": \"missing-cython\",\n"
        "  \"type\": \"MISSING_STEP\",\n"
        "  \"severity\": \"CRITICAL\",\n"
        "  \"title\": \"Missing Python Cython Dependency\",\n"
        "  \"description\": \"The Wiki requires cython==0.29.36 for s390x compilation, but the script omits it.\",\n"
        "  \"biReference\": \"pip3 install cython==0.29.36 cqlsh==6.2.0\",\n"
        "  \"scriptReference\": \"\",\n"
        "  \"impact\": \"Native extensions will fail to build on s390x without Cython.\",\n"
        "  \"remediation\": \"Add pip3 install command for cython and cqlsh.\",\n"
        "  \"suggestedPatchSnippet\": \"pip3 install cython==0.29.36 cqlsh==6.2.0\"\n"
        "}}\n"
        "</FEW_SHOT_EXAMPLES>\n\n"
        "<WIKI_INSTRUCTIONS_GOLDEN>\n{wiki}\n</WIKI_INSTRUCTIONS_GOLDEN>\n\n"
        "<BASH_SCRIPT_AUDIT_TARGET>\n{script}\n</BASH_SCRIPT_AUDIT_TARGET>\n\n"
        "Output your report strictly adhering to the JSON schema provided."
    )
    
    wiki_str = json.dumps([s.model_dump() for s in wiki_spec.steps], indent=2)
    script_str = "\n".join(script_commands)
    
    # Truncate script to avoid context window explosion
    chain = prompt | structured_llm
    report_obj = chain.invoke({"wiki": wiki_str, "script": script_str[:12000]})
    
    report_dict = report_obj.model_dump()
    report_dict["total_wiki_steps"] = len(wiki_spec.steps)
    
    missing_count = len([d for d in report_dict["discrepancies"] if d["type"] == "MISSING_STEP"])
    report_dict["matched_steps"] = max(0, len(wiki_spec.steps) - missing_count)
    
    return report_dict