import React, { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  ArrowRight,
  Cpu,
  BookOpen,
  Terminal,
  Wrench
} from 'lucide-react';
import { DiscrepancyItem, DiscrepancySeverity, DiscrepancyType } from '../types/validator';

interface DiscrepancyListProps {
  discrepancies: DiscrepancyItem[];
}

export const DiscrepancyList: React.FC<DiscrepancyListProps> = ({ discrepancies }) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPatch = (id: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter items
  const filtered = discrepancies.filter(item => {
    if (selectedType !== 'ALL' && item.type !== selectedType) return false;
    if (selectedSeverity !== 'ALL' && item.severity !== selectedSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.impact.toLowerCase().includes(q) ||
        item.remediation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (sev: DiscrepancySeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="w-3 h-3" /> Critical
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Warning
          </span>
        );
      case 'INFO':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  const getTypeLabel = (type: DiscrepancyType) => {
    switch (type) {
      case 'MISSING_STEP': return 'Missing Step in Script';
      case 'ADDITIONAL_SCRIPT_STEP': return 'Additional Undocumented Step';
      case 'PARAMETER_MISMATCH': return 'Parameter Mismatch';
      case 'VERSION_INCONSISTENCY': return 'Version Inconsistency';
      case 'ENVIRONMENT_MISMATCH': return 'Environment Mismatch';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 border border-slate-800 shadow-xl space-y-5">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            Classified Discrepancies Matrix
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {filtered.length} of {discrepancies.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed breakdown comparing documented Build Instructions against script execution
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discrepancies..."
            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Type pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'All Discrepancies' },
            { id: 'MISSING_STEP', label: 'Missing Steps' },
            { id: 'PARAMETER_MISMATCH', label: 'Parameter Mismatches' },
            { id: 'VERSION_INCONSISTENCY', label: 'Version Divergence' },
            { id: 'ADDITIONAL_SCRIPT_STEP', label: 'Additional Steps' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedType === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Severity dropdown/pills */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-500 px-1.5 font-medium">Severity:</span>
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(sev => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                selectedSeverity === sev
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Discrepancy Cards List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h4 className="text-sm font-semibold text-white">No discrepancies match the active filters</h4>
          <p className="text-xs text-slate-400 mt-1">All documented build instructions match or no items meet criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 hover:border-slate-700 transition shadow-md"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {getTypeLabel(item.type)}
                  </span>
                  <h4 className="text-sm font-semibold text-white tracking-tight">
                    {item.title}
                  </h4>
                </div>
                <div>{getSeverityBadge(item.severity)}</div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {item.description}
              </p>

              {/* Side-by-side Evidence Box */}
              {(item.biReference || item.scriptReference) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {/* BI Reference */}
                  <div className="rounded-lg bg-blue-950/20 border border-blue-500/20 p-3">
                    <div className="flex items-center space-x-1.5 text-blue-400 text-[11px] font-semibold mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Documented in Build Instructions</span>
                    </div>
                    <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap break-all bg-[#090d16] p-2 rounded border border-slate-800">
                      {item.biReference || 'Omitted in documentation'}
                    </pre>
                  </div>

                  {/* Script Reference */}
                  <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-3">
                    <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-semibold mb-1">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Found in Automation Script</span>
                    </div>
                    <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap break-all bg-[#090d16] p-2 rounded border border-slate-800">
                      {item.scriptReference || 'Missing from script'}
                    </pre>
                  </div>
                </div>
              )}

              {/* Linux on IBM Z Architecture Impact */}
              {item.impact && (
                <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start space-x-2.5">
                  <Cpu className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                      IBM Z (s390x) Architecture Impact
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      {item.impact}
                    </p>
                  </div>
                </div>
              )}

              {/* Actionable Remediation & Suggested Patch */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-2">
                  <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/90 font-medium">
                    <span className="text-amber-400 font-semibold">Remediation: </span>
                    {item.remediation}
                  </p>
                </div>

                {item.suggestedPatchSnippet && (
                  <button
                    onClick={() => copyPatch(item.id, item.suggestedPatchSnippet)}
                    className="shrink-0 flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied Patch</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Patch</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
