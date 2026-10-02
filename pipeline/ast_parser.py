import os
import bashlex

def extract_script_commands(file_path: str) -> list:
    """Safely parses a shell script into an AST to extract literal commands."""
    extracted_commands = []
    
    if not os.path.exists(file_path):
        return extracted_commands

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            clean_line = line.strip()
            if not clean_line or clean_line.startswith("#"):
                continue
            try:
                # Build AST safely via bashlex
                trees = bashlex.parse(clean_line)
                for tree in trees:
                    extracted_commands.append(clean_line)
            except Exception:
                # Bypass complex bash 4.0+ array logic for the MVP
                pass
                
    return extracted_commands