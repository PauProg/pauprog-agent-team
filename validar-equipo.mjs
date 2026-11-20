// Valida la instalación del equipo PauProg en un proyecto. Solo LEE: no modifica nada.
// Uso:  node pauprog-agent-team/validar-equipo.mjs [raiz-destino]
// Sin argumento, el destino es la carpeta padre de esta (como en INSTALL.md).
// Para validar este mismo repositorio, desde su raíz:  node validar-equipo.mjs .
// Sale con código 1 si algo falla. Los avisos no hacen fallar.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FUENTE = dirname(fileURLToPath(import.meta.url));
const DESTINO = resolve(process.argv[2] ?? dirname(FUENTE));
const AGENTES = ['pauprog', 'explorer', 'planner', 'ampeter', 'reviewer'];
const INICIO = '<!-- pauprog-agent-team:start -->';
const FIN = '<!-- pauprog-agent-team:end -->';

const lineas = [];
let fallos = 0;
const ok = (t) => lineas.push(`  OK     ${t}`);
const fallo = (t) => { fallos++; lineas.push(`  FALLO  ${t}`); };
const aviso = (t) => lineas.push(`  AVISO  ${t}`);
const leer = (r) => readFileSync(r, 'utf8').replace(/\r\n/g, '\n');
const comprueba = (cond, bien, mal) => (cond ? ok(bien) : fallo(mal));

// ── Lectores ──────────────────────────────────────────────────────────────────────────────
function jsonc(texto) {
  let salida = '', i = 0, enCadena = false;
  while (i < texto.length) {
    const c = texto[i], n = texto[i + 1];
    if (enCadena) {
      salida += c;
      if (c === '\\') { salida += n; i += 2; continue; }
      if (c === '"') enCadena = false;
      i++; continue;
    }
    if (c === '"') { enCadena = true; salida += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < texto.length && texto[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { const f = texto.indexOf('*/', i + 2); i = f < 0 ? texto.length : f + 2; continue; }
    salida += c; i++;
  }
  return JSON.parse(salida.replace(/,(\s*[}\]])/g, '$1'));
}

const sinComillas = (s) => s.trim().replace(/^"(.*)"$/, '$1');

function agente(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---/);
  const f = { permissions: [] };
  if (!m) return f;
  let actual = null, enPermisos = false, r;
  for (const l of m[1].split('\n')) {
    if ((r = l.match(/^(\w+):\s*(.*)$/))) {
      enPermisos = r[1] === 'permissions';
      if (!enPermisos) f[r[1]] = sinComillas(r[2]);
      continue;
    }
    if (!enPermisos) continue;
    if ((r = l.match(/^\s+- (\w+):\s*(.*)$/))) { actual = { [r[1]]: sinComillas(r[2]) }; f.permissions.push(actual); continue; }
    if (actual && (r = l.match(/^\s+(\w+):\s*(.*)$/))) actual[r[1]] = sinComillas(r[2]);
  }
  return f;
}

// Gana la última regla que coincide (OpenCode V2). Los comodines `*` casan con cualquier texto.
const patron = (p) => new RegExp('^' + p.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 's');
function efecto(reglas, accion, recurso) {
  let e = null;
  for (const r of reglas) if (patron(r.action).test(accion) && patron(r.resource).test(recurso)) e = r.effect;
  return e;
}

// ── 1. Configuración ──────────────────────────────────────────────────────────────────────
lineas.push(`Destino: ${DESTINO}`, '', 'Configuración');
const CANDIDATAS = ['opencode.json', 'opencode.jsonc', '.opencode/opencode.json', '.opencode/opencode.jsonc']
  .map((c) => join(DESTINO, c)).filter(existsSync);
