# ADR-P0003 — Servicios comunes y persistencia P2

2026-10-21. Implementado en ramas para revisión; CI y aceptación nativa real separados.

## Decisión

Platform posee catálogo reciente, ubicación/configuración local, selección nativa de carpetas, escritura JSON atómica, copia acotada y transporte/cuenta GitHub. Se extraen client.mjs y folder-picker/documentos del motor con procedencia registrada; el motor los reexporta desde una dependencia HTTPS fijada al commit de Platform e integridad en package-lock. No hay copias permanentes, enlaces entre checkouts ni dependencia de una rama mutable. El paquete es fuente privada para npm-registry, instalable desde su archivo público; no se publicó en npm.

El host mantiene un perfil con plataforma/registro/preferencias y entradas de proyecto, protegido por lock. No silencia corrupción ni borra datos al cambiar raíz. La CLI conserva los argumentos iniciales como overrides explícitos; después reutiliza configuración. La biblioteca startHost recibe stateRoot explícito o usa un perfil aislado bajo la raíz de prueba; la CLI usa el perfil de usuario.

Cuenta GitHub por host, credencial solo retenida en su memoria. Los productos solicitan servicios mediante mensajes IPC ligados a su sesión. La credencial introducida desde un editor solo transita hacia el host. La cuenta emite identidad/época a los productos; cambiarla invalida revisiones y solicitudes antiguas. Cerrar un editor libera su cliente sin desconectar los demás. Desconectar/revocar afecta a todos; operaciones externas ya iniciadas requieren recibo/reconciliación, no se prometen deshacer.

Los destinos, defaults explícitos, historial y journal de publicación pertenecen al producto/proyecto. Se almacenan fuera de los documentos del usuario bajo un directorio derivado de su carpeta, y se adopta configuración nativa anterior solo para la identidad correspondiente. La publicación y su validación no se trasladan al host. Los endpoints de la UI de Platform no permiten invocar peticiones GitHub arbitrarias; solo conexión/listado. Las importaciones del broker son de lectura.

El producto reconoce archivos, formato y selección de recursos de importación. Platform ofrece raíz/grant explícito de lectura y copia acotada; el origen no se modifica. GitHub import/list son capacidades opcionales nuevas, compatibles con protocolo 1 / API 0.1. La UI solo ofrece importación con adaptador P2. No se introduce un formato universal nuevo.

## Alternativas y consecuencias

Se descartó copiar un token a cada daemon o mantener clientes de transporte duplicados. Se conserva el Hub nativo para arranque independiente con el mismo transporte compartido; el catálogo de sesiones alojadas lo administra Platform. Las instalaciones oficiales se consideran código confiable: proceso separado no equivale a sandbox de SO para plugins externos. P3 y el dominio Unity/GPU permanecen fuera de esta extracción.

## Evidencia

Aceptación manual y automática P1 del usuario registrada en [informe P2](../reports/P2_REPORT.md). Tests P2 prueban persistencia, rutas, origen intacto, cuenta compartida, preferencias, desconexión, divergencia y commit incierto sin duplicado. Selector/servicio remoto se controlan en pruebas; aceptación manual nativa/PAT real sigue diferenciada. [Guía](../P2_GUIDE.md).
