import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import util from 'util';
import crypto from 'crypto';

const execPromise = util.promisify(exec);
import { performRuleBasedAnalysis, generateUnifiedDiff } from '../src/services/analyzer.ts';
import { ValidationReport, DiscrepancyItem } from '../src/types/validator.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// 1. Analyze endpoint
app.post('/api/analyze', async (req, res) => {
  const {
    packageName = 'Package',
    packageVersion = '1.0.0',
    wikiMarkdown = '',
    scriptContent = '',
    distroTarget = 's390x Enterprise Linux'
  } = req.body;

  if (!wikiMarkdown || !scriptContent) {
    res.status(400).json({ error: 'Both wikiMarkdown and scriptContent are required.' });
    return;
  }

  // Always compute deterministic baseline first
  const ruleBasedResult = performRuleBasedAnalysis(
    packageName,
    packageVersion,
    wikiMarkdown,
    scriptContent,
    distroTarget
  );


  const reqId = crypto.randomUUID();
  const wikiFile = path.join(ROOT_DIR, `wiki_${reqId}.md`);
  const scriptFile = path.join(ROOT_DIR, `script_${reqId}.sh`);

  try {
    fs.writeFileSync(wikiFile, wikiMarkdown);
    fs.writeFileSync(scriptFile, scriptContent);
    
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const pythonExec = path.join(ROOT_DIR, 'pipeline', 'venv', 'bin', 'python');
    const cliRunner = path.join(ROOT_DIR, 'pipeline', 'cli_runner.py');
    
    await new Promise<void>((resolve, reject) => {
      const pyProcess = spawn(pythonExec, [cliRunner, packageName, packageVersion, wikiFile, scriptFile, distroTarget], {
        cwd: path.join(ROOT_DIR, 'pipeline')
      });

      let stdoutData = '';

      pyProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('__PROGRESS_STEP__:')) {
            const step = parseInt(line.split(':')[1], 10);
            res.write(JSON.stringify({ step }) + '\n');
          } else if (line.trim().startsWith('{')) {
            stdoutData += line + '\n';
          } else if (stdoutData.length > 0) {
            stdoutData += line + '\n';
          }
        }
      });

      pyProcess.stderr.on('data', (data) => {
        console.warn('Pipeline stderr:', data.toString());
      });

      pyProcess.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error('Process exited with code ' + code));
        }
        
        try {
          const jsonStr = stdoutData.substring(stdoutData.indexOf('{'));
          const parsed = JSON.parse(jsonStr);

          // Generate accurate diff between original script and AI remediated script
          const remediatedScript = parsed.suggestedRemediationScript || ruleBasedResult.suggestedRemediationScript;
          const diff = generateUnifiedDiff(scriptContent, remediatedScript);

          const mergedDiscrepancies: DiscrepancyItem[] = Array.isArray(parsed.discrepancies)
            ? parsed.discrepancies
            : ruleBasedResult.discrepancies;

          const missingCount = mergedDiscrepancies.filter(d => d.type === 'MISSING_STEP').length;
          const additionalCount = mergedDiscrepancies.filter(d => d.type === 'ADDITIONAL_SCRIPT_STEP').length;
          const paramCount = mergedDiscrepancies.filter(d => d.type === 'PARAMETER_MISMATCH').length;
          const versionCount = mergedDiscrepancies.filter(d => d.type === 'VERSION_INCONSISTENCY').length;

          const report: ValidationReport & { engine: string } = {
            packageName,
            packageVersion,
            timestamp: new Date().toISOString(),
            distroTarget,
            complianceScore: typeof parsed.complianceScore === 'number' ? parsed.complianceScore : ruleBasedResult.complianceScore,
            totalExpectedSteps: ruleBasedResult.totalExpectedSteps,
            matchedSteps: Math.max(0, ruleBasedResult.totalExpectedSteps - missingCount - paramCount),
            missingSteps: missingCount,
            additionalSteps: additionalCount,
            parameterMismatches: paramCount,
            versionInconsistencies: versionCount,
            summary: parsed.summary || ruleBasedResult.summary,
            discrepancies: mergedDiscrepancies,
            extractedBiSteps: ruleBasedResult.extractedBiSteps,
            extractedScriptSteps: ruleBasedResult.extractedScriptSteps,
            suggestedRemediationScript: remediatedScript,
            unifiedDiff: diff,
            engine: 'Python Pipeline (langchain_ollama + bashlex + semantic_search)'
          };

          res.write(JSON.stringify({ report }) + '\n');
          res.end();
          resolve();
        } catch (e) {
          reject(e);
        }
      });

      pyProcess.on('error', (err) => {
        reject(err);
      });
    });
  } catch (err) {
    console.error('Python pipeline call failed, falling back to deterministic parser:', err);
    res.write(JSON.stringify({ report: {
      ...ruleBasedResult,
      engine: 'deterministic_ast_rule_engine (fallback)'
    }}) + '\n');
    res.end();
  } finally {
    // Always clean up temp files, even on error
    try { fs.unlinkSync(wikiFile); } catch (_) {}
    try { fs.unlinkSync(scriptFile); } catch (_) {}
  }
});