let config = null;
if (CANDIDATAS.length === 0) fallo('no hay opencode.json(c) en el destino');
else {
  try { config = jsonc(leer(CANDIDATAS[0])); ok(`carga ${CANDIDATAS[0].slice(DESTINO.length + 1)}`); }
  catch (e) { fallo(`${CANDIDATAS[0].slice(DESTINO.length + 1)} no es JSON válido: ${e.message}`); }
  if (CANDIDATAS.length > 1) aviso(`hay ${CANDIDATAS.length} configuraciones; se valida solo la primera (${CANDIDATAS[0].slice(DESTINO.length + 1)})`);
}
if (config) comprueba(config.default_agent === 'pauprog', 'default_agent es pauprog', `default_agent es «${config.default_agent}», debe ser pauprog`);
const global = config?.permissions ?? [];

// ── 2. Agentes ────────────────────────────────────────────────────────────────────────────
lineas.push('', 'Agentes');
const dirAgentes = join(DESTINO, '.opencode', 'agents');
const dirFuente = join(FUENTE, '.opencode', 'agents');
const mismaCarpeta = resolve(dirAgentes) === resolve(dirFuente);
const agentes = {};
for (const a of AGENTES) {
  const ruta = join(dirAgentes, `${a}.md`);
  if (!existsSync(ruta)) { fallo(`falta .opencode/agents/${a}.md`); continue; }
  const texto = leer(ruta);
  agentes[a] = { texto, ...agente(texto) };
  if (!mismaCarpeta && existsSync(join(dirFuente, `${a}.md`))) {
    comprueba(leer(join(dirFuente, `${a}.md`)) === texto, `${a}.md idéntico a la fuente`, `${a}.md difiere de la fuente (al actualizar se sustituye completo)`);
  }
}
for (const viejo of ['orchestrator', 'executor']) {
  if (existsSync(join(dirAgentes, `${viejo}.md`))) aviso(`existe ${viejo}.md: instalación antigua o agente ajeno; revísalo`);
}

