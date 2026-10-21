# P2 — Catálogo, almacenamiento y GitHub compartido

Estado: entrega candidata de P2 en ramas. Platform 0.1.1 / protocolo 1; requiere el adaptador P2 del motor y su dependencia fijada. No hay instalador todavía. P1 fue aceptada manualmente por el usuario y aprobó CI antes de integrarse en ambos main. P2 se revisa por separado.

## Actualizar y ejecutar en este equipo

Cerrar los proyectos y detener el host anterior con Ctrl+C: un proceso P1 ya iniciado no adquiere las rutas de P2 por cambiar archivos. En PowerShell:

```powershell
$axiomRoot = 'C:\Users\Jack\.codex\.chatgpt-projects\g-p-6ab128380a60819199104e7f2a2ba9cf\work'
$enginePath = Join-Path $axiomRoot 'AxiomEngine'
$platformPath = Join-Path $axiomRoot 'AxiomPlatform'
Set-Location $enginePath
npm ci
npm run build
$projectsPath = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Axiom P1 Tests'
Set-Location $platformPath
npm start -- --product "$enginePath\platform\product.json" --projects-root "$projectsPath"
```

Usar la URL completa que muestra el host; el token temporal se retira de la barra y no se incluye en informes. La carpeta local del motor aún se llama AxiomEngine; el repositorio es AxiomGameEngine. Las copias locales deben estar en las ramas P2 descritas en los PR, no en una recuperación anterior.

## Catálogo y ajustes

Los proyectos creados, abiertos o importados aparecen en **Mis proyectos** y se conservan tras reiniciar. Los proyectos P1 anteriores se incorporan al abrirlos por primera vez; no se mueven ni migran sus documentos. Abrir acepta carpeta con un solo proyecto o archivo UUID.json dentro del almacenamiento autorizado. Explorar abre el selector nativo del sistema.

Configuración permite cambiar almacenamiento. La modificación se guarda al salir del campo o seleccionar una carpeta. Cerrar las sesiones primero: cambiar almacenamiento no mueve ni elimina proyectos. Volver a su carpeta anterior vuelve a mostrar sus entradas del catálogo. Elegir producto predeterminado se conserva independientemente de cada proyecto.

Los ajustes/registro de productos se guardan normalmente en `%APPDATA%\AxiomPlatform` en Windows. Después de la primera configuración, ejecutar **npm start** sin --product/--projects-root reutiliza lo guardado. Pasar esos argumentos explícitos sustituye los valores guardados para ese arranque y los actualiza. `--settings-root "C:\ruta\Axiom pruebas"` permite un perfil separado. No borrar ajustes para solucionar un error sin copiar antes su contenido.

## Importar una copia local

Agregar proyecto → Explorar → seleccionar la carpeta de origen → Importar copia local. Platform copia solo los archivos identificados por el producto y rechaza enlaces/archivos especiales o presupuestos excedidos (2048 archivos / 16 MiB). El origen permanece intacto. Abrir la nueva entrada en Mis proyectos. Si esa identidad ya está registrada, se utiliza la entrada existente sin duplicar el proyecto. Identidades duplicadas en ubicaciones distintas requieren resolver cuál es la copia canónica; no se mezclan configuraciones.

## Cuenta de GitHub

Cuenta de GitHub → introducir token en la app → Conectar GitHub. No enviar tokens por chat. Al conectar, el formulario se limpia y los repositorios se cargan automáticamente. La cuenta se comparte con todos los editores alojados; cerrar un proyecto no la desconecta. Desconectar desde Platform o un editor revoca la conexión para los demás y descarta las revisiones de publicación anteriores. Reabrir Platform requiere conectar de nuevo.

La credencial se retiene solo en memoria del host de Platform. Si se conecta desde el editor, transita por su petición y el IPC, sin conservarse en su cliente, configuración o disco. Los editores reciben identidad/época de conexión y solicitan el transporte al host, sin una copia retenida del token. La conexión no autoriza una publicación por sí sola.

Cada proyecto conserva su repositorio, rama, preferencias, revisión/recibos e historial por separado. La configuración válida anterior del motor se adopta solo para el ID del proyecto abierto y solo si aún no hay configuración de Platform; el original se conserva. Los defaults existentes no se sustituyen por conectar una cuenta.

Para publicar, abrir el panel GitHub de Game Engine y elegir el destino de ese proyecto. La preparación del bundle, revisión, permisos de agente, divergencia y reconciliación siguen siendo del motor. P2 no publica automáticamente al conectar la cuenta. Las preferencias de publicación previamente habilitadas mantienen su comportamiento acordado.

## Importar desde GitHub

Conectar la cuenta → Agregar proyecto → Importar desde GitHub → elegir repositorio/rama → Buscar proyectos → elegir proyecto → Importar desde GitHub. La búsqueda/validación pertenece al adaptador. Se importan datos localmente; el repositorio de origen no se modifica. Esto requiere un repositorio con una publicación compatible, no cualquier repositorio de código.

## Comprobación manual

1. Crear un proyecto, guardarlo/cerrarlo y reiniciar Platform sin repetir los argumentos iniciales. Verificar la entrada del catálogo.
2. Abrir por carpeta usando Explorar. Cancelar otro selector y comprobar que no cambia el campo ni el almacenamiento.
3. Importar un proyecto de otra carpeta; comparar el original y abrir la copia.
4. Conectar GitHub y abrir dos proyectos. Confirmar cuenta conectada en ambos y seleccionar repositorios diferentes. Cambiar preferencias en uno y comprobar el otro.
5. Cerrar un proyecto: el otro debe seguir conectado. Desconectar: ambos deben mostrar desconexión. Reiniciar: cuenta desconectada, destinos y preferencias conservados al reconectar.
6. Cambiar almacenamiento con sesiones cerradas, reiniciar y comprobar que se conservó; volver a la raíz anterior sin mover documentos.

## Pruebas automatizadas y límites

```powershell
$env:AXIOM_ENGINE_PATH = $enginePath
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $enginePath '.axiom\browsers'
npm run check
npm run test:browser
npm run test:browser:p2
```

Las pruebas conjuntas usan procesos reales del motor, transporte GitHub controlado y resultados controlados del diálogo nativo. El recorrido P1 del editor usa Null. No acreditan un PAT real, operar manualmente el diálogo del SO, GPU o calidad de modelo AI. Los perfiles de tests se crean en carpetas temporales separadas.

El archivo platform.lock evita dos hosts escribiendo el mismo perfil. Un cierre abrupto puede dejarlo: verificar que el proceso anterior terminó, copiar el perfil y retirar solo ese bloqueo. El bloqueo de carpeta del proyecto de P1 sigue independiente. P3 extraerá AI; distribución/almacén seguro opcional de credenciales continúan pendientes.
