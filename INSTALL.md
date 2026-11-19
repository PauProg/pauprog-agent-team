# Instalar PauProg Agent Team

Estas instrucciones son para el agente que integra esta carpeta en el proyecto que la contiene.

## Reglas

- La raíz fuente es la carpeta que contiene este archivo.
- La raíz destino es su carpeta padre, salvo que el usuario indique otra.
- No uses Git, `gh`, worktrees ni acciones equivalentes.
- No crees, edites ni borres nada antes de que el usuario apruebe tu plan con un `OK` explícito.
- No sobrescribas configuración ajena: conserva MCP, plugins, proveedores, comandos, skills e instrucciones locales.

## 1. Inspección de solo lectura

1. Lee el manifiesto principal del destino y lista únicamente su estructura superior.
2. Localiza, sin recorrer carpetas pesadas:
   - `opencode.json`, `opencode.jsonc` y `.opencode/opencode.json(c)` del destino;
   - `AGENTS.md` del destino;
   - `.opencode/agents/{pauprog,explorer,planner,ampeter,reviewer}.md`;
   - una instalación antigua con `{orchestrator,executor}.md`.
3. Lee solo los fragmentos necesarios. No leas lockfiles, dependencias, generados ni `.git`.

## 2. Plan y aprobación

Presenta al usuario un plan breve con:

- archivo de configuración OpenCode que se creará o fusionará;
- agentes que se crearán, actualizarán o migrarán;
- incorporación o actualización del bloque `pauprog-agent-team` en `AGENTS.md`;
- archivos antiguos concretos que se retirarán;
- validaciones sin Git.

Detente hasta recibir `OK`. La petición de instalación no cuenta como aprobación.

## 3. Instalación tras el OK

### Configuración OpenCode

- Si el destino no tiene configuración, copia `opencode.json` a su raíz.
- Si ya tiene `opencode.json(c)`, conserva su formato y contenido ajeno y fusiona desde la fuente:
  - `model` y `default_agent`;
  - `snapshots`, `tool_output` y los patrones que falten de `watcher.ignore`;
  - reglas que falten de `permissions` y `policies`, sin duplicar triples `action/resource/effect`.
- Si existen configuraciones directas y bajo `.opencode/`, respeta su precedencia y modifica solo la que el plan haya identificado como configuración principal.

### Agentes

- Copia los cinco archivos fuente de `.opencode/agents/` al mismo directorio del destino.
- Estos cinco nombres pertenecen al equipo y se sustituyen completos al actualizarlo.
- Si detectaste una instalación anterior de este mismo equipo, elimina `orchestrator.md` y `executor.md` solo después de confirmar que fueron reemplazados por `pauprog.md` y `ampeter.md`. No borres agentes ajenos con esos nombres sin autorización expresa.

### Instrucciones del proyecto

- Si no existe `AGENTS.md` en el destino, copia el archivo fuente.
- Si existe, conserva sus instrucciones locales e inserta al final el bloque comprendido entre:
  - `<!-- pauprog-agent-team:start -->`
  - `<!-- pauprog-agent-team:end -->`
- Si el bloque ya existe, sustitúyelo en su sitio. Debe quedar exactamente uno.

## 4. Validación

Sin usar Git:

1. Comprueba que el JSON/JSONC carga y que `default_agent` es `pauprog`.
2. Comprueba que existen exactamente los cinco agentes del equipo y usan solo los modelos documentados.
3. Comprueba que PauProg puede delegar en `ampeter` y que no queda una referencia activa a `orchestrator` o `executor`.
4. Comprueba que el bloque de `AGENTS.md` aparece una sola vez.
5. Comprueba que los bloqueos de Git y worktrees siguen presentes.

Entrega un resumen corto de archivos creados, modificados y retirados, validaciones y riesgos. No ejecutes Git.
