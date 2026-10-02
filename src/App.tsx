import React, { useState, useEffect } from 'react';
import { SAMPLE_PACKAGES } from './data/samplePackages';
import { IBMZPackage, ValidationReport } from './types/validator';
import { performRuleBasedAnalysis } from './services/analyzer';
import { Header } from './components/Header';
import { PackageSelector } from './components/PackageSelector';
import { SourceEditorViewer } from './components/SourceEditorViewer';
import { AuditActionBanner } from './components/AuditActionBanner';
import { ComplianceScoreCard } from './components/ComplianceScoreCard';
import { DiscrepancyList } from './components/DiscrepancyList';
import { UnifiedDiffViewer } from './components/UnifiedDiffViewer';
import { GitHubPRModal } from './components/GitHubPRModal';
import { BatchValidationModal } from './components/BatchValidationModal';
import { ReportExportModal } from './components/ReportExportModal';
import { MentorshipModal } from './components/MentorshipModal';

export default function App() {
  const [registryPackages, setRegistryPackages] = useState<IBMZPackage[]>(() => {
    const saved = localStorage.getItem('ibmz_registry_packages');
    if (saved) {
      return [...SAMPLE_PACKAGES, ...JSON.parse(saved)];
    }
    return SAMPLE_PACKAGES;
  });
  const [selectedPackage, setSelectedPackage] = useState<IBMZPackage>(registryPackages[0]);
  const [isCustom, setIsCustom] = useState(false);
  const [wikiMarkdown, setWikiMarkdown] = useState(registryPackages[0].rawWiki);
  const [scriptContent, setScriptContent] = useState(registryPackages[0].rawScript);
  const [distroTarget, setDistroTarget] = useState(registryPackages[0].distro);
  
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [engine, setEngine] = useState('Local LLM + AST');

  const [isFetchingWiki, setIsFetchingWiki] = useState(false);
  const [isFetchingScript, setIsFetchingScript] = useState(false);

  // Modals
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Run initial baseline validation on mount
  useEffect(() => {
    const initialReport = performRuleBasedAnalysis(
      selectedPackage.name,
      selectedPackage.version,
      selectedPackage.rawWiki,
      selectedPackage.rawScript,
      selectedPackage.distro
    );
    setReport(initialReport);
  }, []);

  const handleSelectPackage = (pkg: IBMZPackage) => {
    setSelectedPackage(pkg);
    setWikiMarkdown(pkg.rawWiki);
    setScriptContent(pkg.rawScript);
    setDistroTarget(pkg.distro);
    
    // Immediate local baseline
    const fastReport = performRuleBasedAnalysis(
      pkg.name,
      pkg.version,
      pkg.rawWiki,
      pkg.rawScript,
      pkg.distro
    );
    setReport(fastReport);
  };

  const handleResetToSample = () => {
    setWikiMarkdown(selectedPackage.rawWiki);
    setScriptContent(selectedPackage.rawScript);
  };

  const handleRunAudit = async () => {
    setIsLoading(true);
    setPipelineStep(0);

    // Real-time progress is now driven by backend stream

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: selectedPackage.name,
          packageVersion: selectedPackage.version,
          wikiMarkdown,
          scriptContent,
          distroTarget
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.step !== undefined) {
                setPipelineStep(data.step);
              } else if (data.report) {
                setReport(data.report);
                if (data.report.engine) {
                  if (data.report.engine.includes('Python Pipeline')) {
                    setEngine('LLM + Semantic Search Pipeline');
                  } else if (data.report.engine.includes('fallback')) {
                    setEngine('AST Rule Engine (Fallback)');
                  } else {
                    setEngine(data.report.engine);
                  }
                }
              }
            } catch (e) {
              console.warn('Parse err on chunk:', e, line);
            }
          }
        }
      } else {
        // Fallback to client-side rule analysis
        const fallback = performRuleBasedAnalysis(
          selectedPackage.name,
          selectedPackage.version,
          wikiMarkdown,
          scriptContent,
          distroTarget
        );
        setReport(fallback);
      }
    } catch (err) {
      console.warn('API error, using local AST rule engine:', err);
      const fallback = performRuleBasedAnalysis(
        selectedPackage.name,
        selectedPackage.version,
        wikiMarkdown,
        scriptContent,
        distroTarget
      );
      setReport(fallback);
    } finally {
      setPipelineStep(4);
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  const handleCustomFetch = async (type: 'wiki' | 'script', url: string) => {
    if (type === 'wiki') setIsFetchingWiki(true);
    else setIsFetchingScript(true);

    try {
      const res = await fetch('/api/fetch-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (res.ok && data.content) {
        if (data.content.trim().toLowerCase().startsWith('<!doctype html>') || data.content.trim().toLowerCase().startsWith('<html')) {
          alert('Error: The URL returned an HTML page instead of raw markdown/bash. Make sure you are using a raw file link or a valid wiki link (not a directory /tree/ link).');
          return;
        }
        
        if (type === 'wiki') {
          setWikiMarkdown(data.content);
          let pkgName = 'Custom Package';
          const urlParts = url.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (url.includes('/wiki/')) {
            pkgName = lastPart.replace('Building-', '').replace(/-/g, ' ').replace('.md', '');
          } else {
            const h1Match = data.content.match(/^#\s*(?:Building\s*)?(.*?)(?:\s+version|\s+on\s+Linux|$)/im);
            if (h1Match) pkgName = h1Match[1].trim();
          }
          
          setSelectedPackage(prev => {
            let pkgVersion = prev.version;
            const versionMatch = data.content.match(/version\s+([0-9][0-9a-z.-]*)/i);
            if (versionMatch) pkgVersion = versionMatch[1];
            return { ...prev, id: 'custom', name: pkgName, version: pkgVersion, wikiUrl: url, rawWiki: data.content };
          });
        } else {
          setScriptContent(data.content);
          setSelectedPackage(prev => {
            let pkgVersion = prev.version;
            const urlVersionMatch = url.match(/\/([0-9][0-9a-z.-]*)\/[^/]+\.sh$/i);
            if (urlVersionMatch) {
              pkgVersion = urlVersionMatch[1];
            } else {
              const contentVersionMatch = data.content.match(/PACKAGE_VERSION=["']?([0-9][0-9a-z.-]*)["']?/i);
              if (contentVersionMatch) pkgVersion = contentVersionMatch[1];
            }
            return { ...prev, id: 'custom', version: pkgVersion, scriptUrl: url, rawScript: data.content };
          });
        }
      } else {
        alert(data.error || 'Failed to fetch content from GitHub.');
      }
    } catch (err) {
      alert('Error contacting proxy service.');
    } finally {
      if (type === 'wiki') setIsFetchingWiki(false);
      else setIsFetchingScript(false);
    }
  };

  const handleSaveToRegistry = () => {
    if (selectedPackage.id === 'custom') {
      const newPkg: IBMZPackage = {
        ...selectedPackage,
        id: `custom-${Date.now()}`,
        summary: 'User added custom package.'
      };
      setRegistryPackages(prev => {
        const next = [...prev, newPkg];
        const customOnly = next.filter(p => p.id.startsWith('custom-'));
        localStorage.setItem('ibmz_registry_packages', JSON.stringify(customOnly));
        return next;
      });
      setSelectedPackage(newPkg);
      setIsCustom(false);
    }
  };

  const handleDeleteFromRegistry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRegistryPackages(prev => {
      const next = prev.filter(p => p.id !== id);
      const customOnly = next.filter(p => p.id.startsWith('custom-'));
      localStorage.setItem('ibmz_registry_packages', JSON.stringify(customOnly));
      return next;
    });
    if (selectedPackage.id === id) {
      handleSelectPackage(SAMPLE_PACKAGES[0]);
    }
  };

  const handleBatchSelect = (batchReport: ValidationReport, pkg: IBMZPackage) => {
    setSelectedPackage(pkg);
    setWikiMarkdown(pkg.rawWiki);
    setScriptContent(pkg.rawScript);
    setDistroTarget(pkg.distro);
    setReport(batchReport);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenBatch={() => setIsBatchModalOpen(true)}
        onOpenPRModal={() => setIsPRModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        hasReport={!!report}
        engine={engine}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Section 1: Package Selector */}
        <PackageSelector
          selectedPackage={selectedPackage}
          onSelectPackage={handleSelectPackage}
          isCustom={isCustom}
          setIsCustom={setIsCustom}
          onCustomFetch={handleCustomFetch}
          isFetchingWiki={isFetchingWiki}
          isFetchingScript={isFetchingScript}
          registryPackages={registryPackages}
          onSaveToRegistry={handleSaveToRegistry}
          onDeleteFromRegistry={handleDeleteFromRegistry}
        />

        {/* Section 2: Dual-Pane Source Inspector / Editor */}
        <SourceEditorViewer
          wikiMarkdown={wikiMarkdown}
          setWikiMarkdown={setWikiMarkdown}
          scriptContent={scriptContent}
          setScriptContent={setScriptContent}
          onResetToSample={handleResetToSample}
          packageName={selectedPackage.name}
        />

        {/* Section 3: Prominent AI Audit CTA & Pipeline Progress */}
        <AuditActionBanner
          onRunAudit={handleRunAudit}
          isLoading={isLoading}
          pipelineStep={pipelineStep}
          packageName={selectedPackage.name}
        />

        {/* Section 4: Audit Findings & Compliance Telemetry */}
        {report && (
          <div className="space-y-6 pt-2">
            {/* KPI Cards & Overall Score */}
            <ComplianceScoreCard report={report} />

            {/* Discrepancy Matrix */}
            <DiscrepancyList discrepancies={report.discrepancies} />

            {/* Unified Git Diff & Remediated Bash Script */}
            <UnifiedDiffViewer
              unifiedDiff={report.unifiedDiff}
              remediatedScript={report.suggestedRemediationScript}
              packageName={report.packageName}
              onOpenPRModal={() => setIsPRModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 px-4 lg:px-8 text-center text-xs text-slate-500 bg-[#080c14] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Linux on IBM Z Mentorship Mini-Project • Automated Build Instruction Validation Engine (s390x)
          </p>
          <div className="flex items-center space-x-4 text-slate-400">
            <button onClick={() => setIsAboutModalOpen(true)} className="hover:text-white transition">
              About Project
            </button>
            <span>•</span>
            <button onClick={() => setIsBatchModalOpen(true)} className="hover:text-white transition">
              Batch Runner
            </button>
            <span>•</span>
            <a
              href="https://github.com/linux-on-ibm-z/docs/wiki"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-400 transition"
            >
              IBM Z Docs Wiki
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {report && (
        <GitHubPRModal
          isOpen={isPRModalOpen}
          onClose={() => setIsPRModalOpen(false)}
          report={report}
        />
      )}

      <BatchValidationModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSelectReport={handleBatchSelect}
      />

      {report && (
        <ReportExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          report={report}
        />
      )}

      <MentorshipModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
