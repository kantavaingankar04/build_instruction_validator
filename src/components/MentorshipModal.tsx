import React from 'react';
import { X, Award, CheckCircle2, ShieldCheck, Terminal, BookOpen, Layers, GitPullRequest, Cpu } from 'lucide-react';

interface MentorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MentorshipModal: React.FC<MentorshipModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Linux on IBM Z Mentorship Mini-Project
            </h3>
            <p className="text-xs text-slate-400">
              AI Assistant for Build Instruction Validation • Sangita Angolkar, Persistent Systems
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 max-h-[460px] overflow-y-auto pr-1 leading-relaxed">
          {/* Objective Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="text-sm font-semibold text-blue-400 mb-1">
              Project Objective
            </h4>
            <p>
              Develop an AI-powered assistant that automatically compares package Build Instructions (BI) documented in the Linux on IBM Z documentation repository with their corresponding automation scripts and identifies any discrepancies.
            </p>
          </div>

          {/* Problem Statement */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="text-sm font-semibold text-white mb-1">
              Problem Statement
            </h4>
            <p>
              For each package, the automation script should accurately implement all steps defined in the Build Instructions. Manual verification is time-consuming and error-prone. The proposed AI Assistant analyzes both sources and highlights differences to ensure consistency and correctness on the <strong>s390x mainframe architecture</strong>.
            </p>
          </div>

          {/* Core Functionalities Delivered */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Core Requirements Implemented
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong>Accept Package Name:</strong> Dynamic dropdown and custom URL/file inputs for any IBM Z package.</li>
              <li><strong>Retrieve BI & Script:</strong> Ingests Wiki documentation and GitHub automation scripts.</li>
              <li><strong>Compare Sources:</strong> Cross-checks Abstract Syntax Tree (AST) command flows against extracted requirements.</li>
              <li><strong>Identify & Classify Discrepancies:</strong> Categorizes into Missing Steps, Additional Steps, Parameter Mismatches, Version Inconsistencies, and Environment Inconsistencies.</li>
              <li><strong>Structured Discrepancy Report:</strong> Comprehensive compliance scoring and actionable recommendations.</li>
            </ul>
          </div>

          {/* Stretch Goals Achieved */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> All Stretch Goals Achieved
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 mt-2">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-semibold text-blue-300 block mb-0.5">🚀 LLM / RAG Techniques</span>
                Local LLM (Ollama) + AST tokenization engine with semantic embedding search for deep extraction and compiler option alignment.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-semibold text-indigo-300 block mb-0.5">🚀 Multi-Package Batch Auditor</span>
                Concurrent validation across registry packages with summary status matrices.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-semibold text-emerald-300 block mb-0.5">🚀 HTML & Markdown Reports</span>
                Exportable standalone HTML reports with inline CSS and GitHub-flavored Markdown.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-semibold text-amber-300 block mb-0.5">🚀 Fork PR Automation</span>
                Automated branch and pull request generation strictly against user FORKED repos (with upstream guard).
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
