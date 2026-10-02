export type DiscrepancyType = 
  | 'MISSING_STEP' 
  | 'ADDITIONAL_SCRIPT_STEP' 
  | 'PARAMETER_MISMATCH' 
  | 'VERSION_INCONSISTENCY' 
  | 'ENVIRONMENT_MISMATCH';

export type DiscrepancySeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface DiscrepancyItem {
  id: string;
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  title: string;
  description: string;
  biReference?: string;
  scriptReference?: string;
  impact: string;
  remediation: string;
  suggestedPatchSnippet?: string;
}

export interface BuildInstructionStep {
  stepId: string;
  stepNumber: number;
  category: 'prerequisites' | 'system_deps' | 'environment' | 'clone_repo' | 'build_compile' | 'test_suite' | 'install';
  title: string;
  description: string;
  expectedCommands: string[];
  parameters?: Record<string, string>;
  isOptional?: boolean;
}

export interface ScriptExtractedStep {
  stepId: string;
  lineNumber: number;
  command: string;
  args?: string;
  description: string;
  phase: string;
}

export interface ValidationReport {
  packageName: string;
  packageVersion: string;
  timestamp: string;
  distroTarget: string;
  complianceScore: number; // 0 - 100
  totalExpectedSteps: number;
  matchedSteps: number;
  missingSteps: number;
  additionalSteps: number;
  parameterMismatches: number;
  versionInconsistencies: number;
  summary: string;
  discrepancies: DiscrepancyItem[];
  extractedBiSteps: BuildInstructionStep[];
  extractedScriptSteps: ScriptExtractedStep[];
  suggestedRemediationScript: string;
  unifiedDiff: string;
}

export interface IBMZPackage {
  id: string;
  name: string;
  version: string;
  distro: string;
  wikiUrl: string;
  scriptUrl: string;
  summary: string;
  rawWiki: string;
  rawScript: string;
}

export interface PRAutomationRequest {
  githubToken?: string;
  forkOwner: string;
  forkRepo?: string;
  targetPackage: string;
  packageVersion: string;
  branchName: string;
  prTitle: string;
  prBody: string;
  remediatedScript: string;
  targetFilePath: string;
}

export interface PRAutomationResponse {
  success: boolean;
  mode: 'github_live' | 'simulation';
  prUrl: string;
  branchUrl?: string;
  message: string;
  error?: string;
}
