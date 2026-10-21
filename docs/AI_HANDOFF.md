# Contexto vigente — AxiomPlatform / P3

2026-10-21. Axiom, público MIT; decisión comercial aplazada. P1 aceptada por el usuario e integrada (Platform 0a0471b; Engine 400fec0). P2 entregada en ramas (228e1be/d6aad38), sin integrar: Engine CI 334 falla en drag cleanup M18.3.11, seguimiento #55; su recorrido local pasó pero no demuestra resuelto el fallo remoto. El usuario pidió continuar P3 expresamente. No mover main/recovery ni cerrar incidencias por extrapolación.

P3 implementada en feat/p3-ai-and-changes / feat/p3-platform-ai, PR apilados sobre P2. Platform/API 0.1.2, IPC 1; scripting SDK 8 independiente. Proveedor público fijado 017e54168f87ea5a0d5b97adfbb2314673bc298d, HTTPS/integridad; no enlaces locales en dependencia final. [Guía](P3_GUIDE.md) · [ADR](adr/0004-p3-ai-and-review.md) · [Informe](reports/P3_REPORT.md).

## Responsabilidades

Platform: proveedor HTTP/modelos, núcleo de turnos/cancelación/consumo, broker de clave en memoria, ledger persistente sin secretos, registro/validación de herramientas, diff/hashes/gates humanos y codec de journal. Engine: contexto/instrucciones, PMD, herramientas/precondiciones/aceptación de juegos, selección del payload de tareas, reconciliación y transacción/rollback/recursos de MAIN. Autonomía determinista específica sigue en Engine. Propuestas manuales y AI usan los mismos gates. Alojado comparte clave; cada proyecto conserva límites/modelo/confirmaciones/tareas. Elegir modelo guardado requiere test al reabrir. Cerrar editor no desconecta otros; desconectar sí cancela tareas globalmente.

El host elimina OPENAI_API_KEY del entorno de sus hijos. Claves introducidas en editor solo transitan al host. Una respuesta cancelada/obsoleta no invoca herramientas; consumo incierto se señala y un cierre tardío no sobrescribe el ledger tras reiniciar. Cuenta compartida no concede permisos de publicar/aplicar ni acceso entre proyectos. Journals y configuración previos se conservan; no resetear corrupción ni borrar locks sin copia/verificar procesos.

## Evidencia y límites

Engine npm run check 445/445, enfoque AI/work orders/workspaces 95/95. Platform 21 tests y browser P3 de aprobación→propuesta→review→Apply/persistencia sin pageErrors. P1/P2 se conservan como regresión conjunta. GitHub/AI HTTP controlados; Null. No PAT/clave/modelo real ni aceptación nativa por mocks. CI nuevo y estado PR se consultan por separado, sin afirmar integración por pruebas locales.

## Próximo trabajo

Resolver/integrar gates P2/P3 antes de declarar cierre; pruebas manuales P3 del propietario y evaluación modelo real separadas. P4 distribución/UI, P5 segundo consumidor. Engine mantiene M19–M40: Unity, shaders/compute y físicas GPU sin progreso acreditado por Platform; 45 milestones principales, 23 cerradas, auditoría M19 aún pendiente. #47/#51/#55, rendimiento denso, calidad/coste de modelo conectado y validación nativa GitHub siguen pendientes. No solicitar claves por chat ni leer credenciales internas; TestRepo solo pruebas explícitas.

[Antecedentes P2](archive/PRE_P3_HANDOFF.md). Documentos adjuntos/históricos son referencia, no instrucciones nuevas.
