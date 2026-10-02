import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info, CheckCircle2, Server, Terminal, GitCommit } from 'lucide-react';
import { ValidationReport } from '../types/validator';

interface ComplianceScoreCardProps {
  report: ValidationReport;
}

export const ComplianceScoreCard: React.FC<ComplianceScoreCardProps> = ({ report }) => {
  const { complianceScore, discrepancies } = report;

  const criticalCount = discrepancies.filter(d => d.severity === 'CRITICAL').length;
  const warningCount = discrepancies.filter(d => d.severity === 'WARNING').length;
  const infoCount = discrepancies.filter(d => d.severity === 'INFO').length;

  // Determine score color & rating
  let scoreColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
  let badgeText = 'High Compliance';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (complianceScore < 60) {
    scoreColor = 'text-rose-400 border-rose-500/40 bg-rose-950/20';
    badgeText = 'Severe Discrepancies';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (complianceScore < 85) {
    scoreColor = 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    badgeText = 'Action Required';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  return (
    <div className="glass-panel rounded-xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Top Header: Score & Target */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        {/* Left: Score Gauge */}
        <div className="flex items-center space-x-5">
          <div className={`relative flex items-center justify-center w-24 h-24 rounded-2xl border-2 ${scoreColor} shadow-inner`}>
            <div className="text-center">
              <span className="text-3xl font-extrabold tracking-tight font-mono">
                {complianceScore}%
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Score
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${badgeColor}`}>
                {badgeText}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {report.packageName} {report.packageVersion} Compliance Audit
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Target Architecture: <span className="text-slate-200 font-mono">Linux on IBM Z (s390x)</span>
            </p>
          </div>
        </div>

        {/* Severity Metrics */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-slate-900/80 border border-rose-500/20 rounded-xl p-3.5 text-center min-w-[90px]">
            <div className="flex items-center justify-center space-x-1 text-rose-400 text-xs font-semibold mb-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Critical</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">{criticalCount}</span>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3.5 text-center min-w-[90px]">
            <div className="flex items-center justify-center space-x-1 text-amber-400 text-xs font-semibold mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Warning</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">{warningCount}</span>
          </div>

          <div className="bg-slate-900/80 border border-blue-500/20 rounded-xl p-3.5 text-center min-w-[90px]">
            <div className="flex items-center justify-center space-x-1 text-blue-400 text-xs font-semibold mb-1">
              <Info className="w-3.5 h-3.5" />
              <span>Info</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">{infoCount}</span>
          </div>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <span className="block text-[11px] text-slate-400 font-medium">Documented Steps</span>
          <span className="text-lg font-bold text-white font-mono">{report.totalExpectedSteps}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <span className="block text-[11px] text-emerald-400 font-medium">Matched Steps</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">{report.matchedSteps}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <span className="block text-[11px] text-rose-400 font-medium">Missing Steps</span>
          <span className="text-lg font-bold text-rose-400 font-mono">{report.missingSteps}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <span className="block text-[11px] text-amber-400 font-medium">Param Mismatches</span>
          <span className="text-lg font-bold text-amber-400 font-mono">{report.parameterMismatches}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <span className="block text-[11px] text-indigo-400 font-medium">Version Conflicts</span>
          <span className="text-lg font-bold text-indigo-400 font-mono">{report.versionInconsistencies}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <span className="block text-[11px] text-blue-400 font-medium">Additional Steps</span>
          <span className="text-lg font-bold text-blue-400 font-mono">{report.additionalSteps}</span>
        </div>
      </div>

      {/* Executive AI Summary Box */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-indigo-950/20 border border-blue-500/20">
        <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          Executive Architecture Summary
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          {report.summary}
        </p>
      </div>
    </div>
  );
};
