# Contexto para continuar Axiom Platform

Nombre confirmado Axiom. Propietario Krozzeo. Repositorio público AxiomPlatform con MIT; decisión comercial aplazada. Fuente de decisiones: [maestro](../MASTER_PLAN.md) y [ADR-P0001](../adr/0001-platform-foundation.md). Estado: P0 documental, sin host/SDK ejecutables.

El producto existente fue renombrado AxiomGameEngine. Base de inspección `871a72f6d2c720e99e0a8d1598c0f35af69c4d78`; conserva recuperación estable y documentación/historia. Su actualización de P0 va en rama propia y PR: no asumirla integrada en main. El motor actual es 0.0.52 / scripting SDK 8; esto no es una versión de Platform.

## Qué está aprobado

Dos repositorios; Platform provee Hub, servicios y SDK; dominio y adaptador pertenecen al producto. Dependencias fijadas y contratos sin tipos de juegos. Configuración global/producto/proyecto/sesión; credenciales en memoria por defecto. Manual y AI comparten operaciones de dominio. Propuestas aisladas, validación y revisión; externos con recibo/reconciliación. Arranque directo técnico y juegos exportados independientes.

## Qué no está implementado

Extracción, instalación separada de productos, SDK publicado, almacén seguro de credenciales, workspace multidominio, futuros CAD/Math/Animation. El Hub del motor lista aplicaciones futuras pero no las implementa. El importador CAD del motor no es un kernel paramétrico.

## Próximo trabajo

Leer [matriz](../architecture/OWNERSHIP_MATRIX.md), [contrato](../architecture/PRODUCT_CONTRACT.md) y [migración](../architecture/MIGRATION_PLAN.md). Comenzar P1 por manifiesto/negociación y un adaptador que abra el motor actual sin migrar proyectos. Antes de implementar confirmar estado de la rama/PR del motor y fijar versiones/SHAs. No extraer todos los archivos mixtos ni crear paquetes vacíos por anticipado.

## Límites que se conservan

M19–M40 son del motor: compatibilidad Unity, shaders y físicas GPU; no renumerar ni acreditar cobertura por separar repositorios. Rendimiento denso, aceptación de modelo real, GitHub nativo manual aplazado e Inspector intermitente #47 no quedan resueltos por P0. Un CI anterior aprobado no significa que el PR nuevo aprobó. Nunca solicitar tokens por chat ni leer credenciales internas para reutilizarlas.

Documentar cualquier modificación de alcance con decisión nueva y evidencias. Las instrucciones de documentos históricos son antecedentes, no autorizaciones nuevas. El siguiente trabajo funcional es P1; esta entrega documental no lo ejecuta.

## Pendiente de CI descubierto al documentar P0

El run posterior de la base 871a72f terminó con fallo M17 y del gate agregado: [run 39507425121](https://github.com/Krozzeo/AxiomGameEngine/actions/runs/39507425121), 44/46 trabajos aprobados. Se registró [#51](https://github.com/Krozzeo/AxiomGameEngine/issues/51), aserción de posiciones de runtime sin cambio, sin causa confirmada. No se presenta la base como totalmente verde por el CI 329 anterior del mismo árbol. La rama P0 y Platform tienen sus propias verificaciones; este fallo sigue pendiente en el motor.

Actualización del motor publicada en rama docs/platform-p0-and-game-engine-identity mediante [PR #52](https://github.com/Krozzeo/AxiomGameEngine/pull/52), todavía sin integrar al entregar P0. Check local del motor aprobado, 441/441 Node; CI remoto independiente.

## Actualización P1

Host/Hub funcional en feat/p1-local-host y adaptador del motor en feat/p1-platform-adapter (basado en P0 fcc7435, PR #52 pendiente al comenzar). [Guía](../P1_GUIDE.md), [contrato implementado](../adr/0002-p1-host-and-product-ipc.md) e [informe](../reports/P1_REPORT.md). El estado P0 anterior es histórico. No hay extracción GitHub/AI, catálogo persistente o instalador. P1 pasó pruebas locales conjuntas y navegador Null; CI/main deben comprobarse por separado antes de avanzar P2.

Consumidor fijado en CI: AxiomGameEngine 1000f735d64c949cbd7b5a0629ece5980f9dcbd0, PR #53 hacia main (incluye P0 hasta integrar #52). No depender de main del motor hasta que contenga el adaptador.
