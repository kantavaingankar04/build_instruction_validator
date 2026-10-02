import React from 'react';
import { Cpu, Terminal, GitPullRequest, Layers, FileText, Info, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onOpenBatch: () => void;
  onOpenPRModal: () => void;
  onOpenExport: () => void;
  onOpenAbout: () => void;
  hasReport: boolean;
  engine: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBatch,
  onOpenPRModal,
  onOpenExport,
  onOpenAbout,
  hasReport,
  engine
}) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & IBM Z Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Cpu className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
                Build Instruction Validator
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  s390x
                </span>
              </span>
              <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Validation Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              • Build Instructions (BI) & Automation Scripts Auditor
            </p>
          </div>
        </div>

        {/* Engine status & Action Bar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Active Engine Badge */}
          <div className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Engine:</span>
            <span className="font-mono text-emerald-300">{engine || 'Local LLM + AST'}</span>
          </div>

          {/* Batch Modal CTA */}
          <button
            onClick={onOpenBatch}
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Run batch validation across multiple packages"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Batch Audit</span>
          </button>

          {/* Export Report CTA */}
          {hasReport && (
            <button
              onClick={onOpenExport}
              className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Export HTML or Markdown reports"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Report</span>
            </button>
          )}

          {/* Create PR on Fork */}
          {hasReport && (
            <button
              onClick={onOpenPRModal}
              className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
              title="Automate Pull Request to your forked repository"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-white" />
              <span>Create Fork PR</span>
            </button>
          )}

          {/* About / Mentorship Info */}
          <button
            onClick={onOpenAbout}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Mentorship project info and success criteria"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
