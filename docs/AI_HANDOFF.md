# Contexto vigente — Axiom Platform P2

2026-10-21. Nombre Axiom, repos públicos MIT, decisión comercial aplazada. P0/P1 están integradas: Platform main 0a0471b y motor main 400fec0. El usuario ejecutó 6/6 tests P1, navegador passed:true y confirmó aceptación manual sin problemas; Platform CI y motor CI 332 aprobados antes de integrar. No mover referencias de recuperación del motor.

P2 se implementa en feat/p2-shared-services y motor feat/p2-platform-services, todavía para revisión. Platform/API 0.1.1, protocolo 1 y motor scripting SDK 8 son versiones distintas. [Guía P2](P2_GUIDE.md), [decisión](adr/0003-p2-shared-services.md) e [informe](reports/P2_REPORT.md).

## Implementado en esta entrega

Catálogo/ajustes/registro persistentes, apertura por carpeta/archivo, selección nativa, importación local conservando origen e importación GitHub validadas por producto. Transporte/cuenta comunes y broker IPC: el host retiene el token en memoria; productos reciben identidad/época. Si conecta desde el editor, la credencial solo transita al host. Desconectar/expirar invalida revisiones; cerrar un editor no desconecta los demás.

Destinos/defaults/journal/historial siguen por proyecto en su producto. El motor adopta solo configuración nativa de la identidad abierta y conserva origen. Dependencia de servicios del motor fijada por HTTPS a Platform 78d219b04d16b13074d76414483bc121cef32be9 con integridad; sin enlaces locales, SSH o copias permanentes. Publicar proveedor compatible antes de consumidor; no coordinar merges simultáneos.

## Pruebas y límites

13 tests Platform, integraciones con procesos reales y navegador P1/P2 aprobados localmente. Transporte GitHub y resultado del diálogo controlados; sin PAT/publicación real, sin aceptación manual nativa P2. Renderer Null no prueba GPU. Comprobar CI nuevo y estado de PR antes de declarar P2 integrada. Guardar configuración y catálogo sin secretos; no resetear corrupción ni borrar locks sin verificar/copia previa.

## Qué sigue

P3 separará orquestación AI y protocolos de propuestas con herramientas de dominio en el producto. P4 distribución/UI comprobada y P5 segundo consumidor pequeño. M19–M40 del motor conservan Unity, shaders y físicas GPU. No cambiarlas ni acreditar cobertura por reestructurar. #47/#51, rendimiento denso, modelo conectado y aceptación GitHub nativa anterior siguen pendientes.

[Maestro](MASTER_PLAN.md) · [Roadmap](ROADMAP.md) · [Antecedentes P0/P1](archive/PRE_P2_HANDOFF.md). Los documentos históricos no son autorizaciones nuevas; no solicitar tokens por chat ni extraer credenciales internas.
