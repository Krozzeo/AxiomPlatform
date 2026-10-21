# Extracción gradual y recuperación

## Base

Motor inspeccionado: `871a72f6d2c720e99e0a8d1598c0f35af69c4d78`, referencia `recovery/pre-restructure-stable-2026-10-20`. Mantener también las otras referencias de recuperación. Repositorio renombrado AxiomGameEngine; no reescribir commits, tags o informes históricos. P0 modifica documentación, identidad/licencia y referencias imprescindibles; no cambia formatos ni traslada funcionalidad.

## Método por tanda

1. Crear rama desde main actualizado; registrar SHAs exactos de ambos repositorios.
2. Seleccionar una fila de la matriz, listar imports/estado/efectos y definir puerto público y adaptador.
3. Añadir prueba de contrato y recorrido del consumidor antes de retirar el camino anterior.
4. Publicar paquete/artefacto de Platform y fijar versión en la rama del motor; registrar compatibilidad.
5. Ejecutar pruebas relevantes de ambos repositorios y el recorrido manual/AI según la tanda.
6. Revisar diferencias, migración y límites; integrar mediante PR con checks requeridos.
7. Retirar implementación duplicada únicamente cuando el consumidor use la nueva y esté verificada.

No hay transacción Git atómica entre repositorios: primero publicar un cambio compatible del proveedor, después integrar al consumidor. Retiradas incompatibles en otra entrega; mantener soporte de transición mientras exista el consumidor anterior. No coordinar dos merges que solo funcionan simultáneamente.

## Orden de extracción

P1: host mínimo, descriptor y apertura del motor mediante adaptador, sin migrar documentos. P2: catálogo, ajustes y servicios locales/GitHub por contratos; el motor conserva bundle y validación. P3: ejecución AI y revisión común, manteniendo semántica en el producto. P4: UI y distribución tras comprobar reutilización. P5: segundo consumidor acotado que valide ausencia de dependencias del motor.

## Recuperación

Antes de cada tanda guardar copia del proyecto de prueba, versiones/SHAs y resultados de apertura/guardado. Si falla un gate: no integrar o desactivar el camino nuevo, volver a la versión fijada anterior y abrir la copia intacta. Si hubo migración de datos incompatible, recuperar copia o ejecutar una migración inversa probada; no abrir documentos nuevos con binarios viejos a ciegas. Publicaciones remotas requieren reconciliación independiente.

Ramas desde recovery sirven para investigar/regresar; no mover etiquetas protegidas ni forzar main. El cambio de nombre del repositorio conserva historia; actualizar remotos y enlaces activos. Las referencias históricas permanecen como evidencia.

## Coordinación con el motor

P0–P5 son etapas de Platform; M19–M40 siguen siendo producto. P0/P1 están integradas; P2 se entrega en ramas para revisión y P3 también se entrega en ramas para revisión; P4 es la siguiente tanda prevista. No implica autorización para implementar todo el roadmap. M19 puede avanzar sin esperar P5 si respeta las interfaces y evita reintroducir acoplamiento. Ninguna tanda de Platform acredita cobertura Unity, compute o físicas GPU. Cada PR indica si afecta contratos o aceptación del otro repositorio.
