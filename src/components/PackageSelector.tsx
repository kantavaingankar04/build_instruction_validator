import React, { useState } from 'react';
import { Package, ExternalLink, RefreshCw, Globe, Terminal, Sparkles, Check, ChevronRight } from 'lucide-react';
import { IBMZPackage } from '../types/validator';
import { SAMPLE_PACKAGES } from '../data/samplePackages';

interface PackageSelectorProps {
  selectedPackage: IBMZPackage | null;
  onSelectPackage: (pkg: IBMZPackage) => void;
  isCustom: boolean;
  setIsCustom: (val: boolean) => void;
  onCustomFetch: (type: 'wiki' | 'script', url: string) => Promise<void>;
  isFetchingWiki: boolean;
  isFetchingScript: boolean;
  registryPackages: IBMZPackage[];
  onSaveToRegistry: () => void;
  onDeleteFromRegistry: (id: string, e: React.MouseEvent) => void;
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  selectedPackage,
  onSelectPackage,
  isCustom,
  setIsCustom,
  onCustomFetch,
  isFetchingWiki,
  isFetchingScript,
  registryPackages,
  onSaveToRegistry,
  onDeleteFromRegistry
}) => {
  const [customWikiUrl, setCustomWikiUrl] = useState('');
  const [customScriptUrl, setCustomScriptUrl] = useState('');

  const renderPackageCard = (pkg: IBMZPackage) => {
    const isSelected = selectedPackage?.id === pkg.id;
    return (
      <button
        key={pkg.id}
        onClick={() => onSelectPackage(pkg)}
        className={`text-left p-3.5 rounded-lg border transition-all relative flex flex-col justify-between ${
          isSelected
            ? 'bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-white text-sm tracking-tight">
              {pkg.name}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
              v{pkg.version}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {pkg.summary}
            </p>
            {pkg.scriptUrl && (
              <div className="flex items-center gap-1.5 text-emerald-400/90 font-mono text-[11px]" title={pkg.scriptUrl.split('/').pop()}>
                <Terminal className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{pkg.scriptUrl.split('/').pop()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="truncate max-w-[150px]">{pkg.distro.split('/')[0]}</span>
          <div className="flex items-center gap-2">
            {pkg.id.startsWith('custom-') && (
              <div 
                role="button"
                tabIndex={0}
                onClick={(e) => onDeleteFromRegistry(pkg.id, e)}
                className="text-slate-500 hover:text-red-400 p-0.5 rounded transition z-10 cursor-pointer"
                title="Delete custom package"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
            )}
            {isSelected ? (
              <span className="flex items-center text-blue-400 font-medium gap-1 text-[11px]">
                <Check className="w-3.5 h-3.5" /> Selected
              </span>
            ) : (
              <span className="flex items-center text-slate-500 hover:text-slate-300 text-[11px]">
                Select <ChevronRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            Target Package & Verification Scope
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a Linux on IBM Z package or configure custom documentation & script endpoints
          </p>
        </div>

        {/* Tab switch: Pre-configured vs Custom */}
        <div className="flex items-center rounded-lg bg-slate-900/90 p-1 border border-slate-800">
          <button
            onClick={() => setIsCustom(false)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${
              !isCustom
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pre-loaded Registry
          </button>
          <button
            onClick={() => setIsCustom(true)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${
              isCustom
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom GitHub Package
          </button>
        </div>
      </div>

      {!isCustom ? (
        /* Package Cards */
        <div className="mt-4 flex flex-col gap-6">
          {/* Pre-loaded */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Pre-loaded Packages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {registryPackages.filter(p => !p.id.startsWith('custom-')).map(renderPackageCard)}
            </div>
          </div>

          {/* Custom */}
          {registryPackages.some(p => p.id.startsWith('custom-')) && (
            <div className="space-y-3 pt-2 border-t border-slate-800/50">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                Custom Packages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {registryPackages.filter(p => p.id.startsWith('custom-')).map(renderPackageCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Custom Input Form */
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Wiki URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Build Instructions (BI) Wiki or Markdown URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customWikiUrl}
                  onChange={(e) => setCustomWikiUrl(e.target.value)}
                  placeholder="https://github.com/linux-on-ibm-z/docs/wiki/Building-Alfresco"
                  className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  disabled={!customWikiUrl || isFetchingWiki}
                  onClick={() => onCustomFetch('wiki', customWikiUrl)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-white flex items-center gap-1.5 whitespace-nowrap border border-slate-700 transition"
                >
                  {isFetchingWiki ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Fetch BI</span>
                </button>
              </div>
            </div>

            {/* Custom Script URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Automation Script (Bash) GitHub Raw URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customScriptUrl}
                  onChange={(e) => setCustomScriptUrl(e.target.value)}
                  placeholder="https://github.com/linux-on-ibm-z/scripts/blob/master/Alfresco/25.3.0/build_alfresco.sh"
                  className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={!customScriptUrl || isFetchingScript}
                  onClick={() => onCustomFetch('script', customScriptUrl)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-white flex items-center gap-1.5 whitespace-nowrap border border-slate-700 transition"
                >
                  {isFetchingScript ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Fetch Script</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              URLs from GitHub repositories or wikis are automatically proxied and converted to raw markdown/bash.
            </p>
            {selectedPackage?.id === 'custom' && selectedPackage.rawWiki && selectedPackage.rawScript && (
              <button
                type="button"
                onClick={onSaveToRegistry}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium border border-blue-500 transition shadow-sm"
              >
                Save to Registry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Package Details bar */}
      {selectedPackage && (
        <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="font-semibold text-white">{selectedPackage.name}</span>
            <span className="text-slate-500">•</span>
            <span>Version: <strong className="text-blue-300 font-mono">{selectedPackage.version}</strong></span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{selectedPackage.distro}</span>
          </div>

          <div className="flex items-center space-x-3 text-slate-400">
            <a
              href={selectedPackage.wikiUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-400 flex items-center gap-1 transition"
            >
              <span>View BI Wiki</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">|</span>
            <a
              href={selectedPackage.scriptUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 flex items-center gap-1 transition"
            >
              <span>View Repo Script</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
