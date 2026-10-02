# github_integrator.py
import os
from github import Github

def create_remediation_pr(github_user: str, package: str, script_path: str, report: dict):
    """Creates a branch, commits AI fixes, and opens a PR on the forked repository."""
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("\n[!] GitHub Integration Skipped: No 'GITHUB_TOKEN' found in environment.")
        return
        
    print(f"\n[+] Authenticating with GitHub for user {github_user}...")
    try:
        g = Github(token)
        repo = g.get_repo(f"{github_user}/scripts")
        
        # 1. Create a new branch from master
        base_branch = repo.get_branch("master")
        new_branch_name = f"ai-fix-{package.lower().replace(' ', '-')}-build"
        
        try:
            repo.create_git_ref(ref=f"refs/heads/{new_branch_name}", sha=base_branch.commit.sha)
            print(f"  -> Created new branch: {new_branch_name}")
        except Exception:
            print(f"  -> Branch {new_branch_name} already exists. Updating...")

        # 2. Formulate the AI Bash snippets
        fix_snippets = "\n\n# === AI REMEDIATION SNIPPETS ===\n"
        for m in report['missing_steps']:
            fix_snippets += f"# Step {m['step']} ({m['phase']})\n{m['expected_command']}\n"
            
        # 3. Commit the fixes to the file
        file_contents = repo.get_contents(script_path, ref="master")
        new_file_content = file_contents.decoded_content.decode("utf-8") + fix_snippets
        
        repo.update_file(
            path=file_contents.path,
            message=f"Auto-commit: AI recommended script fixes for {package}",
            content=new_file_content,
            sha=file_contents.sha,
            branch=new_branch_name
        )
        print("  -> Committed AI recommendations to script.")
        
        # 4. Open the Pull Request
        pr_body = f"### AI Validation Remediation\nAutomatically generated bash fixes for **{package}** based on Wiki discrepancies."
        pr = repo.create_pull(
            title=f"Fix: AI Remediation for {package} Build Script",
            body=pr_body,
            head=new_branch_name,
            base="master"
        )
        print(f"[+] Successfully opened Pull Request: {pr.html_url}")
        
    except Exception as e:
        print(f"[!] GitHub API Error: {e}")
