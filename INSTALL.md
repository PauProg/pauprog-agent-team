# Instalar PauProg Agent Team

Estas instrucciones son para el agente que integra esta carpeta en el proyecto que la contiene.

## Reglas

- La raíz fuente es la carpeta que contiene este archivo.
- La raíz destino es su carpeta padre, salvo que el usuario indique otra.
- Git solo de lectura (`status`, `diff`, `log`, `show`…); `git pull` solo con confirmación. Nada de `gh`, worktrees ni comandos de Git que escriban.
- Al fusionar permisos, el orden importa: gana la última regla que coincide. Los bloqueos de escritura de Git y de `gh` deben quedar al final de `permissions`.
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
- copias de seguridad que se harán y dónde;
- validación con `validar-equipo.mjs`, sin comandos de Git que escriban.

Detente hasta recibir `OK`. La petición de instalación no cuenta como aprobación.

## 3. Instalación tras el OK

### Copia de seguridad

Antes de modificar o sustituir un archivo que ya existe (configuración, `AGENTS.md`, los cinco agentes, `orchestrator.md` y `executor.md`), cópialo a `.pauprog-backup/AAAA-MM-DD/` en el destino, con su ruta relativa. Si esa carpeta ya existe, usa `AAAA-MM-DD-2`. No borres copias: lo decide el usuario.

### Configuración OpenCode

- Si el destino no tiene configuración, copia `opencode.json` a su raíz.
- Si ya tiene `opencode.json(c)`, conserva su formato y contenido ajeno y fusiona desde la fuente:
  - `model` y `default_agent`;
  - `snapshots`, `tool_output` y los patrones que falten de `watcher.ignore`;
  - reglas que falten de `permissions` y `policies`, sin duplicar triples `action/resource/effect`;
  - orden de `permissions`: los bloqueos de escritura de Git y de `gh` van al final, después de cualquier regla `allow` o `ask` ajena. Si el destino tiene reglas de `shell` posteriores que los anulen, díselo al usuario en el plan.
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

Ejecuta el script de la carpeta fuente (solo lee; el plan ya lo incluía):

```text
node pauprog-agent-team/validar-equipo.mjs
```

Sin argumento valida la carpeta padre; con una ruta, valida esa raíz. Comprueba que la configuración carga y que `default_agent` es `pauprog`, que los cinco agentes existen, son idénticos a la fuente y usan los modelos documentados (y que existen en `opencode models`), que PauProg delega en los cuatro y ningún otro delega, que Git es de solo lectura con `pull` en `ask` y `gh` denegado (también encadenado), que Planner solo escribe en `../docs/**` y Ampeter no, que el bloque de `AGENTS.md` aparece una sola vez y que no quedan referencias a `orchestrator` o `executor`.

- Si hay `FALLO`, corrígelo y vuelve a ejecutarlo hasta que termine con «Validación correcta».
- Los `AVISO` no fallan, pero cuéntaselos al usuario.
- El script simula la regla «gana la última que coincide»; no es OpenCode. Pide además al usuario que pruebe con PauProg: `git status` funciona, `git commit` queda denegado y `git status && git commit` también.

Entrega un resumen corto de archivos creados, modificados y retirados, copias de seguridad, validaciones y riesgos. No ejecutes Git que escriba.