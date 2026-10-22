# ADR-P0001 — Fundación de Axiom Platform

Fecha: 2026-10-21. Estado: aceptado por el propietario para planificación; implementación pendiente.

## Contexto

El motor existente combina servicios reutilizables y dominio de juegos. El propietario quiere una familia de aplicaciones locales en navegador, manuales y operables por AI, y aprobó una separación gradual en dos repositorios.

## Decisión

Nombre Axiom. Platform posee Hub/servicios/SDK; Game Engine posee su dominio y adaptador. Dependencia hacia contratos, productos con versiones independientes, arranque directo técnico y runtime exportado autónomo. Configuración por niveles, credenciales de sesión por defecto, publicación y cambios con alcance explícito, formatos especializados e intercambio declarado. Extracción P0–P5; el motor conserva M19–M40.

El propietario reemplazó la propuesta inicial de repositorio sin licencia por **MIT para ambos repositorios** y pidió renombrar AxiomEngine a AxiomGameEngine. Esta instrucción posterior es la vigente. Las licencias anteriores y de terceros no se eliminan del historial. El modelo comercial sigue abierto.

## Alternativas

Monorepo de todos los productos; fork/copias del motor por aplicación; núcleo universal previo a productos; extracción total inmediata; varios repositorios por biblioteca. Se prefiere dos repositorios y contratos por menor coste inicial, revisión gradual y autonomía de producto.

## Consecuencias

Habrá mantenimiento de compatibilidad y pruebas conjuntas. No se podrá depender de clases internas del motor desde Platform. La primera implementación prioriza un recorrido real y reversible. No se reescribe el daemon ni se reemplazan formatos en P0.

## Pendientes deliberados y responsable de resolverlos

| Pendiente | Cuándo / cómo |
| --- | --- |
| Monetización, soporte y servicios comerciales | Propietario, fuera del gate técnico de P0 |
| API exacta, esquema ejecutable, proceso/puerto y paquete inicial | P1, ADR técnico y pruebas del primer recorrido |
| Persistencia segura entre sesiones | P2, opt-in y capacidad del SO verificada |
| Formato de instalador, integridad y actualización | P4, ADR y prueba de distribución |
| Segundo consumidor concreto | Antes de P5, alcance pequeño aprobado |
| APIs de terceros/marketplace y nube propia | Nuevo alcance futuro, no requisito de P1–P4 |

Estos pendientes tienen lugar de resolución; no invalidan el contrato conceptual ni simulan decisiones técnicas ya verificadas.
