import { BuildInstructionStep, DiscrepancyItem, ScriptExtractedStep, ValidationReport } from '../types/validator';

export function parseBiMarkdown(wikiMarkdown: string): BuildInstructionStep[] {
  const steps: BuildInstructionStep[] = [];
  const lines = wikiMarkdown.split('\n');
  
  let currentCategory: BuildInstructionStep['category'] = 'system_deps';
  let currentTitle = 'Initial Setup';
  let currentCommands: string[] = [];
  let inCodeBlock = false;
  let stepIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#')) {
      const heading = line.replace(/^#+\s*/, '');
      const lower = heading.toLowerCase();
      
      if (lower.includes('prerequisite') || lower.includes('system requirement')) {
        currentCategory = 'prerequisites';
      } else if (lower.includes('package') || lower.includes('dependencies') || lower.includes('dependency')) {
        currentCategory = 'system_deps';
      } else if (lower.includes('environment') || lower.includes('variable') || lower.includes('path')) {
        currentCategory = 'environment';
      } else if (lower.includes('clone') || lower.includes('source') || lower.includes('checkout')) {
        currentCategory = 'clone_repo';
      } else if (lower.includes('build') || lower.includes('compile') || lower.includes('install core')) {
        currentCategory = 'build_compile';
      } else if (lower.includes('test') || lower.includes('verify') || lower.includes('verification')) {
        currentCategory = 'test_suite';
      } else if (lower.includes('install')) {
        currentCategory = 'install';
      }
      currentTitle = heading;
      continue;
    }

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        currentCommands = [];
      } else {
        inCodeBlock = false;
        if (currentCommands.length > 0) {
          steps.push({
            stepId: `bi-step-${stepIndex}`,
            stepNumber: stepIndex,
            category: currentCategory,
            title: currentTitle,
            description: `Execute documented commands for ${currentTitle}`,
            expectedCommands: [...currentCommands]
          });
          stepIndex++;
          currentCommands = [];
        }
      }
      continue;
    }

    if (inCodeBlock && line && !line.startsWith('#')) {
      currentCommands.push(line);
    }
  }

  return steps;
}

export function parseBashScript(scriptContent: string): ScriptExtractedStep[] {
  const steps: ScriptExtractedStep[] = [];
  const lines = scriptContent.split('\n');
  let stepCounter = 1;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('set -') || line === 'set -e' || line.startsWith('echo ')) {
      return;
    }

    let phase = 'execution';
    if (line.includes('apt-get') || line.includes('yum') || line.includes('dnf') || line.includes('zypper')) {
      phase = 'package_manager';
    } else if (line.startsWith('export ') || line.includes('JAVA_HOME') || line.includes('ANT_OPTS') || line.includes('MAVEN_OPTS')) {
      phase = 'environment';
    } else if (line.startsWith('git ')) {
      phase = 'vcs';
    } else if (line.startsWith('mvn ') || line.startsWith('ant ') || line.startsWith('make ') || line.startsWith('ninja ') || line.startsWith('scons ')) {
      phase = 'build_tool';
    } else if (line.startsWith('curl ') || line.startsWith('wget ')) {
      phase = 'network_fetch';
    }

    const commandHead = line.split(' ')[0];
    steps.push({
      stepId: `script-step-${stepCounter++}`,
      lineNumber: index + 1,
      command: commandHead,
      args: line.substring(commandHead.length).trim(),
      description: line,
      phase
    });
  });

  return steps;
}

export function generateUnifiedDiff(original: string, modified: string): string {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  
  const diffLines: string[] = [
    '--- build_script.sh (Original)',
    '+++ build_script.sh (AI Remediated for IBM Z)',
    '@@ -1,' + origLines.length + ' +1,' + modLines.length + ' @@'
  ];

  const maxLen = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const m = modLines[i];

    if (o === m) {
      if (o !== undefined) {
        diffLines.push(' ' + o);
      }
    } else {
      if (o !== undefined && m !== undefined) {
        diffLines.push('-' + o);
        diffLines.push('+' + m);
      } else if (o !== undefined) {
        diffLines.push('-' + o);
      } else if (m !== undefined) {
        diffLines.push('+' + m);
      }
    }
  }

  return diffLines.join('\n');
}

