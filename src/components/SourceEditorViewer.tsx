import React, { useState } from 'react';
import { BookOpen, Terminal, Code2, RotateCcw, Copy, Check, Eye } from 'lucide-react';

interface SourceEditorViewerProps {
  wikiMarkdown: string;
  setWikiMarkdown: (val: string) => void;
  scriptContent: string;
  setScriptContent: (val: string) => void;
  onResetToSample: () => void;
  packageName: string;
}

export const SourceEditorViewer: React.FC<SourceEditorViewerProps> = ({
  wikiMarkdown,
  setWikiMarkdown,
  scriptContent,
  setScriptContent,
  onResetToSample,
  packageName
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'bi' | 'script'>('both');
  const [copiedBi, setCopiedBi] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const copyToClipboard = (text: string, type: 'bi' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'bi') {
      setCopiedBi(true);
      setTimeout(() => setCopiedBi(false), 1800);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 1800);
    }
  };

  const biLines = wikiMarkdown.split('\n').length;
  const scriptLines = scriptContent.split('\n').length;

  return (
    <div className="glass-panel rounded-xl border border-slate-800 p-5 shadow-xl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">
            Source Inspection & Ingestion Dual-Pane
          </h3>
          <span className="text-xs text-slate-500 font-mono">({packageName})</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tab selector */}
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeTab === 'both' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setActiveTab('bi')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeTab === 'bi' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BI Wiki ({biLines} lines)
            </button>
            <button
              onClick={() => setActiveTab('script')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeTab === 'script' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Script ({scriptLines} lines)
            </button>
          </div>

          <button
            onClick={onResetToSample}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition"
            title="Reset to official sample"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Editor Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Left Pane: Build Instructions (BI Wiki) */}
        {(activeTab === 'both' || activeTab === 'bi') && (
          <div className={`space-y-2 ${activeTab === 'bi' ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between text-xs px-2 text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-blue-400">
                <BookOpen className="w-3.5 h-3.5" />
                Build Instructions (Markdown Wiki)
              </span>
              <div className="flex items-center space-x-2 text-slate-500 font-mono">
                <span>{biLines} lines</span>
                <button
                  onClick={() => copyToClipboard(wikiMarkdown, 'bi')}
                  className="hover:text-slate-300 transition"
                  title="Copy markdown"
                >
                  {copiedBi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16] shadow-inner">
              <textarea
                value={wikiMarkdown}
                onChange={(e) => setWikiMarkdown(e.target.value)}
                rows={14}
                className="w-full text-xs font-mono p-3 bg-transparent text-slate-200 resize-y focus:outline-none focus:ring-1 focus:ring-blue-500/50 leading-relaxed"
                spellCheck={false}
                placeholder="# Paste Build Instructions Markdown here..."
              />
            </div>
          </div>
        )}

        {/* Right Pane: Automation Script (Bash) */}
        {(activeTab === 'both' || activeTab === 'script') && (
          <div className={`space-y-2 ${activeTab === 'script' ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between text-xs px-2 text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <Terminal className="w-3.5 h-3.5" />
                Automation Script (Bash .sh)
              </span>
              <div className="flex items-center space-x-2 text-slate-500 font-mono">
                <span>{scriptLines} lines</span>
                <button
                  onClick={() => copyToClipboard(scriptContent, 'script')}
                  className="hover:text-slate-300 transition"
                  title="Copy bash script"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#090d16] shadow-inner">
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                rows={14}
                className="w-full text-xs font-mono p-3 bg-transparent text-emerald-300/90 resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500/50 leading-relaxed"
                spellCheck={false}
                placeholder="#!/bin/bash&#10;# Paste Automation script here..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
