# P1 — Host y primer producto

Fecha: 2026-10-21. Entrega en ramas para revisión; no asumir main integrado. Baselines: Platform 5f6787c, Game Engine fcc7435 (P0, PR #52 aún pendiente al iniciar P1). Motor fijado: 1000f735d64c949cbd7b5a0629ece5980f9dcbd0, [PR #53](https://github.com/Krozzeo/AxiomGameEngine/pull/53). El workflow de Platform fija ese SHA, no una rama mutable. La revisión de Platform identifica su propio commit.

## Implementación

Host local autenticado y Hub funcional en Platform, registro explícito de instalaciones y raíz autorizada. Contratos/descriptor 1 y API 0.1.0, cliente IPC con timeout, cierre y control de respuestas. Adaptador propio en Game Engine; ningún import de código del motor desde Platform. Crear/abrir en proceso aislado, estado/revisión, guardar y cierre con decisión explícita. No se ha extraído GitHub, AI o el catálogo persistente.

Game Engine incorpora un puerto de autoría transaccional para sesiones alojadas, mantiene edición en su editor y evita cambiar de proyecto desde su Hub interno. Protege buffers de código pendientes y añade bloqueo por carpeta respetado por nuevas aperturas nativas. Formatos, SDK 8 y M19–M40 no cambian. El SDK de Platform no está publicado en npm; se verifica mediante el protocolo y versiones de los dos checkouts.

## Evidencia local

| Gate | Resultado |
| --- | --- |
| Contratos y rutas | Descriptor/rango/capacidades, traversal y enlace fuera de raíz, entrypoint fuera de instalación: aprobados |
| Procesos | Fallo y proceso sin respuesta rechazan solicitudes: aprobado |
| Integración real | Crear, editar, cancelar cierre, revisión atrasada sin escritura, guardar idempotente, cerrar/reabrir y arranque nativo tras liberar lease: aprobado |
| Formato y autenticación | Formato futuro sin escritura, origen ajeno y credencial errónea: aprobado |
| Navegador | Hub → editor en otra pestaña → entidad → estado dirty → cancelar → guardar → cerrar/reabrir, sin pageErrors: aprobado |
| Motor | npm run check completo: 443/443 Node más build/catálogos/bindings/esquemas/arquitectura/paridad: aprobado |
| Buffers | Reporte atrasado no borra dirty; Save/Save-close bloqueados y Cancel conserva sesión: aprobado en tests del motor |

El navegador usa Chromium headless y renderer Null. No es aceptación GPU ni prueba manual del usuario. Imágenes y report.json se generan en .axiom/p1-browser y no se versionan. Las primeras ejecuciones ajustaron el harness para esperar opciones adjuntas al select y para respetar el rechazo del arranque nativo durante un lease; no se aumentaron tiempos ni retiraron comprobaciones funcionales.

## Límites y pendientes

El primer CI de Platform aprobó contratos Linux e integración/browser real. Windows detectó comparación de una raíz abreviada con su ruta canónica. Se normaliza también la raíz antes de comprobar el destino real y se añade una raíz autorizada por alias al mismo test, conservando traversal y enlace de escape. La siguiente ejecución verifica la corrección; no se relaja el límite de acceso.

Las pruebas locales no certifican CI remoto. P0 del motor sigue en PR separado; la rama P1 se basa en él y no se fusiona a main automáticamente. #47/#51, GPU, rendimiento denso, GitHub nativo manual y modelo real permanecen pendientes. P1 no resuelve esos antecedentes.

Registro/catálogo de sesión en memoria, entrada de ruta manual, instalación de desarrollador y sin actualizador. Máximo 8 procesos activos; recibos acotados a 256 operaciones. Un cierre forzado puede dejar lease y perder cambios sin guardar: recuperación manual documentada, sin borrar bloqueo automáticamente. No abrir la misma carpeta con un motor anterior a P1. Modelo comercial sigue aplazado; MIT vigente.

## Gate de salida

P1 implementada y validada localmente para revisión. La integración en main exige los checks de cada repositorio y las dependencias del PR del motor. P2 comienza después con catálogo/ajustes/servicios comunes, sin mover semántica de juegos a Platform.
