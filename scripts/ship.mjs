#!/usr/bin/env node
/**
 * ship — one command to finish a unit of work: commit and push.
 *
 *   npm run ship "feat: seed demo data"              stage everything, commit, push
 *   npm run ship "fix: x" -- src/store src/types     stage only those paths
 *   npm run ship:push                                push only (used by post-commit)
 *
 * Reliability rules baked in:
 *   - never hangs: GIT_TERMINAL_PROMPT=0 + a timeout on every network call
 *   - never pushes from a detached HEAD
 *   - rebases on the remote before pushing, retries once on a race
 *   - a failed push never loses the commit
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const pushOnly = args.includes('--push');
const rest = args.filter((a) => a !== '--push');

// Message first, optional paths after. npm strips the first `--`, so both of
// these are equivalent:
//   npm run ship "feat: x" -- src/store      -> argv = ["feat: x", "src/store"]
//   node scripts/ship.mjs "feat: x" -- src   -> argv = ["feat: x", "--", "src"]
const sep = rest.indexOf('--');
const message = (sep >= 0 ? rest.slice(0, sep).join(' ') : (rest[0] ?? '')).trim();
const paths = sep >= 0 ? rest.slice(sep + 1) : rest.slice(1);

const TIMEOUT = 60_000;
const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };

const git = (argv, quiet = false) =>
  execFileSync('git', argv, { stdio: quiet ? 'pipe' : 'inherit', env, timeout: TIMEOUT });

const gitOut = (argv) =>
  execFileSync('git', argv, { stdio: 'pipe', env, timeout: TIMEOUT, encoding: 'utf8' }).trim();

function currentBranch() {
  return gitOut(['rev-parse', '--abbrev-ref', 'HEAD']);
}

function hasUpstream(branch) {
  try {
    gitOut(['rev-parse', '--abbrev-ref', `${branch}@{upstream}`]);
    return true;
  } catch {
    return false;
  }
}

function push() {
  const branch = currentBranch();
  if (!branch || branch === 'HEAD') {
    console.error('✗ ship: detached HEAD — refusing to push.');
    process.exit(1);
  }

  if (!hasUpstream(branch)) {
    console.log(`… ship: no upstream for ${branch} — pushing and setting origin/${branch}`);
    git(['push', '-u', 'origin', branch]);
    console.log(`✔ pushed ${branch} (upstream set)`);
    return;
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      git(['pull', '--rebase', '--autostash', 'origin', branch], attempt > 1);
      git(['push', 'origin', branch]);
      console.log(`✔ pushed to origin/${branch}`);
      return;
    } catch {
      console.error(`✗ ship: push attempt ${attempt} failed`);
      if (attempt === 2) {
        console.error('  The commit is safe locally. Fix the cause, then: npm run ship:push');
        process.exit(1);
      }
      console.log('… retrying once after rebase');
    }
  }
}

function commitAndPush() {
  if (!message) {
    console.error('✗ ship: a commit message is required.');
    console.error('  e.g.  npm run ship "feat: seed demo data"');
    process.exit(2);
  }

  if (paths.length) git(['add', '--', ...paths]);
  else git(['add', '-A']);

  let staged = '';
  try {
    staged = gitOut(['diff', '--cached', '--name-only']);
  } catch {
    staged = '';
  }

  if (!staged) {
    console.log('… ship: nothing staged to commit');
  } else {
    const count = staged.split('\n').length;
    console.log(`… ship: committing ${count} file(s)`);
    git(['commit', '-m', message]);
  }

  push();
}

pushOnly ? push() : commitAndPush();
