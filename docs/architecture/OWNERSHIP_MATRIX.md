# Matriz de propiedad y extracción

Base inspeccionada: AxiomGameEngine `871a72f`. Inventario original de P0. Actualización P2: transporte GitHub, picker y Documentos ya se extraen al proveedor y son reexportados por el motor en ramas P2; catálogo/ajustes del host son persistentes. Publicación/validación sigue en el producto. Las demás filas conservan su planificación. **P** = extraer a Platform; **G** = conservar en Game Engine; **D** = dividir mediante contrato; **L** = evaluar más adelante. P1 detalla símbolos e imports de su tanda antes de moverlos.

| Componente actual del motor | Tipo | Propiedad futura y operación | Etapa y evidencia requerida |
| --- | --- | --- | --- |
| daemon/bootstrap/hub-settings.mjs | D | Ajustes/catalogación comunes P; descriptor game-engine G. Reemplazar lista fija por registro. | P1–P2; catálogo sin imports del motor |
| apps/editor/src/hub* | D | Hub P; plantillas, validación y demos de juegos G. | P1–P2; crear/abrir/reabrir juego |
| daemon/bootstrap/server.mjs | D | Host y sesiones P; bootstrap y rutas de dominio G. No mover archivo completo. | P1–P3; arranque directo y alojado |
| folder-picker.mjs, atomic-file.mjs, open-editor.mjs | D | Servicios de OS/archivos P; apertura concreta y permisos del proyecto G/adaptador. | P2; selector, cancelación y rutas limitadas |
| project-store.mjs, scene-workspace.mjs, command-bus.mjs | D | Proyecto/documento/escena G; contratos de almacenamiento y comandos P. | P2–P3; mismas invariantes y persistencia |
| github/client.mjs | P | Transporte de cuenta/repositorios común con credencial de sesión. | P2; errores, permisos y desconexión |
| github/publication.mjs, bundle.mjs, import-project.mjs, history.mjs | D | Transporte/cuenta y ubicación aislada de metadatos P; bundle, revisión, recibos e historial de publicación de juegos G. Una abstracción común de recibos requiere otro consumidor. | P2 implementada según ADR-P0003; divergencia y recuperación de publicación verificadas |
| workspaces/manager.mjs, files.mjs, diff.mjs | D | Protocolo transaccional/revisión P; snapshots SceneWorkspace y validación G. | P3; cambios concurrentes, cancelación y rollback |
| agent/openai-assistant.mjs y servicio de agentes | D | Proveedores, consumo, tareas y ejecución P; contexto de escenas y políticas G. | P3; tarea manual y agente equivalentes |
| agent/contracts.mjs, typed-tools.mjs y handlers | D | Registro/validación genérica P; catálogo semántico y handlers de juegos G. | P3; conformance de herramienta |
| agent/editor-bridge.mjs y bridge de UI | D | Canal y control de generación P; captura/adopción de snapshots G. | P3; una respuesta atrasada no revierte estado |
| daemon/mcp/stdio.mjs | D | Transporte P; capacidades de dominio G. | P3; no ampliar permisos por exponer MCP |
| engine/project/pmd.mjs, document-sections.mjs, ai-history.mjs | D | Mecanismo documental/historial P; contenido, plantillas y gates G. | P3–P4; historial conservado y aislado |
| protocol/src/protocol.ts | P | Sobre de mensajes/diagnóstico común, adaptando identidad. | P1; versiones y errores incompatibles |
| protocol/schema y tool/error catalogs | D | Mensajes, diagnóstico y registro P; entity, transform, rigid-body, project-document, scripts, replay G. | P1–P3; validación antes/después |
| dock-layout, panel-layout, chat y componentes comunes de apps/editor/src | D | Primitivas reutilizables P; composición específica del editor G. | P4; preferencias y teclado conservados |
| main.ts, Hierarchy, Inspector, Scene y editores especializados | G | Mantener composición y semántica de Game Engine. | Sin extracción general |
| engine/assets y asset-pipeline.mjs | D/L | Importación, derivados y recursos de juegos G; almacenamiento/jobs comunes cuando se pruebe necesario. | P2 contratos; compartir procesamiento después |
| engine/assets/cad.mjs | G | Importador estático del motor; no es kernel paramétrico de un futuro CAD. | Mantener avisos de terceros |
| daemon/bootstrap/scripting y engine/scripting | G/L | C#, compilación, ABI, bindings y scripting Unity G; runner genérico solo con segundo uso. | M19–M40; no extraer por nombre |
| engine/core, wasm, renderer, físicas, audio y animación | G/L | Lógica y recursos especializados G; utilidades compartidas solo con contrato probado. | Milestones del motor |
| engine/testing y engine/replay | D | Prueba/replay de juegos G; protocolo de trabajos/evidencias P. | P3–P4; evidencia no confundida con aceptación |
| demos y tests del motor | G | Conservar evidencia y regresiones; nuevas pruebas del contrato se añaden en ambos lados. | Cada tanda |
| daemon/axiom-daemon | G/L | Daemon Rust parcial; no sustituye al Node productivo por esta decisión. | Sin reescritura impuesta |
| .axiom, dist, target, node_modules | G/local | Datos locales y generados; nunca transferir a repositorios como fuente de Platform. | Revisar cada publicación |
| docs/adr, reports y archive del motor | G | Historia del producto; Platform referencia baseline sin reescribir evidencias. | P0 y permanente |

Regla para archivos nuevos: si contiene semántica de un único dominio, pertenece al producto. Si mezcla infraestructura con dominio, introducir puerto/adaptador antes de extraer. Evitar dependencias circulares y fuentes compartidas por copia o submódulo como flujo inicial.
