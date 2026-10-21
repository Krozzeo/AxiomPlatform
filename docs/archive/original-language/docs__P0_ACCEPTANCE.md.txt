# Aceptación de P0 — Fundación documental

Fecha: 2026-10-21. Alcance: documentación y planificación. P0 no certifica un producto ejecutable. Este checklist declara entregables documentales; el PR del motor se revisa e integra por separado.

- [x] Nombre Axiom, dos repositorios y separación de responsabilidades documentados.
- [x] Maestro, arquitectura y matriz trazados a componentes actuales del motor.
- [x] Contrato preliminar de producto y alcance del SDK identificados como diseño.
- [x] Proyecto/workspace/sesión, configuración y credenciales definidos.
- [x] AI, herramientas, validación, revisión y efectos externos definidos.
- [x] Versiones, instalación, offline y licencias definidos al nivel de P0.
- [x] Migración por tandas, gates y recuperación documentados.
- [x] Roadmap P0–P5 con dependencias y aceptación; M19–M40 conservadas.
- [x] Registro de decisiones adoptadas y pendientes con etapa de resolución.
- [x] Actualización del motor preparada en rama propia con referencias a Platform y MIT.
- [x] Verificación documental reproducible mediante scripts/check_docs.py.

## Verificación reproducible

Ejecutar `python scripts/check_docs.py`: verifica entregables y enlaces locales, y exige MIT. Revisar el diff del motor: documentación/identidad/licencia y protección de destino de publicación tras el renombrado, sin extracción ni migración de datos. Sus pruebas pertenecen al PR del motor; resultados en su informe de P0.

## Gate de salida

P0 queda entregada como especificación revisable al publicarse estos documentos y la rama del motor. P1 comienza después, verificando el estado de integración del PR y fijando las versiones. Un check documental no acredita aperturas de proyectos, rendimiento, GPU ni un agente conectado. Los pendientes deliberados del ADR se resuelven en sus etapas sin bloquear artificialmente P0.
