// Shared helpers for the waterfall hooks: locate and parse docs/waterfall/STATUS.md
// and classify project paths by the phase that may touch them.
import { readFileSync } from 'node:fs'
import path from 'node:path'

export const STATUS_PATH = 'docs/waterfall/STATUS.md'

export const PHASE_NAMES = {
  P1: 'Requirements',
  P2: 'Design',
  P3: 'Implementation',
  P4: 'Testing',
  P5: 'Deployment',
  P6: 'Maintenance',
}

export function projectDir(input) {
  return process.env.CLAUDE_PROJECT_DIR || input?.cwd || process.cwd()
}

export async function readStdinJson() {
  let raw = ''
  for await (const chunk of process.stdin) raw += chunk
  return raw.trim() ? JSON.parse(raw) : {}
}

const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '').trim()

/** Parse STATUS.md text. Returns null-safe structure even for partial files. */
export function parseStatus(text) {
  const result = { currentPhase: '', projectStatus: '', gatePolicy: '', phases: {}, changeRequests: [] }
  let section = ''
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/)
    if (heading) {
      section = heading[1].trim().toLowerCase()
      continue
    }
    if (!line.trim().startsWith('|')) continue
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => stripComments(c.trim()))
    const key = (cells[0] ?? '').toLowerCase()

    if (key === 'current phase') result.currentPhase = cells[1] ?? ''
    else if (key === 'project status') result.projectStatus = cells[1] ?? ''
    else if (key === 'gate policy') result.gatePolicy = cells[1] ?? ''

    if (section === 'phases') {
      const m = (cells[0] ?? '').match(/^(P[1-6])\b/)
      if (m) result.phases[m[1]] = { name: cells[0], status: cells[2] ?? '', approvedOn: cells[3] ?? '' }
    } else if (section === 'change requests') {
      if (/^CR-\d+$/.test(cells[0] ?? '')) {
        result.changeRequests.push({ id: cells[0], change: cells[2] ?? '', status: cells.at(-1) ?? '' })
      }
    }
  }
  return result
}

export function loadStatus(dir) {
  try {
    return parseStatus(readFileSync(path.join(dir, STATUS_PATH), 'utf8'))
  } catch {
    return null
  }
}

export const isApproved = (status) => /^approved\b/i.test(status?.trim() ?? '')

export const phaseApproved = (status, phase) => Boolean(status && isApproved(status.phases[phase]?.status))

export const openChangeRequests = (status) =>
  (status?.changeRequests ?? []).filter((cr) => !/^(implemented|rejected)\b/i.test(cr.status))

// Which approved phase a path requires before it may be written.
// First match wins, so the more specific deployment rules come first.
const GATED_PATHS = [
  // Deployment artefacts are Phase 5 work: P4 (Testing) must be approved.
  { requires: 'P4', test: (p) => /^\.github\/workflows\//.test(p) && !/^\.github\/workflows\/claude-hooks\.ya?ml$/.test(p) },
  { requires: 'P4', test: (p) => /^(vercel\.json|netlify\.toml|Dockerfile|docker-compose\.ya?ml|nginx\.conf|public\/_(headers|redirects))$/.test(p) },
  // Application code and tooling are Phase 3 work: P2 (Design) must be approved.
  { requires: 'P2', test: (p) => /^(src|e2e|public)\//.test(p) },
  {
    requires: 'P2',
    test: (p) =>
      /^(index\.html|package(-lock)?\.json|tsconfig(\.[\w-]+)?\.json|(vite|vitest|playwright)\.config\.[cm]?[jt]s|\.oxlintrc\.json|\.prettierrc(\.\w+)?|\.prettierignore)$/.test(p),
  },
]

/** Returns the phase that must be approved before `relPath` may be written, or null if ungated. */
export function requiredPhaseFor(relPath) {
  const p = relPath.split(path.sep).join('/').replace(/^\.\//, '')
  return GATED_PATHS.find((g) => g.test(p))?.requires ?? null
}

export function relativeToProject(dir, filePath) {
  const rel = path.relative(dir, path.resolve(dir, filePath))
  return rel.startsWith('..') || path.isAbsolute(rel) ? null : rel
}
