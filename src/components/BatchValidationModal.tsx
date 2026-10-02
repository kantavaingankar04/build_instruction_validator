import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Loader2, 
  Download, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { SAMPLE_PACKAGES } from '../data/samplePackages';
import { IBMZPackage, ValidationReport } from '../types/validator';
import { performRuleBasedAnalysis } from '../services/analyzer';

interface BatchValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: ValidationReport, pkg: IBMZPackage) => void;
}

interface BatchItemStatus {
  pkg: IBMZPackage;
  status: 'pending' | 'running' | 'completed' | 'error';
  report?: ValidationReport;
  error?: string;
}

export const BatchValidationModal: React.FC<BatchValidationModalProps> = ({
  isOpen,
  onClose,
  onSelectReport
}) => {
  if (!isOpen) return null;

  const [items, setItems] = useState<BatchItemStatus[]>(() =>
    SAMPLE_PACKAGES.map(pkg => ({
      pkg,
      status: 'pending'
    }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const runBatch = async () => {
    setIsRunning(true);

    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      setCurrentIndex(i);
      updated[i].status = 'running';
      setItems([...updated]);

      try {
        // Run analysis via API or deterministic fallback
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageName: updated[i].pkg.name,
            packageVersion: updated[i].pkg.version,
            wikiMarkdown: updated[i].pkg.rawWiki,
            scriptContent: updated[i].pkg.rawScript,
            distroTarget: updated[i].pkg.distro
          })
        });

        let report: ValidationReport;
        if (res.ok) {
          report = await res.json();
        } else {
          // Rule based fallback
          report = performRuleBasedAnalysis(
            updated[i].pkg.name,
            updated[i].pkg.version,
            updated[i].pkg.rawWiki,
            updated[i].pkg.rawScript,
            updated[i].pkg.distro
          );
        }

        updated[i].report = report;
        updated[i].status = 'completed';
      } catch (err) {
        // Fallback
        const report = performRuleBasedAnalysis(
          updated[i].pkg.name,
          updated[i].pkg.version,
          updated[i].pkg.rawWiki,
          updated[i].pkg.rawScript,
          updated[i].pkg.distro
        );
        updated[i].report = report;
        updated[i].status = 'completed';
      }

      setItems([...updated]);
      // Small pause for visual flow
      await new Promise(r => setTimeout(r, 400));
    }

    setIsRunning(false);
    setCurrentIndex(-1);
  };

  const completedCount = items.filter(i => i.status === 'completed').length;
  const averageCompliance = completedCount > 0
    ? Math.round(
        items.reduce((acc, i) => acc + (i.report?.complianceScore || 0), 0) / completedCount
      )
    : 0;

  const downloadBatchSummary = () => {
    const lines = [
      '# Linux on IBM Z (s390x) Batch Build Instruction Validation Summary',
      `Generated: ${new Date().toISOString()}`,
      `Total Packages Audited: ${completedCount}`,
      `Average Compliance Score: ${averageCompliance}%\n`,
      '| Package | Version | Compliance | Missing Steps | Param Mismatches | Version Divergence | Status |',
      '|---|---|---|---|---|---|---|'
    ];

    items.forEach(i => {
      if (i.report) {
        lines.push(
          `| ${i.pkg.name} | ${i.pkg.version} | ${i.report.complianceScore}% | ${i.report.missingSteps} | ${i.report.parameterMismatches} | ${i.report.versionInconsistencies} | Completed |`
        );
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ibm_z_batch_validation_summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel-elevated rounded-2xl w-full max-w-3xl border border-slate-700 p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Multi-Package Batch Auditor
            </h3>
            <p className="text-xs text-slate-400">
              Run automated cross-validation across all registered Linux on IBM Z packages
            </p>
          </div>
        </div>

        {/* Status bar */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center space-x-4">
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">Batch Progress</span>
              <span className="text-sm font-bold text-white font-mono">
                {completedCount} / {items.length} Packages
              </span>
            </div>
            {completedCount > 0 && (
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Avg Compliance</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {averageCompliance}%
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {completedCount === items.length && (
              <button
                onClick={downloadBatchSummary}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Markdown</span>
              </button>
            )}

            <button
              onClick={runBatch}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md flex items-center space-x-2 transition"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Batch Validation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Packages List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div
              key={item.pkg.id}
              className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                item.status === 'running'
                  ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs font-semibold text-slate-300">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-sm">
                      {item.pkg.name}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      v{item.pkg.version}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {item.pkg.distro}
                  </span>
                </div>
              </div>

              {/* Status / Results */}
              <div className="flex items-center space-x-3">
                {item.status === 'pending' && (
                  <span className="text-xs text-slate-500 px-2.5 py-1 rounded-md bg-slate-800/60">
                    Pending
                  </span>
                )}
                {item.status === 'running' && (
                  <span className="text-xs text-indigo-400 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30">
                    <Loader2 className="w-3 h-3 animate-spin" /> Auditing...
                  </span>
                )}
                {item.status === 'completed' && item.report && (
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        {item.report.complianceScore}% Score
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {item.report.discrepancies.length} Discrepancies
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectReport(item.report!, item.pkg);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1 transition"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
