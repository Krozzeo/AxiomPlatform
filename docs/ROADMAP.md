# Roadmap Axiom Platform — P0 a P5

Seis milestones propias. P0 documental entregada; P1 implementada y verificada localmente en ramas, con CI/revisión independientes; P2–P5 pendientes. [Informe P1](reports/P1_REPORT.md). Sin fechas prometidas. Se cierran por evidencia, no por archivos creados. Game Engine conserva M19–M40, incluyendo Unity, shaders y físicas GPU.

| Milestone | Entrega exacta | Dependencia | Gate de cierre |
| --- | --- | --- | --- |
| P0 — Fundación | Maestro, ADR, propiedad, contratos, configuración, AI, versiones, migración, validación y actualización del motor | Decisiones del propietario | Checklist de P0 verificada y documentos publicados; sin extracción funcional |
| P1 — Host y primer producto | Hub/host mínimo, registro y adaptador oficial del motor, negociación/ready/errores, abrir proyecto actual sin migrarlo | P0 | Crear/abrir/guardar/reabrir, cancelación de cierre, incompatibilidad sin escribir, fallo visible, arranque directo conservado |
| P2 — Servicios compartidos | Catálogo y preferencias, selección de carpetas, almacenamiento autorizado, cuenta/transporte GitHub con configuración por proyecto | P1 | Importación conserva origen; rutas seguras; destinos aislados; desconexión/divergencia/recuperación; defaults preservados |
| P3 — AI y cambios | Proveedor/tareas/consumo, registro de herramientas, revisión/diff/recibos comunes con adaptadores de dominio | P2 | Tarea manual y AI, revisión/aplicación, conflicto, cancelación, proveedor fallido y respuesta atrasada; aceptación real del modelo separada |
| P4 — UI y distribución | Componentes reutilizables comprobados, instalación/versiones independientes, actualización diferida y rollback | P3 | Compatibilidad de paquetes, preferencias/teclado, instalar/actualizar/volver y abrir proyecto intacto; exportado sin Platform |
| P5 — Segundo consumidor | Una herramienta pequeña de otro dominio, alcance mediante ADR antes de empezar | P4 | Usa el contrato sin imports de Game Engine, abre/guarda y expone una herramienta AI validable; documenta ajustes del SDK |

## Fuera de estas entregas

Marketplace, extensiones externas, colaboración en tiempo real, nube propia, workspace multidominio completo, automatización cruzada y productos CAD/Math/Animation completos. Un renderer universal o kernel geométrico común requiere decisión posterior y evidencia de uso.

## Desglose operativo de P1

P1.1: fijar manifiesto/esquemas y seleccionar el primer recorrido. P1.2: registro y host mínimo con control de sesión. P1.3: adaptador del motor y apertura alojada. P1.4: errores/cancelación y arranque directo. P1.5: pruebas y recuperación conjunta. No iniciar P2 antes de demostrar P1 ni extraer masivamente el editor.

## Seguimiento

P0 se acredita con [aceptación documental](P0_ACCEPTANCE.md). Los demás gates tienen estado pendiente hasta informe con SHAs, plataformas, comandos/recorridos, resultados y límites. Porcentajes funcionales de Platform todavía no se han medido; seis etapas no equivalen a seis partes de esfuerzo iguales.
