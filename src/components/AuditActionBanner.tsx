import React from 'react';
import { Play, Sparkles, Loader2, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

interface AuditActionBannerProps {
  onRunAudit: () => void;
  isLoading: boolean;
  pipelineStep: number; // 0 to 5
  packageName: string;
}

const PIPELINE_STAGES = [
  'Ingesting BI Markdown & Shell AST Parsing',
  'Semantic Extraction of Prerequisites & Dependencies',
  'AST Command Sequence & Parameter Alignment',
  'Discrepancy Classification & Architecture Risk Impact (s390x)',
  'Unified Patch & Remediated Script Synthesis'
];

export const AuditActionBanner: React.FC<AuditActionBannerProps> = ({
  onRunAudit,
  isLoading,
  pipelineStep,
  packageName
}) => {
  return (
    <div className="glass-panel-elevated rounded-xl p-5 border border-blue-500/30 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">
              Automated Discrepancy Analysis
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Compare Build Instructions against Script for {packageName}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            AI-driven verification engine extracts intent from Wiki documentation, performs Abstract Syntax Tree (AST) command tokenization on Bash scripts, classifies discrepancies, and drafts GitHub pull requests against your fork.
          </p>
        </div>

        {/* CTA Button */}
        <div>
          <button
            onClick={onRunAudit}
            disabled={isLoading}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2.5 transition-all shadow-lg ${
              isLoading
                ? 'bg-blue-900/60 text-blue-300 border border-blue-500/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 border border-blue-400/40 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                <span>Running Audit Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run AI Audit & Compare</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Pipeline Progress Steps */}
      {isLoading && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-medium flex items-center gap-1.5 text-blue-300">
                <Cpu className="w-3.5 h-3.5 animate-pulse" />
                Stage {pipelineStep + 1} of {PIPELINE_STAGES.length}: {PIPELINE_STAGES[pipelineStep]}
              </span>
              <span className="font-mono text-slate-400">
                {Math.round(((pipelineStep + 1) / PIPELINE_STAGES.length) * 100)}%
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full transition-all duration-500 ease-out"
                style={{ width: `${((pipelineStep + 1) / PIPELINE_STAGES.length) * 100}%` }}
              ></div>
            </div>

            {/* Stage micro-indicators */}
            <div className="grid grid-cols-5 gap-1 text-[10px] text-slate-400 mt-1">
              {PIPELINE_STAGES.map((stage, idx) => (
                <div
                  key={idx}
                  className={`truncate flex items-center gap-1 ${
                    idx <= pipelineStep ? 'text-blue-300 font-medium' : 'text-slate-600'
                  }`}
                  title={stage}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${idx <= pipelineStep ? 'bg-blue-400' : 'bg-slate-700'}`}></span>
                  {stage.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
