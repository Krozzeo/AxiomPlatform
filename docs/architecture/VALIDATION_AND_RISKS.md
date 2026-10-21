# Validación y riesgos

## Gates por cambio

| Tipo | Comprobaciones |
| --- | --- |
| P0 documental | Enlaces relativos, entregables, consistencia de decisiones, licencia/nombre, preservación del roadmap y revisión del diff |
| Contrato | Validación de mensajes, versión incompatible, capacidad ausente, cancelación, timeout, cierre y respuesta atrasada |
| Persistencia | Crear/abrir/guardar/reabrir, defaults existentes, conflicto, fallo de escritura y recuperación |
| Cuenta/GitHub | Sesión compartida con destinos aislados, desconexión, permiso insuficiente, divergencia y resultado incierto |
| AI | Herramientas semánticas, scope, propuesta, validación, revisión, conflicto y evidencia depurada |
| Distribución | Instalación, integridad, versión compatible, actualización diferida, rollback y proyecto intacto |
| Producto | Arranque desde Hub y directo; build/exportado sin Platform; pruebas de dominio del motor |

El proveedor prueba contratos; el motor prueba su adaptador; una integración con versiones exactas acredita el recorrido conjunto. No hace falta repetir toda prueba pesada para corregir un enlace, pero los checks obligatorios del repositorio se respetan. No reducir asserts o gates para hacer pasar la migración.

## Riesgos y respuesta

| Riesgo | Mitigación | Señal de bloqueo |
| --- | --- | --- |
| Sobreingeniería | Extraer necesidades comprobadas y revisar con segundo consumidor pequeño | Un módulo solo existe para un producto hipotético |
| Platform acoplada al motor | Tipos de dominio fuera del SDK, prueba de dependencias | Import de escenas/Unity desde Platform |
| Publicaciones coordinadas frágiles | Versiones fijadas, cambios compatibles y proveedor primero | Dos merges simultáneos obligatorios |
| Pérdida de datos | Revisiones, transacciones, copias y ensayo de recuperación | No se puede reabrir estado previo |
| Credencial o contexto cruzado | Separar cuenta, proyecto y permisos; redacción | Un proyecto hereda destino o permiso ajeno |
| Fallo común afecta a todos | Sesiones y recursos aislados; procesos/workers cuando convenga | Cierre de producto corrompe otros proyectos |
| Detener el motor indefinidamente | Roadmaps independientes y tandas acotadas | M19 queda bloqueada sin dependencia técnica |
| Confundir evidencia | Informar mocks/modelo real, Null/GPU e histórico/nuevo | Se declara aceptación sin prueba correspondiente |

## Límites iniciales heredados

No resolver por renombrado: rendimiento físico denso, validación manual nativa GitHub aplazada, calidad/coste con modelo conectado y fallo intermitente de Inspector #47. El estado del motor es su fuente canónica. P0 no ejecuta CAD/Math, GPU physics ni una nueva aplicación Platform.
