#!/usr/bin/env node
// PostToolUse hook: after Claude writes or edits an app source file, format it with
// Prettier and lint it with oxlint. Lint errors go back to Claude (exit 2 + stderr)
// so they get fixed immediately instead of piling up until `npm run check`.
// Does nothing until the app is scaffolded (no node_modules/.bin tools yet).
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { projectDir, readStdinJson, relativeToProject } from './lib/status.mjs'

const FORMAT_EXT = /\.(tsx?|jsx?|mjs|cjs|css|json|html)$/
const LINT_EXT = /\.(tsx?|jsx?|mjs|cjs)$/
const SKIP = /^(docs|\.claude|node_modules|dist|coverage)\//

function run(bin, args, cwd) {
  try {
    execFileSync(bin, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], timeout: 45_000, encoding: 'utf8' })
    return null
  } catch (err) {
    const e = /** @type {{ stdout?: string, stderr?: string, message: string }} */ (err)
    return `${e.stdout ?? ''}${e.stderr ?? ''}`.trim() || e.message
  }
}

try {
  const input = await readStdinJson()
  const dir = projectDir(input)
  const filePath = input.tool_input?.file_path
  if (!filePath) process.exit(0)
  const rel = relativeToProject(dir, filePath)
  if (!rel || SKIP.test(rel.split(path.sep).join('/')) || !existsSync(filePath)) process.exit(0)

  const bin = (name) => path.join(dir, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name)
  const problems = []

  if (FORMAT_EXT.test(rel) && existsSync(bin('prettier'))) {
    const out = run(bin('prettier'), ['--write', '--log-level', 'warn', rel], dir)
    if (out) problems.push(`Prettier could not format ${rel}:\n${out}`)
  }
  if (LINT_EXT.test(rel) && existsSync(bin('oxlint'))) {
    const out = run(bin('oxlint'), ['--quiet', rel], dir)
    if (out) problems.push(`oxlint found errors in ${rel}:\n${out}`)
  }

  if (problems.length) {
    process.stderr.write(`${problems.join('\n\n')}\n\nFix these before continuing.\n`)
    process.exit(2)
  }
  process.exit(0)
} catch (err) {
  process.stderr.write(`format-lint hook error (ignored): ${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(0)
}
