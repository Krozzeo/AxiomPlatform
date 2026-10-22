# P2 — Catálogo persistente y servicios compartidos

2026-10-21. Ramas feat/p2-shared-services y feat/p2-platform-services. Base Platform 0a0471b y motor 400fec0, tras integrar P1 con CI y aceptación manual del usuario. CI conjunto fija el consumidor Game Engine d6aad384d2a0f06ac841e7e56b2eab79bfdd766a; su dependencia de servicios está fijada al commit público 78d219b04d16b13074d76414483bc121cef32be9 de Platform.

## Aceptación anterior

El usuario ejecutó npm run check de P1: 6/6, sin omitidas; navegador passed:true sin pageErrors y confirmó pruebas manuales sin problemas. Antes de integrar: Platform CI de contratos Windows/Linux + producto/browser y Game Engine CI 332 aprobados. Se integraron PR Platform #1 y motor #53 (incluye P0); referencias de recuperación anteriores intactas.

## Entrega P2

Catálogo persistente y ajustes/registro; selección de carpetas, apertura por carpeta/archivo e importación local conservando el original; listado/importación GitHub validados por producto; transporte común y cuenta por sesión con broker IPC, sin credenciales persistidas. Configuración/historial/publicación siguen por proyecto. El motor reexporta código común desde paquete de fuente HTTPS fijado e integridad, sin requerir autenticación SSH ni un enlace de desarrollo.

## Comprobaciones locales

- 13 tests Platform: contratos de P1, almacenamiento/corrupción/locks, copia acotada y enlaces, selector/cancelación, épocas de cuenta/revocación y tres recorridos con procesos reales del motor.
- Las integraciones prueban reinicio/recientes/raíz, importación sin modificar origen, dos editores conectados y destinos/preferencias aislados, cierre sin desconectar los demás, desconexión común, invalidación de revisión, reinicio sin token y recuperación de commit incierto sin duplicar/divergencia sin escribir.
- Navegador P1 conserva create/edit/Cancel/Save/close/reopen. Navegador P2 pasa importación local, cuenta/repositorios/importación remota, cancelación de selector, autosave de raíz, reinicio del backend y reapertura desde catálogo, sin pageErrors.
- Motor: npm run check 444/444 aprobadas, sin fallos ni omitidas, incluida la regresión de adopción de ajustes/historial nativos. CI de P2 se comprueba por separado.
- La prueba UI encontró un cambio de almacenamiento perdido al coincidir con un refresco. Se serializan acciones explícitas y se captura el valor al cambiar, preservando la comprobación del reinicio.

## Límites

GitHub se valida con transporte controlado, sin PAT real ni publicaciones en la cuenta del usuario; selector nativo con resultados controlados. La implementación Windows usa el selector real heredado, pero su operación manual de P2 queda para el usuario. Null no acredita GPU. AI/modelos, #47/#51, rendimiento denso, shaders y físicas GPU no quedan resueltos por esta entrega.

El perfil y los proyectos tienen locks separados. No recuperar automáticamente un lock tras cierre forzado sin verificar procesos/copiar datos. Identidad duplicada en otra carpeta no crea destinos compartidos: se rechaza o reutiliza la entrada existente. Cambiar almacenamiento no mueve documentos. Las configuraciones inválidas no se resetean para aparentar éxito.

La credencial puede transitar por una petición del editor al conectar, pero solo el host la retiene. Un efecto remoto ya en vuelo no se deshace al desconectar; el journal del producto conserva la recuperación. La instalación conserva requisitos de desarrollador hasta P4.

P2 se entrega mediante PR. Su cierre remoto requiere comprobar los checks nuevos y la integración, sin extrapolar los resultados de P1. P3 es la siguiente etapa de Platform; M19–M40 del motor permanecen intactas.
