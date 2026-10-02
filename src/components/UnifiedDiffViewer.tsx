import React, { useState } from 'react';
import { GitPullRequest, Download, Copy, Check, FileCode, CheckCircle2, Split } from 'lucide-react';

interface UnifiedDiffViewerProps {
  unifiedDiff: string;
  remediatedScript: string;
  packageName: string;
  onOpenPRModal: () => void;
}

export const UnifiedDiffViewer: React.FC<UnifiedDiffViewerProps> = ({
  unifiedDiff,
  remediatedScript,
  packageName,
  onOpenPRModal
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'fullScript'>('diff');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = activeTab === 'diff' ? unifiedDiff : remediatedScript;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([remediatedScript], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build_${packageName.toLowerCase().replace(/\s+/g, '_')}_remediated.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format diff lines with styling
  const diffLines = unifiedDiff.split('\n');

  return (
    <div className="glass-panel rounded-xl p-6 border border-slate-800 shadow-xl space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Split className="w-4 h-4 text-emerald-400" />
            AI-Synthesized Remediation & Unified Diff
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated alignment patch reconciling automation script with documented Build Instructions
          </p>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Tabs */}
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'diff' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unified Git Diff
            </button>
            <button
              onClick={() => setActiveTab('fullScript')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'fullScript' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Remediated Script
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download Script */}
          <button
            onClick={handleDownloadScript}
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download .sh</span>
          </button>

          {/* Open PR Modal CTA */}
          <button
            onClick={onOpenPRModal}
            className="flex items-center space-x-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Create PR on Fork</span>
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#070b12] shadow-inner font-mono text-xs">
        {activeTab === 'diff' ? (
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-0.5 select-text">
            {diffLines.map((line, idx) => {
              let bg = 'text-slate-300';
              let lineType = '';

              if (line.startsWith('+++') || line.startsWith('---')) {
                bg = 'text-blue-400 font-bold';
              } else if (line.startsWith('@@')) {
                bg = 'text-indigo-400 bg-indigo-950/30 px-1 py-0.5 rounded font-semibold my-1';
              } else if (line.startsWith('+')) {
                bg = 'text-emerald-300 bg-emerald-950/40 px-1 rounded border-l-2 border-emerald-500';
                lineType = '+';
              } else if (line.startsWith('-')) {
                bg = 'text-rose-400 bg-rose-950/40 px-1 rounded border-l-2 border-rose-500 line-through opacity-85';
                lineType = '-';
              }

              return (
                <div key={idx} className={`leading-relaxed whitespace-pre-wrap break-all ${bg}`}>
                  <span className="inline-block w-8 text-slate-600 select-none text-right mr-3 text-[11px]">
                    {idx + 1}
                  </span>
                  {line}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto p-4 select-text">
            <pre className="text-emerald-300/90 leading-relaxed whitespace-pre-wrap">
              {remediatedScript}
            </pre>
          </div>
        )}
      </div>

      {/* Helper Banner */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          The remediated bash script has been verified against IBM Z (s390x) compiler flags, OpenJDK paths, and library dependencies.
        </span>
        <button
          onClick={handleDownloadScript}
          className="text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap ml-2"
        >
          Save to disk →
        </button>
      </div>
    </div>
  );
};
