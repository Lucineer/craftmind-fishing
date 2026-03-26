#!/usr/bin/env node
/**
 * Night Shift Pusher + Progress Logger
 * Runs every 30 minutes: commits, pushes all repos, logs progress
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPOS = [
  'craftmind',
  'craftmind-fishing',
  'craftmind-studio',
  'craftmind-courses',
  'craftmind-researcher',
  'craftmind-herding',
  'craftmind-circuits',
  'craftmind-ranch',
];

const PROGRESS_LOG = '/home/lucineer/.openclaw/workspace/experiments/night-progress.md';
const MAX_LOG_SIZE = 500000; // 500KB before rotation

function git(repo, cmd) {
  const dir = `/home/lucineer/projects/${repo}`;
  try {
    return execSync(`git ${cmd}`, { cwd: dir, timeout: 120000, encoding: 'utf8' }).trim();
  } catch (e) {
    return `ERROR: ${e.message.slice(0, 100)}`;
  }
}

function ensureSecretsIgnored(repo) {
  const dir = `/home/lucineer/projects/${repo}`;
  const gitignore = path.join(dir, '.gitignore');
  if (!fs.existsSync(gitignore)) return;
  const content = fs.readFileSync(gitignore, 'utf8');
  if (!content.includes('.env')) {
    fs.appendFileSync(gitignore, '\n# Secrets\n.env\n.env.*\n');
  }
  if (!content.includes('generated/') && repo === 'craftmind-fishing') {
    fs.appendFileSync(gitignore, '\nassets/generated/\n');
  }
}

function scanForSecrets(repo) {
  const dir = `/home/lucineer/projects/${repo}`;
  try {
    // Scan for API key patterns (excluding this file)
    const pattern = 'AIzaSy|gsk_|sk-[a-f0-9]{20,}';
    const result = execSync(
      `grep -rP "${pattern}" --include="*.js" --include="*.json" --include="*.ts" --exclude="night-pusher.js" -l . 2>/dev/null || true`,
      { cwd: dir, encoding: 'utf8' }
    ).trim();
    if (result) {
      // Check if any of these are tracked (not just in working tree)
      const tracked = result.split('\n').filter(f => {
        try { return git(repo, `ls-files --error-unmatch "${f}" 2>/dev/null`); } catch { return false; }
      });
      return tracked;
    }
  } catch {}
  return [];
}

function processRepo(repo) {
  const status = git(repo, 'status --porcelain');
  if (!status) return { repo, action: 'clean' };

  // Check for secrets
  const secrets = scanForSecrets(repo);
  if (secrets.length > 0) {
    return { repo, action: 'BLOCKED - secrets detected', files: secrets };
  }

  ensureSecretsIgnored(repo);
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

  // Count changes
  const lines = status.split('\n').filter(Boolean);
  const summary = `${lines.length} files changed`;

  // Commit
  git(repo, `add -A`);
  git(repo, `commit -m "night shift ${timestamp}: ${summary}" --allow-empty`);
  
  // Push (with timeout, DNS can be slow)
  const pushResult = git(repo, 'push origin main --timeout 60 2>&1 || true');
  const pushed = !pushResult.includes('ERROR');

  return { repo, action: pushed ? 'pushed' : 'committed (push failed)', files: lines.length, summary: pushResult.slice(0, 200) };
}

async function run() {
  const now = new Date();
  const entry = `\n## ${now.toLocaleString('en-US', { timeZone: 'America/Juneau' })} AKDT\n`;

  let log = entry;

  for (const repo of REPOS) {
    const result = processRepo(repo);
    const emoji = result.action === 'clean' ? '⬜' : result.action === 'pushed' ? '✅' : result.action.includes('BLOCKED') ? '🚫' : '⚠️';
    const line = `${emoji} **${repo}**: ${result.action}${result.files ? ` (${result.files} files)` : ''}`;
    console.log(line);
    log += `- ${line}\n`;
    if (result.summary && result.action !== 'clean') {
      log += `  \`${result.summary.slice(0, 150)}\`\n`;
    }
  }

  // Append to progress log
  fs.appendFileSync(PROGRESS_LOG, log);

  // Rotate log if too large
  try {
    const stat = fs.statSync(PROGRESS_LOG);
    if (stat.size > MAX_LOG_SIZE) {
      const backup = PROGRESS_LOG.replace('.md', `-${Date.now()}.md`);
      fs.renameSync(PROGRESS_LOG, backup);
      fs.writeFileSync(PROGRESS_LOG, `# Night Progress (rotated from ${backup})\n\n`);
    }
  } catch {}

  console.log(`\nProgress logged to ${PROGRESS_LOG}`);
}

run().catch(e => console.error('Pusher failed:', e));
