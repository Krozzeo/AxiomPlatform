# P1 — Arranque y prueba de Axiom Platform

Estado: primer host funcional en rama, con aceptación local. No es todavía un instalador. Requiere Node.js 24+ y un checkout compatible de Game Engine con su adaptador P1, dependencias npm y build del motor. No basta el tag de recuperación anterior a P1. MIT en ambos repositorios; SDK de scripting del motor sigue en 8.

## Preparación

Mantener carpetas separadas para AxiomPlatform, AxiomGameEngine y proyectos. En el checkout del motor ejecutar `npm ci` y `npm run build` con los requisitos de su README. Platform utiliza solo módulos incluidos en Node, sin instalación de dependencias propia en esta entrega.

Desde la carpeta de Platform:

```powershell
npm start -- --product "C:\ruta\AxiomGameEngine\platform\product.json" --projects-root "C:\ruta\Mis proyectos Axiom"
```

Abrir la URL local que muestra el proceso. El fragmento de autenticación es temporal, se retira de la barra tras abrir y no se guarda en documentos. No compartir esa URL ni copiarla a informes. Cerrar proyectos antes de detener el proceso. El puerto predeterminado es 4320; `--port 0` elige uno libre.

El registro de instalación se autoriza mediante `--product`, nunca por un archivo de proyecto. `--projects-root` concede acceso a esa raíz; los archivos abiertos deben estar dentro. P1 registra instalaciones por cada arranque, sin catálogo persistente ni descarga automática de productos.

## Recorrido

1. Crear un proyecto vacío con nombre y producto. Platform crea una carpeta nueva bajo la raíz autorizada.
2. Elegir Abrir editor. Se abre una pestaña independiente, con el proyecto ya activo.
3. Editar en Game Engine. Platform consulta estado y muestra cambios pendientes.
4. Guardar desde el editor o Platform. Platform exige la revisión observada: si cambia, informa conflicto y permite actualizar antes de reintentar.
5. Cerrar muestra Guardar y cerrar, Descartar y cerrar y Cancelar. Cancelar mantiene la sesión sin guardar ni descartar. Si hay código sin guardar en buffers, guardarlo desde el editor; Platform no simula guardar esos buffers.
6. Reabrir pegando la ruta al archivo UUID.json mostrado en la tarjeta, relativa o absoluta dentro de la raíz. La identidad y documentos del motor se conservan.

Los controles de ciclo de vida del Hub nativo del motor no pueden cambiar la sesión alojada: administrarla desde Platform. La edición, guardado y herramientas de dominio siguen en Game Engine. El arranque directo habitual del motor sigue disponible para proyectos que no estén arrendados por Platform.

## Errores y recuperación

Formato/protocolo no compatible: diagnóstico antes de escribir, sin migración automática. Proceso fallido o timeout: sesión fallida, sin confirmar operaciones no recibidas; inspeccionar el archivo guardado antes de reabrir. No reintentar una mutación con resultado incierto a ciegas.

Cada sesión del motor mantiene `.axiom-platform-session.lock` en la carpeta del proyecto. Bloquea otras sesiones Platform y aperturas por la nueva versión del motor. Se libera al cerrar normalmente. Un cierre forzado del proceso puede dejar el archivo. Para recuperarlo, verificar manualmente que no queda ningún proceso/editor usando esa carpeta, copiar el proyecto completo y retirar únicamente ese archivo de arrendamiento. No retirar el bloqueo de una sesión viva. Versiones antiguas del motor no conocen este bloqueo; no usarlas simultáneamente sobre la misma carpeta.

El arrendamiento es por carpeta, no por archivo: proyectos heredados que compartan carpeta se abren de uno en uno. Los buffers reportados como pendientes se conservan como advertencia hasta que el editor informe guardado; si se perdió esa pestaña, cerrar con descarte explícito después de evaluar los cambios. No caducan silenciosamente.

## Verificación

```powershell
$env:AXIOM_ENGINE_PATH = "C:\ruta\AxiomGameEngine"
npm run check
python scripts/check_docs.py
node tests/browser-p1.mjs
```

La prueba de navegador utiliza Playwright instalado por el motor; instalar su Chromium si es necesario. En CI se construye el motor fijado y se ejecutan ambas pruebas de integración más el recorrido de UI. Sin AXIOM_ENGINE_PATH las pruebas de integración se marcan omitidas; no equivalen a aceptación conjunta. La UI se prueba en Null, no acredita renderizado ni físicas GPU.

## Fuera de P1

Selector nativo de carpetas, proyectos recientes persistentes y cuentas compartidas: P2. Orquestación AI extraída: P3. Instaladores/actualizaciones/rollback de distribución: P4. No cambia M19–M40 del motor ni la cobertura Unity.
