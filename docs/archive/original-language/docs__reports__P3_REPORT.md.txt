# Informe P3 — AI y cambios

2026-10-21. Ramas feat/p3-ai-and-changes y feat/p3-platform-ai, sobre P2 (228e1be/d6aad38). Proveedor público 017e54168f87ea5a0d5b97adfbb2314673bc298d, dependencia HTTPS fijada con integridad en el motor. CI conjunto fija consumidor 9697b5829baa60c0cde48d80b5eea35457f17670. No se integró P2 ni P3 en main. #55 permanece pendiente; el usuario pidió continuar P3 con ese estado visible.

## Entregado

- Proveedor HTTP/contratos/modelos, runtime de turnos y ciclo de tarea, broker de credencial de sesión, ledger persistente sin secretos y control de desconexión/cancelación/épocas.
- Registro/validación de herramientas, diff/hashes/gates humanos y codec de journal con recibos/operaciones pendientes.
- Adaptador de Game Engine que usa los módulos comunes, conserva herramientas/instrucciones/PMD y aplicación/rollback de dominio. Modelo guardado por proyecto alojado, conexión explícita al reabrir.
- Hub muestra credencial disponible y consumo informado/desconocido. Guía, ADR y contexto actualizados.

## Verificación local

Platform: 21/21 pruebas, sin omitidas con AXIOM_ENGINE_PATH. Incluye tres integraciones con procesos reales: edición manual y AI/aprobación/diff/Apply/reapertura/dos proyectos; cancelación con respuesta tardía y proveedor 429; revisión obsoleta/divergencia de MAIN/propuesta editada sin sobrescritura. Pruebas genéricas cubren errores/2 MiB/redacción, no ejecutar turnos cancelados, ledger por proyecto/reinicio/cierre tardío, registro y journal. Los 13 tests previos de P1/P2 se conservan.

Engine: npm run check 445/445 sin fallos/omitidas. Los 95 tests enfocados de asistente, work orders y propuestas pasan, incluyendo reanudación sin repetir efectos, aprobación, presupuestos, aceptación y rollback. El paquete final público está instalado; la prueba adicional acredita guardar límites sin elegir modelo ni generar solicitudes al reabrir. CI se verifica independientemente.

Navegador P3: crear/editar/guardar desde UI, conectar mediante host y limpiar campo de clave, plan con confirmación, propuesta aislada, Review y Apply humano que persiste X=2; Hub informa 250 tokens del fixture; sin pageErrors. Evidencias .axiom/p3-browser/report.json, review.png y platform.png (generadas, no fuente). P1/P2 se ejecutan como regresión conjunta al entregar.

## Límites y estado de integración

HTTP AI simulado; no una clave, factura o evaluación de modelo real. Null es aceptación UI. La cancelación puede dejar consumo desconocido, nunca lo convierte en cero. No se guardan claves, OPENAI_API_KEY se elimina del entorno heredado por el hijo, ni se eliminan journals/configuraciones previas. Modelo guardado no equivale a conexión probada.

P3 se publica por PR apilado sobre las ramas P2. Los resultados remotos se registran en los PR; no extrapolar el CI aprobado de Platform P2. Engine #55/#47/#51 y rendimiento denso siguen con su seguimiento. P4 es distribución/UI, P5 segundo consumidor; Unity/shaders/GPU M19–M40 no reciben crédito por reestructurar.