// Modelos: lo documentado en README.md de la fuente y lo que ofrece `opencode models`.
const documentados = {};
if (existsSync(join(FUENTE, 'README.md'))) {
  for (const f of leer(join(FUENTE, 'README.md')).matchAll(/^\|\s*(\w+)\s*\|[^|]*\|\s*`([^`]+)`\s*\|$/gm)) documentados[f[1].toLowerCase()] = f[2];
}
let disponibles = null;
try {
  disponibles = new Set(execSync('opencode models', { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n').map((s) => s.trim()).filter(Boolean));
} catch { aviso('no pude ejecutar `opencode models`: no se comprueba que los modelos existan'); }
for (const a of AGENTES) {
  if (!agentes[a]) continue;
  const modelo = agentes[a].model;
  if (documentados[a]) comprueba(modelo === documentados[a], `${a}: modelo ${modelo} (el documentado)`, `${a}: usa ${modelo} y el README documenta ${documentados[a]}`);
  if (disponibles && modelo) comprueba(disponibles.has(modelo.replace(/#.*$/, '')), `${a}: ${modelo} existe en opencode models`, `${a}: ${modelo} no aparece en opencode models`);
}

// ── 3. Permisos efectivos (globales + los del agente) ─────────────────────────────────────
lineas.push('', 'Delegación');
const efectivas = (a) => [...global, ...(agentes[a]?.permissions ?? [])];
if (agentes.pauprog) {
  for (const a of ['explorer', 'planner', 'ampeter', 'reviewer']) {
    comprueba(efecto(efectivas('pauprog'), 'subagent', a) === 'allow', `pauprog puede delegar en ${a}`, `pauprog no puede delegar en ${a}`);
  }
  for (const a of ['explorer', 'planner', 'ampeter', 'reviewer']) {
    if (agentes[a]) comprueba(efecto(efectivas(a), 'subagent', 'ampeter') === 'deny', `${a} no puede delegar`, `${a} puede delegar y no debe`);
  }
}

lineas.push('', 'Git y gh (reglas efectivas por agente)');
const PRUEBAS_GIT = [
  ['git status', 'allow'], ['git diff src/app.js', 'allow'], ['git log --oneline', 'allow'], ['git show HEAD', 'allow'],
  ['git pull', 'ask'],
  ['git commit -m x', 'deny'], ['git push', 'deny'], ['git add .', 'deny'], ['git checkout main', 'deny'], ['git branch -D x', 'deny'],
  ['git status && git commit -m x', 'deny'], ['git diff --output=x', 'deny'],
  ['gh pr create', 'deny'], ['echo x && gh pr list', 'deny'],
];
for (const a of ['pauprog', 'ampeter', 'reviewer']) {
  if (!agentes[a]) continue;
  const malas = PRUEBAS_GIT.filter(([cmd, esperado]) => efecto(efectivas(a), 'shell', cmd) !== esperado)
    .map(([cmd, esperado]) => `«${cmd}» da ${efecto(efectivas(a), 'shell', cmd)}, esperado ${esperado}`);
  comprueba(malas.length === 0, `${a}: ${PRUEBAS_GIT.length} comandos de Git y gh se resuelven como se espera`, `${a}: ${malas.join('; ')}`);
}
for (const a of ['explorer', 'planner']) {
  if (agentes[a]) comprueba(['git status', 'git commit -m x', 'ls'].every((c) => efecto(efectivas(a), 'shell', c) === 'deny'), `${a}: sin shell`, `${a} puede ejecutar comandos y no debe`);
}
const necesarias = ['shell:*git commit*', 'shell:*git push*', 'shell:gh *', 'opencode_worktree_*:*'];
const politicas = config?.policies ?? [];
for (const n of necesarias) comprueba(politicas.some((p) => p.resource === n && p.effect === 'deny'), `política deny ${n}`, `falta la política deny ${n}`);

lineas.push('', 'Edición');
const EDICIONES = {
  planner: { '../docs/spec.md': 'allow', 'src/app.js': 'deny' },
  ampeter: { '../docs/spec.md': 'deny', 'src/app.js': 'ask' },
  pauprog: { '../docs/spec.md': 'deny', 'src/app.js': 'deny' },
  explorer: { '../docs/spec.md': 'deny', 'src/app.js': 'deny' },
  reviewer: { '../docs/spec.md': 'deny', 'src/app.js': 'deny' },
};
for (const [a, casos] of Object.entries(EDICIONES)) {
  if (!agentes[a]) continue;
  const malas = Object.entries(casos).filter(([ruta, esperado]) => efecto(efectivas(a), 'edit', ruta) !== esperado)
    .map(([ruta, esperado]) => `edit ${ruta} da ${efecto(efectivas(a), 'edit', ruta)}, esperado ${esperado}`);
  comprueba(malas.length === 0, `${a}: permisos de edición correctos`, `${a}: ${malas.join('; ')}`);
}

// ── 4. AGENTS.md y referencias antiguas ───────────────────────────────────────────────────
lineas.push('', 'AGENTS.md y referencias');
const rutaAgentsMd = join(DESTINO, 'AGENTS.md');
if (!existsSync(rutaAgentsMd)) fallo('falta AGENTS.md en el destino');
else {
  const t = leer(rutaAgentsMd);
  const inicios = t.split(INICIO).length - 1, fines = t.split(FIN).length - 1;
  comprueba(inicios === 1 && fines === 1 && t.indexOf(INICIO) < t.indexOf(FIN), 'el bloque pauprog-agent-team aparece una sola vez', `el bloque aparece ${inicios} veces (inicio) y ${fines} (fin); debe ser una de cada`);
  const bloque = t.slice(t.indexOf(INICIO), t.indexOf(FIN) + FIN.length);
  const propios = [bloque, JSON.stringify(config ?? {}), ...Object.values(agentes).map((a) => a.texto)].join('\n');
  comprueba(!/\b(orchestrator|executor)\b/i.test(propios), 'sin referencias activas a orchestrator ni executor', 'quedan referencias a orchestrator o executor en el equipo');
}

console.log(lineas.join('\n'));
console.log(fallos === 0 ? '\nValidación correcta.' : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
