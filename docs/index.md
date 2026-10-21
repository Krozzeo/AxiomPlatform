# Documentación de Axiom Platform

Fecha: 2026-10-21. P0 define arquitectura y planificación; no acredita implementación.

| Necesidad | Documento |
| --- | --- |
| Servicios comunes P2 | [Guía](P2_GUIDE.md), [informe](reports/P2_REPORT.md) y [decisión](adr/0003-p2-shared-services.md) |
| Ejecutar P1 | [Guía](P1_GUIDE.md) |
| Resultado P1 | [Informe](reports/P1_REPORT.md) |
| Contrato implementado P1 | [ADR-P0002](adr/0002-p1-host-and-product-ipc.md) |
| Visión, alcance y decisiones adoptadas | [Documento maestro](MASTER_PLAN.md) |
| Milestones y gates | [Roadmap P0–P5](ROADMAP.md) |
| Cierre documental de P0 | [Aceptación](P0_ACCEPTANCE.md) |
| Retomar el trabajo | [Handoff](AI_HANDOFF.md) |
| Componentes y dependencias | [Arquitectura](architecture/ARCHITECTURE.md) |
| Qué se extrae y qué permanece | [Matriz de propiedad](architecture/OWNERSHIP_MATRIX.md) |
| Contrato de producto y SDK | [Integración](architecture/PRODUCT_CONTRACT.md) |
| Configuración, proyectos y credenciales | [Datos y sesiones](architecture/DATA_AND_SESSIONS.md) |
| Herramientas y cambios de agentes | [AI](architecture/AI_CONTRACT.md) |
| Instalación, compatibilidad y distribución | [Versiones](architecture/RELEASE_AND_COMPATIBILITY.md) |
| Extracción y recuperación | [Migración](architecture/MIGRATION_PLAN.md) |
| Riesgos y validación | [Pruebas](architecture/VALIDATION_AND_RISKS.md) |
| Decisiones y pendientes | [Registro de decisiones](adr/0001-platform-foundation.md) |

Orden: maestro → arquitectura → matriz → contratos → migración → aceptación. Los contratos de Platform pertenecen a este repositorio; el adaptador y el comportamiento de Game Engine pertenecen a su repositorio. Los detalles futuros requieren validación en P1 y nuevas decisiones registradas cuando cambien el alcance.
