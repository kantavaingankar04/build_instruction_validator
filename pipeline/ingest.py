# ingest.py
import os
import requests

def fetch_raw_content(url: str, artifact_name: str) -> str:
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as err:
        print(f"[!] Warning: Network error fetching {artifact_name}: {err}")
        return ""

def ingest_artifacts(username: str, package: str, wiki_url: str, script_path: str):
    script_url = f"https://raw.githubusercontent.com/{username}/scripts/master/{script_path}"
    
    print(f"  -> Fetching artifacts from fork...")
    wiki_content = fetch_raw_content(wiki_url, f"{package} Wiki")
    script_content = fetch_raw_content(script_url, f"{package} Script")
    
    os.makedirs("data", exist_ok=True)
    safe_name = package.lower().replace(" ", "_")
    
    with open(f"data/{safe_name}_wiki.md", "w", encoding="utf-8") as f:
        f.write(wiki_content)
    with open(f"data/{safe_name}_script.sh", "w", encoding="utf-8") as f:
        f.write(script_content)
        
    return wiki_content, script_content