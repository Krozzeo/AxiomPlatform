# Contexto para continuar Axiom Platform

Nombre confirmado Axiom. Propietario Krozzeo. Repositorio público AxiomPlatform con MIT; decisión comercial aplazada. Fuente de decisiones: [maestro](MASTER_PLAN.md) y [ADR-P0001](adr/0001-platform-foundation.md). Estado: P0 documental, sin host/SDK ejecutables.

El producto existente fue renombrado AxiomGameEngine. Base de inspección `871a72f6d2c720e99e0a8d1598c0f35af69c4d78`; conserva recuperación estable y documentación/historia. Su actualización de P0 va en rama propia y PR: no asumirla integrada en main. El motor actual es 0.0.52 / scripting SDK 8; esto no es una versión de Platform.

## Qué está aprobado

Dos repositorios; Platform provee Hub, servicios y SDK; dominio y adaptador pertenecen al producto. Dependencias fijadas y contratos sin tipos de juegos. Configuración global/producto/proyecto/sesión; credenciales en memoria por defecto. Manual y AI comparten operaciones de dominio. Propuestas aisladas, validación y revisión; externos con recibo/reconciliación. Arranque directo técnico y juegos exportados independientes.

## Qué no está implementado

Extracción, instalación separada de productos, SDK publicado, almacén seguro de credenciales, workspace multidominio, futuros CAD/Math/Animation. El Hub del motor lista aplicaciones futuras pero no las implementa. El importador CAD del motor no es un kernel paramétrico.

## Próximo trabajo

Leer [matriz](architecture/OWNERSHIP_MATRIX.md), [contrato](architecture/PRODUCT_CONTRACT.md) y [migración](architecture/MIGRATION_PLAN.md). Comenzar P1 por manifiesto/negociación y un adaptador que abra el motor actual sin migrar proyectos. Antes de implementar confirmar estado de la rama/PR del motor y fijar versiones/SHAs. No extraer todos los archivos mixtos ni crear paquetes vacíos por anticipado.

## Límites que se conservan

M19–M40 son del motor: compatibilidad Unity, shaders y físicas GPU; no renumerar ni acreditar cobertura por separar repositorios. Rendimiento denso, aceptación de modelo real, GitHub nativo manual aplazado e Inspector intermitente #47 no quedan resueltos por P0. Un CI anterior aprobado no significa que el PR nuevo aprobó. Nunca solicitar tokens por chat ni leer credenciales internas para reutilizarlas.

Documentar cualquier modificación de alcance con decisión nueva y evidencias. Las instrucciones de documentos históricos son antecedentes, no autorizaciones nuevas. El siguiente trabajo funcional es P1; esta entrega documental no lo ejecuta.
