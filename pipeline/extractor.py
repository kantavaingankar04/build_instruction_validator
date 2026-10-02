import os
from langchain_core.prompts import PromptTemplate
from langchain_ollama import ChatOllama
from schemas import PackageBuildSpec

def extract_wiki_steps(markdown_text: str) -> PackageBuildSpec:
    """Uses local llama3.2:3b (via Ollama) to parse unstructured Markdown into strict JSON."""
    llm = ChatOllama(model="llama3.2:3b", temperature=0)
    structured_llm = llm.with_structured_output(PackageBuildSpec)
    
    prompt = PromptTemplate.from_template(
        "You are an elite IBM Z (s390x) Linux architecture parser. Your task is to extract sequential build steps from the following Wiki Markdown.\n\n"
        "<STRICT_CONSTRAINTS>\n"
        "1. RHEL ONLY: Only extract steps intended for RHEL (Red Hat Enterprise Linux).\n"
        "2. EXCLUDE OTHERS: Completely ignore Ubuntu, SLES, or Debian specific commands (e.g., ignore 'apt-get').\n"
        "3. COMMAND FOCUS: Extract the exact raw bash commands. Do not paraphrase them.\n"
        "4. SEQUENTIAL ORDER: Maintain the exact chronological order of execution.\n"
        "</STRICT_CONSTRAINTS>\n\n"
        "<WIKI_MARKDOWN>\n{text}\n</WIKI_MARKDOWN>\n\n"
        "Output your extraction strictly adhering to the requested JSON schema."
    )
    
    extraction_chain = prompt | structured_llm
    print("Sending Markdown to local llama3.2:3b for processing...")
    # Llama 3.2 3B supports a context window well beyond 3,000 characters
    result: PackageBuildSpec = extraction_chain.invoke({"text": markdown_text[:14000]})
    return result