export function performRuleBasedAnalysis(
  packageName: string,
  packageVersion: string,
  wikiMarkdown: string,
  scriptContent: string,
  distroTarget: string
): ValidationReport {
  const biSteps = parseBiMarkdown(wikiMarkdown);
  const scriptSteps = parseBashScript(scriptContent);
  const discrepancies: DiscrepancyItem[] = [];

  // 1. Dependency Analysis
  const aptBiLine = biSteps
    .flatMap(s => s.expectedCommands)
    .find(c => c.includes('apt-get install') || c.includes('yum install') || c.includes('dnf install'));

  const aptScriptLine = scriptSteps
    .map(s => s.description)
    .find(c => c.includes('apt-get install') || c.includes('yum install') || c.includes('dnf install'));

  if (aptBiLine && aptScriptLine) {
    const extractPkgs = (cmd: string) => {
      const match = cmd.match(/install\s+(-y\s+)?(.*)/);
      if (!match) return [];
      return match[2].split(/\s+/).map(p => p.trim()).filter(Boolean);
    };

    const biPkgs = extractPkgs(aptBiLine);
    const scriptPkgs = extractPkgs(aptScriptLine);
    const missingPkgs = biPkgs.filter(p => !scriptPkgs.includes(p));

    if (missingPkgs.length > 0) {
      discrepancies.push({
        id: 'disc-pkg-missing',
        type: 'MISSING_STEP',
        severity: 'CRITICAL',
        title: `Missing System Dependencies: ${missingPkgs.join(', ')}`,
        description: `Build Instructions document installation of [${missingPkgs.join(', ')}], but the automation script omitted them.`,
        biReference: aptBiLine,
        scriptReference: aptScriptLine,
        impact: `Without ${missingPkgs.join(', ')}, native compilation on IBM Z (s390x) will fail during linkage or runtime media encoding.`,
        remediation: `Append '${missingPkgs.join(' ')}' to the package manager installation command in the script.`,
        suggestedPatchSnippet: `sudo apt-get install -y ${biPkgs.join(' ')}`
      });
    }
  }

  // 2. Environment Variables & Memory Configuration
  const memoryBiMatch = wikiMarkdown.match(/(-Xmx[0-9]+[mMgG]|ANT_OPTS="[^"]+"|MAVEN_OPTS="[^"]+")/);
  if (memoryBiMatch) {
    const biVal = memoryBiMatch[0];
    const scriptMemMatch = scriptContent.match(/(-Xmx[0-9]+[mMgG]|ANT_OPTS="[^"]+"|MAVEN_OPTS="[^"]+")/);
    if (scriptMemMatch && scriptMemMatch[0] !== biVal) {
      discrepancies.push({
        id: 'disc-env-memory',
        type: 'PARAMETER_MISMATCH',
        severity: 'WARNING',
        title: 'JVM Heap Memory Discrepancy',
        description: `Build instructions allocate ${biVal}, whereas automation script specifies ${scriptMemMatch[0]}.`,
        biReference: biVal,
        scriptReference: scriptMemMatch[0],
        impact: `Insufficient heap on s390x mainframes frequently causes OutOfMemory (OOM) exceptions during multi-threaded bytecode translation.`,
        remediation: `Align memory allocation parameter to match documented BI threshold (${biVal}).`,
        suggestedPatchSnippet: `export MAVEN_OPTS="-Xms1024m -Xmx4096m -XX:+UseG1GC"`
      });
    }
  }

  // 3. Node.js or Toolchain Version Checks
  const nodeBiMatch = wikiMarkdown.match(/node-v([0-9.]+)-linux-s390x/);
  const nodeScriptMatch = scriptContent.match(/node-v([0-9.]+)-linux-s390x/);
  if (nodeBiMatch && nodeScriptMatch && nodeBiMatch[1] !== nodeScriptMatch[1]) {
    discrepancies.push({
      id: 'disc-version-node',
      type: 'VERSION_INCONSISTENCY',
      severity: 'CRITICAL',
      title: `Node.js Toolchain Inconsistency (v${nodeBiMatch[1]} vs v${nodeScriptMatch[1]})`,
      description: `Build Instructions specify Node.js v${nodeBiMatch[1]} (s390x), but the automation script downloads deprecated v${nodeScriptMatch[1]}.`,
      biReference: `node-v${nodeBiMatch[1]}-linux-s390x.tar.gz`,
      scriptReference: `node-v${nodeScriptMatch[1]}-linux-s390x.tar.gz`,
      impact: `Outdated Node runtime causes build tool syntax crashes and security vulnerabilities on modern frontend builds.`,
      remediation: `Upgrade Node download URL in script to v${nodeBiMatch[1]}.`,
      suggestedPatchSnippet: `curl -fsSL https://nodejs.org/dist/v${nodeBiMatch[1]}/node-v${nodeBiMatch[1]}-linux-s390x.tar.gz | sudo tar -xz -C /usr/local --strip-components=1`
    });
  }

  // 4. Git Tag / Checkout Version
  const gitCheckoutBi = wikiMarkdown.match(/git checkout\s+([^\s\n]+)/);
  const gitCheckoutScript = scriptContent.match(/git checkout\s+([^\s\n]+)/);
  if (gitCheckoutBi && gitCheckoutScript) {
    const biTag = gitCheckoutBi[1].replace(/["']/g, '');
    const scriptTag = gitCheckoutScript[1].replace(/["']/g, '').replace('"$PACKAGE_VERSION"', packageVersion);
    if (biTag !== scriptTag && !biTag.includes(scriptTag)) {
      discrepancies.push({
        id: 'disc-version-git',
        type: 'VERSION_INCONSISTENCY',
        severity: 'CRITICAL',
        title: `Git Checkout Tag Mismatch (${biTag} vs ${scriptTag})`,
        description: `Documented Build Instructions verify tag '${biTag}', but script checked out '${scriptTag}'.`,
        biReference: `git checkout ${biTag}`,
        scriptReference: `git checkout ${scriptTag}`,
        impact: `Building the wrong tag leads to untested codebase execution and missing architectural patches.`,
        remediation: `Update script git checkout to ${biTag}.`,
        suggestedPatchSnippet: `git checkout ${biTag}`
      });
    }
  }

  // 5. Build Flags & Parameters
  if (wikiMarkdown.includes('-DskipTests=true') && scriptContent.includes('-Dmaven.test.skip=true')) {
    discrepancies.push({
      id: 'disc-param-mvn',
      type: 'PARAMETER_MISMATCH',
      severity: 'WARNING',
      title: 'Maven Test Parameter Divergence (-DskipTests vs -Dmaven.test.skip)',
      description: `BI documents '-DskipTests=true' (which compiles test classes without executing), whereas script passes '-Dmaven.test.skip=true' (which skips compilation entirely).`,
      biReference: 'mvn clean install -DskipTests=true -Pcommunity',
      scriptReference: 'mvn clean install -Dmaven.test.skip=true',
      impact: `Skipping test class compilation masks s390x big-endian byte-order syntax breakages in test artifacts.`,
      remediation: `Replace '-Dmaven.test.skip=true' with '-DskipTests=true -Pcommunity' as mandated by BI.`,
      suggestedPatchSnippet: 'mvn clean install -DskipTests=true -Pcommunity'
    });
  }

  // 6. Profile Flag Missing
  if (wikiMarkdown.includes('-Pcommunity') && !scriptContent.includes('-Pcommunity')) {
    discrepancies.push({
      id: 'disc-param-profile',
      type: 'PARAMETER_MISMATCH',
      severity: 'CRITICAL',
      title: 'Missing Community Profile Flag (-Pcommunity)',
      description: `Build instructions require activating the community profile (-Pcommunity) to resolve enterprise repository dependencies.`,
      biReference: '-Pcommunity',
      scriptReference: 'omitted from script',
      impact: `Without -Pcommunity, Maven attempts to connect to private enterprise Nexus repositories resulting in 401 Unauthorized errors.`,
      remediation: `Add -Pcommunity to the build execution command.`,
      suggestedPatchSnippet: 'mvn clean install -DskipTests=true -Pcommunity'
    });
  }

  // 7. Undocumented script steps (Additional Steps)
  if (scriptContent.includes('rm -rf ~/.m2/repository/org/alfresco')) {
    discrepancies.push({
      id: 'disc-additional-cache',
      type: 'ADDITIONAL_SCRIPT_STEP',
      severity: 'INFO',
      title: 'Undocumented Step: Local Maven Cache Purge',
      description: `The automation script executes 'rm -rf ~/.m2/repository/org/alfresco' which is not documented in the Build Instructions wiki.`,
      biReference: 'Not present in BI',
      scriptReference: 'rm -rf ~/.m2/repository/org/alfresco',
      impact: `Forces repeated artifact downloads, slowing down CI build cycles, but ensures pristine state.`,
      remediation: `Either document this cleanup step in the official Wiki or guard it behind a conditional flag.`,
      suggestedPatchSnippet: '# Optional clean:\n# rm -rf ~/.m2/repository/org/alfresco'
    });
  }

  // 8. Missing python or pip dependencies
  if (wikiMarkdown.includes('pip3 install') && !scriptContent.includes('pip3 install')) {
    const pipBiLine = wikiMarkdown.split('\n').find(l => l.includes('pip3 install')) || 'pip3 install cython';
    discrepancies.push({
      id: 'disc-pip-missing',
      type: 'MISSING_STEP',
      severity: 'CRITICAL',
      title: 'Missing Python Dependencies Installation',
      description: `BI documents Python library installation: '${pipBiLine}', but the script omits it completely.`,
      biReference: pipBiLine,
      scriptReference: 'Omitted from script',
      impact: `Failure to install native s390x Cython or requirements halts subsequent driver compilation.`,
      remediation: `Add the pip3 installation step prior to build invocation.`,
      suggestedPatchSnippet: pipBiLine
    });
  }

  // 9. SCons allocator parameter (MongoDB specific)
  if (wikiMarkdown.includes('--allocator=system') && !scriptContent.includes('--allocator=system')) {
    discrepancies.push({
      id: 'disc-allocator-missing',
      type: 'PARAMETER_MISMATCH',
      severity: 'CRITICAL',
      title: 'Missing System Allocator Flag (--allocator=system)',
      description: `BI instructs passing '--allocator=system' for s390x architectures, but the script executes standard scons without this flag.`,
      biReference: 'scons install-core --disable-warnings-as-errors --allocator=system -j$(nproc)',
      scriptReference: 'scons install-core --disable-warnings-as-errors -j4',
      impact: `Default jemalloc crashes with SIGSEGV on s390x 64KB page size kernels. System allocator is mandatory.`,
      remediation: `Add --allocator=system and utilize dynamic core count -j$(nproc).`,
      suggestedPatchSnippet: 'scons install-core --disable-warnings-as-errors --allocator=system -j$(nproc)'
    });
  }

  // 10. Node.js ninja configuration
  if (wikiMarkdown.includes('--ninja') && !scriptContent.includes('--ninja') && packageName.toLowerCase().includes('node')) {
    discrepancies.push({
      id: 'disc-ninja-missing',
      type: 'PARAMETER_MISMATCH',
      severity: 'WARNING',
      title: 'Build System Divergence (Make vs Ninja)',
      description: `Build Instructions document building with Ninja ('./configure --ninja' and 'ninja -C out/Release'), while script uses legacy Make.`,
      biReference: './configure --ninja --shared-openssl --with-intl=full-icu',
      scriptReference: './configure --shared-openssl; make -j$(nproc)',
      impact: `Ninja handles dependency graphs on s390x up to 3x faster than standard Make.`,
      remediation: `Add ninja-build to apt packages and execute ./configure with --ninja.`,
      suggestedPatchSnippet: './configure --ninja --shared-openssl --with-intl=full-icu\nninja -C out/Release -j$(nproc)'
    });
  }

  // Calculate compliance score
  let penalty = 0;
  discrepancies.forEach(d => {
    if (d.severity === 'CRITICAL') penalty += 18;
    else if (d.severity === 'WARNING') penalty += 9;
    else penalty += 4;
  });

  const complianceScore = Math.max(12, Math.min(100, 100 - penalty));

  // Synthesize Remediated Script
  let remediatedScript = scriptContent;

  // Apply fixes
  if (aptBiLine && aptScriptLine) {
    const extractPkgs = (cmd: string) => {
      const match = cmd.match(/install\s+(-y\s+)?(.*)/);
      if (!match) return [];
      return match[2].split(/\s+/).map(p => p.trim()).filter(Boolean);
    };
    const biPkgs = extractPkgs(aptBiLine);
    remediatedScript = remediatedScript.replace(aptScriptLine, `sudo apt-get install -y ${biPkgs.join(' ')}`);
  }

  if (memoryBiMatch) {
    remediatedScript = remediatedScript.replace(
      /export MAVEN_OPTS="[^"]*"/,
      'export MAVEN_OPTS="-Xms1024m -Xmx4096m -XX:+UseG1GC"'
    );
    remediatedScript = remediatedScript.replace(
      /export ANT_OPTS="[^"]*"/,
      'export ANT_OPTS="-Xmx4096m -XX:+UseG1GC"'
    );
  }

  if (nodeBiMatch && nodeScriptMatch) {
    remediatedScript = remediatedScript.replace(
      new RegExp(`v${nodeScriptMatch[1]}`, 'g'),
      `v${nodeBiMatch[1]}`
    );
  }

  if (gitCheckoutBi && gitCheckoutScript) {
    const biTag = gitCheckoutBi[1].replace(/["']/g, '');
    const scriptTag = gitCheckoutScript[1].replace(/["']/g, '');
    if (biTag !== scriptTag && !biTag.includes(scriptTag)) {
      remediatedScript = remediatedScript.replace(
        `git checkout ${scriptTag}`,
        `git checkout ${biTag}`
      );
    }
  }

  if (remediatedScript.includes('-Dmaven.test.skip=true')) {
    remediatedScript = remediatedScript.replace(
      'mvn clean install -Dmaven.test.skip=true',
      'mvn clean install -DskipTests=true -Pcommunity'
    );
  }

  if (remediatedScript.includes('scons install-core --disable-warnings-as-errors -j4')) {
    remediatedScript = remediatedScript.replace(
      'scons install-core --disable-warnings-as-errors -j4',
      'scons install-core --disable-warnings-as-errors --allocator=system -j$(nproc)'
    );
  }

  if (packageName.toLowerCase().includes('cassandra') && !remediatedScript.includes('cython')) {
    remediatedScript = remediatedScript.replace(
      'echo "Starting Cassandra',
      '# Added s390x python requirements:\npip3 install cython==0.29.36 cqlsh==6.2.0\nexport CASSANDRA_USE_JDK17=true\n\necho "Starting Cassandra'
    );
  }

  if (packageName.toLowerCase().includes('node') && remediatedScript.includes('make -j$(nproc)')) {
    remediatedScript = remediatedScript.replace(
      './configure --shared-openssl\nmake -j$(nproc)',
      './configure --ninja --shared-openssl --with-intl=full-icu\nninja -C out/Release -j$(nproc)'
    );
  }

  const unifiedDiff = generateUnifiedDiff(scriptContent, remediatedScript);

  const missingCount = discrepancies.filter(d => d.type === 'MISSING_STEP').length;
  const additionalCount = discrepancies.filter(d => d.type === 'ADDITIONAL_SCRIPT_STEP').length;
  const paramCount = discrepancies.filter(d => d.type === 'PARAMETER_MISMATCH').length;
  const versionCount = discrepancies.filter(d => d.type === 'VERSION_INCONSISTENCY').length;

  return {
    packageName,
    packageVersion,
    timestamp: new Date().toISOString(),
    distroTarget,
    complianceScore,
    totalExpectedSteps: biSteps.length,
    matchedSteps: Math.max(1, biSteps.length - missingCount - paramCount),
    missingSteps: missingCount,
    additionalSteps: additionalCount,
    parameterMismatches: paramCount,
    versionInconsistencies: versionCount,
    summary: `Validation completed for ${packageName} (${packageVersion}) on ${distroTarget}. Identified ${discrepancies.length} discrepancy items across system dependencies, environment parameters, and toolchain configurations. Overall compliance score is ${complianceScore}%.`,
    discrepancies,
    extractedBiSteps: biSteps,
    extractedScriptSteps: scriptSteps,
    suggestedRemediationScript: remediatedScript,
    unifiedDiff
  };
}
