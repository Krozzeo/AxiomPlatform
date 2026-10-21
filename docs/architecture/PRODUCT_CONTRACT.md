# Contrato preliminar de producto — SDK de Platform

Estado: especificación de P0, versión de diseño 0. No hay esquema ejecutable o SDK publicado. P1 implementará y validará una primera versión; los nombres del ejemplo pueden ajustarse mediante ADR sin migrar proyectos actuales en P0.

## Descriptor y proyecto

```json
{
  "manifestVersion": 1,
  "productId": "axiom.game-engine",
  "displayName": "Axiom Game Engine",
  "productVersion": "0.0.52",
  "platformApiRange": ">=0.1.0 <0.2.0",
  "projectFormats": [{"id": "axiom.game-project", "versions": [1]}],
  "capabilities": ["project.open", "project.create", "project.close"],
  "launch": {"adapter": "official-local"}
}
```

Los números de Platform y formato son ilustrativos, no asignaciones al formato existente. No ejecutar un comando arbitrario obtenido de un proyecto. El host resuelve el adaptador desde instalaciones oficiales registradas. El proyecto aporta productId, projectId, formatVersion y referencias a documentos del producto; una ruta es local y no identidad portátil.

## Apertura y ciclo de vida

1. Detectar el proyecto sin modificarlo y solicitar al adaptador un diagnóstico de compatibilidad.
2. Negociar versión de protocolo, capacidades, raíces y modo de apertura.
3. Reservar sesión e identificar quién posee el documento; detectar otra apertura de escritura.
4. Iniciar producto y esperar ready explícito, con error y cancelación visibles. Un timeout no significa éxito.
5. Abrir documento por identificador/ruta autorizada; producto valida y responde estado/revisión.
6. Guardar mediante el producto. Cerrar con decisión sobre cambios pendientes y tareas activas.
7. Al fallar, liberar recursos y conservar un diagnóstico; no escribir ni reparar silenciosamente.

El adaptador debe cubrir detect, compatibility, launch, ready, open/create, dirty/status, save, close y diagnostics. Capacidades AI, publicación y preview son opt-in posteriores, no métodos vacíos que simulen soporte.

## Mensajes y concurrencia

Sobre común: protocolVersion, messageId, sessionId, productId, projectId cuando aplique, correlationId, actor y payload. Mutaciones incluyen expectedRevision y operationId. La recepción de duplicados no repite efectos: devolver recibo conocido o estado desconocido explícito. Producto y host deben descartar respuestas de sesiones cerradas o generaciones anteriores.

Errores mínimos: incompatibleVersion, unsupportedCapability, permissionDenied, projectBusy, revisionConflict, cancelled y operationFailed; con mensaje humano, evidencia depurada y sugerencia. No exponer stack o secretos como única explicación.

## Responsabilidades

Host: registro, permisos, ciclo de vida y negociación. SDK: tipos/esquemas/cliente, sin clases del motor. Adaptador: traducir contratos a operaciones de producto. Producto: invariantes, documento, validación, herramientas y resultado. Un fallo de dominio nunca se convierte en éxito porque el transporte respondió HTTP 200.

## Conformidad inicial

P1 prueba apertura, cierre cancelado, guardado/reapertura, versión incompatible sin escritura, proceso fallido y arranque directo del motor. P2 añade importación y cuentas; P3 herramientas/propuestas. El SDK de Platform es diferente del SDK 8 de scripting del motor.
