# Integración AI y operaciones de dominio

Estado: contrato objetivo de P0. Las implementaciones actuales siguen en Game Engine hasta su extracción validada en P3.

## Propiedad

Platform gestiona proveedores, conexión, sesiones, consumo, tareas, registro de herramientas y permisos. El producto define contexto, operaciones semánticas, precondiciones, resultados, invariantes, pruebas y criterios de aceptación. PMD comparte infraestructura documental; sus plantillas y gates pertenecen al producto.

## Registro de herramientas

Cada herramienta declara nombre con namespace de producto, versión, descripción, esquemas input/output, capacidades necesarias, alcance (sesión/proyecto), clase de efecto (lectura, modificación local, efecto externo), precondiciones y estrategia de validación/recuperación. Herramientas no registradas no se invocan. Compartir cuenta no concede acceso a otros proyectos. Las tareas entre productos quedan postergadas.

## Operación manual y por agente

La UI y el agente invocan las mismas operaciones de dominio cuando corresponda. El producto valida reglas y revisión esperada; se evita un segundo camino que cambie archivos sin invariantes. La UI puede tener interacción efímera propia. Las herramientas necesitan resultado estructurado y diagnóstico comprensible, no simulación de clicks como interfaz semántica principal.

## Propuestas

Capturar revisión base → crear workspace aislado → ejecutar operaciones → validar → mostrar diff y evidencia → aceptar/rechazar → verificar revisión actual → aplicar transacción → emitir recibo e historial. Si cambió la base, informar conflicto y regenerar/revisar; no sobreescribir. Cerrar/cancelar sesión invalida respuestas tardías. Un fallo parcial exige rollback local probado o recuperación explícita, nunca un éxito ficticio.

## Publicación y efectos externos

Lectura, edición local y publicación son capacidades separadas. Conservar revisión/aceptación y preferencias explícitas vigentes del proyecto; no habilitar publicación automática por conectar Platform. Una operación externa usa operationId y recibos, con reconciliación si se desconoce el resultado. Revertir archivos no borra un commit remoto. No reintentar a ciegas si el primer envío pudo completarse.

## Evidencias y privacidad

Registrar actor, herramienta/versión, proyecto, revisiones, resultado, validaciones, consumo disponible y referencias a evidencias; secretos redactados. Informar claramente pruebas con proveedores simulados frente a modelo real, y pruebas Null frente a GPU. No atribuir al agente aceptación humana que no ocurrió.

Aceptación P3: tarea acotada manual y AI sobre el mismo proyecto, revisión y aplicación verificadas, cancelación, conflicto, error del proveedor, aislamiento entre proyectos y control de respuestas atrasadas. Calidad/coste de modelos reales queda como aceptación explícita separada de fixtures controlados.