// 2. Fetch remote GitHub URL (Proxy)
app.post('/api/fetch-github', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    let targetUrl = url.trim();

    // Transform github.com/.../blob/... or /tree/... to raw.githubusercontent.com
    if (targetUrl.includes('github.com')) {
      if (targetUrl.includes('/blob/')) {
        targetUrl = targetUrl
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/blob/', '/');
      } else if (targetUrl.includes('/tree/') && targetUrl.endsWith('.sh')) {
        targetUrl = targetUrl
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/tree/', '/');
      }
    }

    // Transform wiki URL to raw markdown
    // e.g. https://github.com/linux-on-ibm-z/docs/wiki/Building-Alfresco
    //   -> https://raw.githubusercontent.com/wiki/linux-on-ibm-z/docs/Building-Alfresco.md
    if (targetUrl.includes('github.com') && targetUrl.includes('/wiki/')) {
      const wikiMatch = targetUrl.match(/github\.com\/([^/]+)\/([^/]+)\/wiki\/(.+)/);
      if (wikiMatch) {
        targetUrl = `https://raw.githubusercontent.com/wiki/${wikiMatch[1]}/${wikiMatch[2]}/${wikiMatch[3]}.md`;
      }
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'IBM-Z-Build-Instruction-Validator/1.0',
        'Accept': 'text/plain, text/markdown, */*'
      }
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Failed to fetch: HTTP ${response.status} ${response.statusText}` });
      return;
    }

    const content = await response.text();
    
    // Server-side HTML detection: reject directory listings / 404 HTML pages
    const trimmed = content.trim().toLowerCase();
    if (trimmed.startsWith('<!doctype html>') || trimmed.startsWith('<html')) {
      res.status(400).json({ 
        error: 'The URL returned an HTML page instead of raw file content. Make sure you are linking to a specific file (e.g. .sh or .md), not a directory (/tree/) link.' 
      });
      return;
    }
    
    res.json({ content, url: targetUrl });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Fetch failed' });
  }
});

// 3. Automated Pull Request Creation (Strictly on FORKED repos)
app.post('/api/create-pr', async (req, res) => {
  const {
    githubToken,
    forkOwner,
    forkRepo = 'scripts',
    targetPackage,
    packageVersion,
    branchName,
    prTitle,
    prBody,
    remediatedScript,
    targetFilePath
  } = req.body;

  if (!forkOwner) {
    res.status(400).json({ error: 'Fork owner (your GitHub username) is required.' });
    return;
  }

  // HARD GUARD: Enforce PDF specification constraint:
  // "DO NOT create Pull Request to above mentioned repositories" (linux-on-ibm-z/scripts or docs)
  if (forkOwner.toLowerCase() === 'linux-on-ibm-z' || forkOwner.toLowerCase() === 'linux-on-ibm-z-scripts') {
    res.status(403).json({
      error: 'CRITICAL SAFETY GUARD: Pull Requests against upstream linux-on-ibm-z repositories are forbidden. You must create the PR against your own FORKED repository.'
    });
    return;
  }

  const cleanBranch = branchName || `fix/${targetPackage.toLowerCase()}-bi-alignment-${Date.now().toString().slice(-4)}`;
  const filePath = targetFilePath || `${targetPackage}/${packageVersion}/build_${targetPackage.toLowerCase()}.sh`;

  // If token is provided, perform live GitHub API operations
  if (githubToken && githubToken.trim().length > 10) {
    try {
      const headers = {
        'Authorization': `Bearer ${githubToken.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'IBM-Z-BI-Validator'
      };

      // 1. Get default branch ref
      const repoRes = await fetch(`https://api.github.com/repos/${forkOwner}/${forkRepo}`, { headers });
      if (!repoRes.ok) {
        throw new Error(`Could not access fork ${forkOwner}/${forkRepo}. Verify repository exists and token has 'repo' scope.`);
      }
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch || 'master';

      const refRes = await fetch(`https://api.github.com/repos/${forkOwner}/${forkRepo}/git/ref/heads/${defaultBranch}`, { headers });
      if (!refRes.ok) {
        throw new Error(`Failed to fetch default branch reference for ${defaultBranch}`);
      }
      const refData = await refRes.json();
      const baseSha = refData.object.sha;

      // 2. Create new branch
      const createBranchRes = await fetch(`https://api.github.com/repos/${forkOwner}/${forkRepo}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${cleanBranch}`,
          sha: baseSha
        })
      });
      // Branch might already exist, handle gracefully

      // 3. Get existing file sha if updating
      let existingSha: string | undefined;
      const fileRes = await fetch(`https://api.github.com/repos/${forkOwner}/${forkRepo}/contents/${filePath}?ref=${cleanBranch}`, { headers });
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        existingSha = fileData.sha;
      }

      // 4. Commit remediated script
      const contentEncoded = Buffer.from(remediatedScript).toString('base64');
      const commitRes = await fetch(`https://api.github.com/repos/${forkOwner}/${forkRepo}/contents/${filePath}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `fix(${targetPackage}): align automation script with Linux on IBM Z Build Instructions\n\nAI-assisted discrepancy remediation for ${targetPackage} ${packageVersion}`,
          content: contentEncoded,
          branch: cleanBranch,
          sha: existingSha
        })
      });

      if (!commitRes.ok) {
        const errJson = await commitRes.json();
        throw new Error(`Commit failed: ${errJson.message || commitRes.statusText}`);
      }

      // 5. Create Pull Request
      const prRes = await fetch(`https://api.github.com/repos/${forkOwner}/${forkRepo}/pulls`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: prTitle || `fix(${targetPackage}): align build script with Linux on IBM Z Build Instructions`,
          head: cleanBranch,
          base: defaultBranch,
          body: prBody || `### Linux on IBM Z Build Instruction Validation\n\nThis PR reconciles the automation script with the documented Build Instructions in the Wiki.\n\n- Package: **${targetPackage}**\n- Target Architecture: **s390x**\n- Validated by AI Assistant.`
        })
      });

      if (!prRes.ok) {
        const prErr = await prRes.json();
        throw new Error(`PR Creation failed: ${prErr.message || prRes.statusText}`);
      }

      const prJson = await prRes.json();

      res.json({
        success: true,
        mode: 'github_live',
        prUrl: prJson.html_url,
        branchUrl: `https://github.com/${forkOwner}/${forkRepo}/tree/${cleanBranch}`,
        message: `Successfully created Pull Request #${prJson.number} on fork ${forkOwner}/${forkRepo}!`
      });
      return;
    } catch (err) {
      console.error('GitHub API error:', err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'GitHub API error'
      });
      return;
    }
  }

  // Simulation mode (Safe sandbox when no PAT is provided)
  const simulatedPrUrl = `https://github.com/${forkOwner}/${forkRepo}/pull/new/${cleanBranch}`;
  res.json({
    success: true,
    mode: 'simulation',
    prUrl: simulatedPrUrl,
    branchUrl: `https://github.com/${forkOwner}/${forkRepo}/tree/${cleanBranch}`,
    message: `[Sandbox Mode] Remediation PR prepared for fork: ${forkOwner}/${forkRepo} on branch '${cleanBranch}'. Target verified: personal fork (NOT upstream).`
  });
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(ROOT_DIR, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'dist', 'index.html'));
  });
} else {
  import('vite').then(async ({ createServer }) => {
    const vite = await createServer({
      root: ROOT_DIR,
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  });
}

app.listen(port, () => {
  console.log(`Linux on IBM Z Build Validator running on port ${port}`);
});
