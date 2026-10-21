# ADR-P0002 — Host mínimo y adaptador de producto P1

Fecha: 2026-10-21. Estado: implementado en ramas; revisión/CI remoto independientes.

## Contexto y decisión

Implementar un recorrido vertical sin mover servicios mixtos del motor. Platform tiene Hub web y host Node de loopback. Cada sesión inicia un proceso Node de producto mediante IPC nativo; el descriptor de una instalación se registra explícitamente por CLI. El proyecto no aporta comandos, ejecutables o entrypoints. El adaptador permanece en Game Engine y abre su daemon/editor de producción en un puerto local independiente.

Versión de Platform/API 0.1.0, protocolo IPC 1 y manifiesto 1. Negociar identidad, producto/versión, capacidades y raíz antes de abrir. Compatibilidad 0.1 admite parches y excluye 0.2; cambios del contrato se registran antes de ampliar el rango. El formato real de Game Engine sigue schemaVersion 1, identificado como axiom.game-project; no se añade una envoltura nueva al documento.

La implementación vive en services/local-host, apps/hub, packages/contracts y packages/sdk. El cliente SDK es interno y versionado en este repositorio; no se publicó un paquete npm. El adaptador implementa el protocolo, sin importar código de Platform ni copiar su SDK. La fuente de verdad del contrato es este repositorio; pruebas conjuntas fijan el consumidor exacto.

## Ciclo de vida y seguridad

Estado de sesión starting/ready/closed/failed. Ready solo después de iniciar servidor y abrir documento. Lectura de estado, guardar y cerrar incluyen identificación de sesión; guardar/cerrar comprueban revisión dentro de la cola transaccional del producto. operationId conserva recibos de éxito y error por sesión del host/producto (límite 256); duplicados no repiten efectos ni cambian argumentos. No se promete deduplicación persistente tras reiniciar Platform: resultado incierto requiere inspección.

Loopback, Host exacto, origen y Bearer por proceso; CSP sin scripts inline, sin proxy de comandos del motor. El editor tiene token separado en fragmento de URL de arranque, como el flujo existente; no se incluye en logs, proyectos o pruebas persistidas. Solo el catálogo autenticado lo devuelve para abrir la pestaña. Raíces y entrypoint canónicos rechazan traversal y escapes mediante enlaces.

El motor controla sesión alojada, trabajos/Play/preview, buffers de código y un arrendamiento por carpeta. El editor publica cambios de buffers con secuencia para ignorar reportes atrasados. Guardar desde Platform no descarta buffers: requiere guardarlos en el editor. Cerrar con descarte es explícito. Un cierre abrupto puede perder borradores en memoria y dejar bloqueo; no se finge recuperación automática.

## Alternativas y consecuencias

Se descartaron iframe (las protecciones actuales no permiten alojar el editor), importar SceneWorkspace desde Platform y extraer todo el Hub/AI en P1. IPC evita puertos extra de control y mantiene aislamiento, a cambio de necesitar una instalación de Node/motor compatible. El catálogo en memoria y las rutas escritas son límites deliberados hasta P2. El arranque nativo y sus contratos se conservan; versiones antiguas no respetan el nuevo arrendamiento.

## Aceptación

Tests de contrato/procesos y recorrido conjunto con el motor real, más navegador con editor real y Null. Incompatibilidad sin escritura, cancelar cierre, rechazo de revisión atrasada, persistencia/reapertura, bloqueo de apertura concurrente y arranque nativo posterior. [Guía](../P1_GUIDE.md) e [informe](../reports/P1_REPORT.md). No acredita GPU, Unity ni modelo conectado.
