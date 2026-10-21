# Axiom Platform

Entorno local común para la familia Axiom: Hub de productos y proyectos, servicios locales e integración con agentes AI. Axiom Game Engine es su primer producto; CAD, matemáticas y animación son direcciones futuras, todavía sin implementación.

**Estado: P1 funcional en rama para revisión.** Host local, Hub y adaptador del motor con creación/apertura, guardado y cierre. [Arranque y prueba](docs/P1_GUIDE.md) · [Evidencias y límites](docs/reports/P1_REPORT.md). No es todavía un instalador; P2–P5 siguen pendientes. La especificación original de P0 permanece como antecedente.

- [Documento maestro](docs/MASTER_PLAN.md): visión, alcance y decisiones.
- [Mapa documental](docs/index.md) y [contexto para continuar](docs/AI_HANDOFF.md).
- [Roadmap P0–P5](docs/ROADMAP.md) y [aceptación de P0](docs/P0_ACCEPTANCE.md).
- [Arquitectura](docs/architecture/ARCHITECTURE.md), [propiedad de componentes](docs/architecture/OWNERSHIP_MATRIX.md) y [migración](docs/architecture/MIGRATION_PLAN.md).
- [Axiom Game Engine](https://github.com/Krozzeo/AxiomGameEngine): producto existente y primer consumidor.

## Principios

Operación manual completa y herramientas semánticas para agentes; funcionamiento local; productos especializados; contratos explícitos y versiones compatibles; extracción gradual desde necesidades comprobadas; recuperación antes de migraciones incompatibles. Los juegos exportados funcionan sin Platform.

## Repositorios y licencia

Este repositorio contiene la planificación de Platform y alojará sus servicios, Hub y SDK. El motor conserva escenas, scripting compatible con Unity, físicas, shaders, renderizado y exportación. Sus milestones M19–M40 continúan separadas de P0–P5.

[MIT](LICENSE), por decisión del propietario. La monetización y el modelo comercial permanecen pendientes. La licencia de este repositorio no sustituye licencias de dependencias o material de terceros.

## Trabajar con esta entrega

Leer el documento maestro, el handoff y la guía P1 antes de proponer código. Ejecutar npm run check; para aceptación conjunta establecer AXIOM_ENGINE_PATH. Para comprobar enlaces y entregables documentales: `python scripts/check_docs.py`. No se requieren herramientas del motor para leer o verificar P0. [Contribución](CONTRIBUTING.md).
