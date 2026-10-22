# Proyectos, configuración y sesiones

## Modelo

Producto = aplicación especializada. Proyecto = documentos persistentes de un producto. Workspace = agrupación opcional de proyectos, futura. Sesión = estado temporal de conexiones, procesos y tareas. P1 administra proyectos individuales; no implementa todavía un formato de workspace multidominio.

| Nivel | Datos | Regla de escritura |
| --- | --- | --- |
| Platform | Idioma, apariencia, productos instalados, raíces predeterminadas y proveedores configurados | Preferencias locales del usuario; sin secretos en texto plano |
| Producto | Atajos y preferencias específicas del editor | Namespace productId |
| Proyecto | Documentos, repositorio/rama, publicación, configuración AI, build y plantilla | Validación del producto y revisión para mutaciones |
| Sesión | Credencial activa, permisos, procesos y tareas | Memoria por defecto; revocar al desconectar/cerrar |

Los defaults de Platform se aplican al crear configuración nueva; no sustituyen preferencias explícitas del proyecto. La migración identifica precedencia y conserva valores actuales. No cambiar los defaults de publicación ya acordados en Game Engine por extraer servicios.

## Credenciales y aislamiento

Cuenta disponible en la sesión no equivale a permiso para publicar cualquier proyecto. La operación combina identidad, permisos del proveedor, destino del proyecto y autorización de la acción. Sin proyecto abierto solo se evalúa conexión de cuenta; con proyecto, se distingue cuenta conectada y destino válido.

No escribir tokens en Git, documentos, logs, diagnósticos o URLs. Persistencia entre sesiones únicamente opt-in y mediante almacén seguro del SO; si no existe, mantener memoria y explicar el límite. P0 no implementa ese almacén ni reemplaza el comportamiento actual del motor. Desconectar cancela nuevas operaciones, elimina credenciales y marca las publicaciones inciertas para reconciliación; no promete deshacer un commit remoto.

## Archivos y migración

Identidad estable y referencias relativas portátiles. Catálogo local guarda rutas, no credenciales ni todos los contenidos. Resolver rutas dentro de raíces autorizadas y detectar enlaces que escapan. Antes de migración incompatible: mostrar versión, copia recuperable y efectos; requerir decisión explícita. Nunca abrir con escritura usando una versión que desconoce el formato.

## Interoperabilidad futura

Cada intercambio declara unidades, ejes, handedness, precisión, tolerancia, formato/versión y procedencia. Elegir copia importada o vínculo actualizable. Detectar referencias rotas y ciclos. Un intercambio que pierde restricciones o historial paramétrico lo indica antes de aceptarlo. Mantener formatos nativos; no convertir todo en escenas del motor.
