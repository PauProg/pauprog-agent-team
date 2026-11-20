# PauProg Agent Team

Equipo OpenCode portable y agnóstico al stack: PauProg coordina; Explorer localiza; Planner diseña; Ampeter implementa; Reviewer comprueba. Inspecciona primero el manifiesto y la estructura, usa Git solo para leer (y pull con confirmación) y no escribe antes del OK del usuario.

## Instalar en cualquier proyecto

1. Copia la carpeta completa `pauprog-agent-team/` dentro del proyecto.
2. Abre OpenCode en la raíz del proyecto.
3. Pide exactamente:

   > Lee `pauprog-agent-team/INSTALL.md` e implementa este equipo de agentes en el proyecto.

El agente inspeccionará la configuración existente, presentará un plan y esperará tu OK. Si el equipo ya está instalado, actualizará solo su bloque y sus cinco agentes. El procedimiento completo está en [INSTALL.md](INSTALL.md).

## Estructura

```text
opencode.json                  configuración fuente
AGENTS.md                      contrato fuente, delimitado para poder fusionarlo
INSTALL.md                     instalación y actualización seguras
validar-equipo.mjs             valida la instalación (solo lee): node pauprog-agent-team/validar-equipo.mjs
.opencode/agents/pauprog.md
.opencode/agents/explorer.md
.opencode/agents/planner.md
.opencode/agents/ampeter.md
.opencode/agents/reviewer.md
```

## Modelos

| Agente | Función | Modelo |
|---|---|---|
| PauProg | Coordinación y aprobación | `openai/gpt-6.1-sol` |
| Explorer | Exploración barata | `opencode/deepseek-v4.1-flash-free` |
| Planner | Planificación compleja | `openai/gpt-6-astra` |
| Ampeter | Implementación | `openai/gpt-6.1-terra-fast` |
| Reviewer | Revisión barata | `opencode/nemotron-3.5-lightning-free` |

OpenCode V2 no ofrece un ajuste genérico de esfuerzo `auto` para agentes ni estos modelos publican una variante `#auto`. No se fija esfuerzo para que el proveedor lo seleccione automáticamente.

## Seguridad

- Git es de solo lectura (`status`, `diff`, `log`, `show`, `blame`, `ls-files`, `rev-parse`, `branch` para listar, `remote -v`); `git pull` pide confirmación.
- Cualquier comando de Git que escriba o publique, `gh` y los worktrees están denegados por permisos y políticas duras, también dentro de comandos encadenados.
- Shell y escrituras piden confirmación.
- Explorer y Planner no pueden ejecutar comandos; Explorer y Reviewer no pueden editar, y Planner solo puede editar `../docs`, que Ampeter no puede tocar.
- PauProg no edita y Ampeter solo actúa tras el OK comunicado por PauProg.

OpenCode recarga la configuración al guardarla. No hace falta reiniciarlo.