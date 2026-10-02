import React, { useState } from 'react';
import { 
  X, 
  GitPullRequest, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Key, 
  User, 
  GitBranch, 
  Loader2, 
  Terminal, 
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PRAutomationResponse, ValidationReport } from '../types/validator';

interface GitHubPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ValidationReport;
}

export const GitHubPRModal: React.FC<GitHubPRModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen) return null;

  const [forkOwner, setForkOwner] = useState('jayeshvaingankar04');
  const [forkRepo, setForkRepo] = useState('scripts');
  const [branchName, setBranchName] = useState(
    `fix/${report.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-bi-alignment-${Date.now().toString().slice(-4)}`
  );
  const [githubToken, setGithubToken] = useState('');
  const [prTitle, setPrTitle] = useState(
    `fix(${report.packageName}): align build script with Linux on IBM Z Build Instructions`
  );
  const [prBody, setPrBody] = useState(
    `### Linux on IBM Z: Build Instruction Discrepancy Remediation\n\n` +
    `This Pull Request reconciles the automation script with the documented Build Instructions in the Linux on IBM Z Wiki.\n\n` +
    `#### Summary of Remediations:\n` +
    `- **Package**: ${report.packageName} (${report.packageVersion})\n` +
    `- **Target Architecture**: s390x\n` +
    `- **Original Compliance Score**: ${report.complianceScore}%\n` +
    `- **Fixed Discrepancies**: ${report.discrepancies.length} items (${report.missingSteps} missing steps, ${report.parameterMismatches} parameter mismatches, ${report.versionInconsistencies} version inconsistencies)\n\n` +
    `#### Key Changes Implemented:\n` +
    report.discrepancies.map(d => `- **[${d.type}]** ${d.title}: ${d.remediation}`).join('\n') +
    `\n\n*Generated automatically by AI Assistant for Build Instruction Validation.*`
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PRAutomationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCmds, setCopiedCmds] = useState(false);

  const isUpstreamForbidden =
    forkOwner.trim().toLowerCase() === 'linux-on-ibm-z' ||
    forkOwner.trim().toLowerCase() === 'linux-on-ibm-z-scripts';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpstreamForbidden) {
      setErrorMsg('Cannot target upstream linux-on-ibm-z repository. Please use your personal fork username.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const response = await fetch('/api/create-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken: githubToken.trim() || undefined,
          forkOwner: forkOwner.trim(),
          forkRepo: forkRepo.trim(),
          targetPackage: report.packageName,
          packageVersion: report.packageVersion,
          branchName: branchName.trim(),
          prTitle: prTitle.trim(),
          prBody: prBody.trim(),
          remediatedScript: report.suggestedRemediationScript,
          targetFilePath: `${report.packageName}/${report.packageVersion}/build_${report.packageName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.sh`
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to automate Pull Request.');
      }

      setResult(data);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'PR generation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cliInstructions = `# Clone your fork:
git clone https://github.com/${forkOwner}/${forkRepo}.git
cd ${forkRepo}

# Create fix branch:
git checkout -b ${branchName}

# Save remediated script and commit:
git commit -am "${prTitle}"

# Push to your fork:
git push origin ${branchName}
`;

  const copyCli = () => {
    navigator.clipboard.writeText(cliInstructions);
    setCopiedCmds(true);
    setTimeout(() => setCopiedCmds(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel-elevated rounded-2xl w-full max-w-2xl border border-slate-700 p-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Automated Pull Request Generator
            </h3>
            <p className="text-xs text-slate-400">
              Submit AI-remediated build script corrections to your forked repository
            </p>
          </div>
        </div>

        {/* Strict Mentorship PDF Guard Banner */}
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start space-x-2.5 mb-5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Mentorship Compliance Requirement: </span>
            Pull Requests must ONLY be created against your <strong>FORKED repository</strong> (e.g. <code>your-username/scripts</code>). Do NOT target upstream <code>linux-on-ibm-z</code> repositories.
          </div>
        </div>

        {result ? (
          /* Success Screen */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm mb-1">
                <CheckCircle2 className="w-5 h-5" />
                <span>{result.mode === 'github_live' ? 'Pull Request Created on GitHub!' : 'PR Branch Prepared (Sandbox Mode)'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.message}
              </p>
            </div>

            {result.mode === 'github_live' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={result.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg transition"
                >
                  <span>Open Pull Request on GitHub</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {result.branchUrl && (
                  <a
                    href={result.branchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-700 transition"
                  >
                    <span>View Branch</span>
                    <GitBranch className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}

            {/* CLI Instructions */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 mt-2">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-mono text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" /> CLI Equivalent Commands
                </span>
                <button
                  onClick={copyCli}
                  className="hover:text-white flex items-center gap-1 text-[11px] transition"
                >
                  {copiedCmds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmds ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-emerald-400/90 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {cliInstructions}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setResult(null)}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                Back to Form
              </button>
            </div>
          </div>
        ) : (
          /* PR Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Fork Owner */}
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Your GitHub Username (Fork Owner) *
                </label>
                <input
                  type="text"
                  required
                  value={forkOwner}
                  onChange={(e) => setForkOwner(e.target.value)}
                  placeholder="e.g. jayeshvaingankar04"
                  className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Fork Repo */}
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                  Forked Repository Name *
                </label>
                <input
                  type="text"
                  required
                  value={forkRepo}
                  onChange={(e) => setForkRepo(e.target.value)}
                  placeholder="scripts"
                  className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Branch Name */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">
                Remediation Branch Name
              </label>
              <input
                type="text"
                required
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Optional GitHub Token */}
            <div>
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  GitHub Personal Access Token (Optional)
                </span>
                <span className="text-[10px] text-slate-500">
                  Leave blank for Sandbox Mode
                </span>
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Optional with 'repo' scope)"
                className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If omitted, the assistant creates a simulated PR bundle with verifiable Git commands and direct GitHub fork link.
              </p>
            </div>

            {/* PR Title */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">
                Pull Request Title
              </label>
              <input
                type="text"
                required
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* PR Description */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">
                Pull Request Body (Markdown)
              </label>
              <textarea
                rows={5}
                value={prBody}
                onChange={(e) => setPrBody(e.target.value)}
                className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUpstreamForbidden}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md flex items-center space-x-2 transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing PR...</span>
                  </>
                ) : (
                  <>
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>Create Pull Request on Fork</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
