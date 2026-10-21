# P3 — AI y revisión compartidas

Entrega candidata en feat/p3-ai-and-changes y Game Engine feat/p3-platform-ai, apoyadas sobre P2. P2 aún no está integrada: su CI completo del Engine registra el fallo de drag M18.3.11, [#55](https://github.com/Krozzeo/AxiomGameEngine/issues/55). Avanzar P3 fue pedido expresamente por el usuario; no elimina ese gate ni mueve main/recovery. Platform 0.1.2, protocolo 1; scripting SDK 8 permanece independiente.

## Actualizar y ejecutar

Cerrar las sesiones y detener el host anterior con Ctrl+C. Estos checkouts locales ya están en las ramas P3; en otra instalación usar las ramas/commits de sus PR. En PowerShell:

```powershell
$axiomRoot = 'C:\Users\Jack\.codex\.chatgpt-projects\g-p-6ab128380a60819199104e7f2a2ba9cf\work'
$enginePath = Join-Path $axiomRoot 'AxiomEngine'
Set-Location $enginePath
npm ci
npm run build
Set-Location (Join-Path $axiomRoot 'AxiomPlatform')
npm start
```

Si ya ejecutaste P2, npm start reutiliza el registro y almacenamiento guardados. Para el primer arranque:

```powershell
$projectsPath = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Axiom P3 Tests'
npm start -- --product "$enginePath\platform\product.json" --projects-root "$projectsPath"
```

Usar la URL completa que muestra el host. No publicar su token temporal. La [guía P2](P2_GUIDE.md) sigue aplicando a catálogo, importación, ajustes y GitHub.

## Recorrido manual

1. Crear/abrir un juego, crear una entidad, editarla manualmente y guardar MAIN.
2. En el editor, AI → Config AI assistant. Introducir una clave API en la app, cargar la lista y elegir un modelo disponible. Connect and test hace una petición pequeña facturable. No enviar claves por chat. Ninguna prueba automatizada de esta entrega usa una clave real.
3. La sección AI compartida del Hub muestra si hay credencial y los tokens informados, además de solicitudes sin consumo confirmado. Es contabilidad local; no es precio, factura ni límite de gasto de la cuenta.
4. Abrir un segundo proyecto. Su editor puede cargar modelos con la credencial de sesión, pero debe elegir/probar su modelo. Modelo, límites, consumo local, confirmaciones, propuestas y tareas se mantienen separados. Cerrar un editor no desconecta a los demás.
5. Con Require confirmation habilitado, pedir una edición acotada, por ejemplo mover una entidad a X=2. Leer el plan, aprobarlo desde el chat y esperar el resultado. MAIN permanece intacto durante la propuesta.
6. Review changes permite inspeccionar el diff. Apply humano adopta y guarda mediante la transacción del producto y conserva recuperación. Un cambio concurrente vuelve obsoleta la revisión; la sustitución explícita de MAIN mantiene la confirmación histórica del motor.
7. Iniciar otra tarea y cancelarla. No se ejecutan herramientas de una respuesta posterior a cancelar/desconectar/cambiar proyecto. El consumo desconocido se marca, sin inventar tokens ni afirmar que cancelar elimina un cargo ya incurrido.
8. Desconectar desde un editor afecta a todos. Reiniciar Platform elimina la credencial de memoria; uso informado y preferencias continúan guardados. Un modelo recordado no implica conexión probada tras reabrir.

## Propiedad y compatibilidad

Platform ofrece proveedor HTTP, núcleo de turnos, límites/consumo, cancelación, transporte IPC, journal, registro/validación de herramientas y diff/gates de revisión. Game Engine conserva instrucciones/contexto, PMD, selección de herramientas autorizadas, progreso/aceptación de dominio, compilación, snapshots, transacción/rollback y recuperación de recursos. El modo directo del motor usa las mismas bibliotecas con conexión propia. Su controlador de autonomía determinista sigue siendo específico del producto.

La credencial introducida en el editor transita hacia el host y no se retiene en el cliente del producto. OPENAI_API_KEY del host no se hereda al crear procesos alojados. Los modelos no reciben la clave ni eligen endpoints, identidad o revisiones. Herramientas desconocidas o que intentan seleccionar proyecto/revisión continúan rechazadas. No hay tareas entre productos ni plugins externos.

El ledger general se guarda en el perfil de Platform (ai-usage.json); configuración y work journals existentes del producto mantienen sus formatos/ubicaciones y no se borran para aparentar una migración. El codec común conserva recibos y operaciones pendientes; el adaptador de juegos selecciona/valida el contenido específico.

## Pruebas

```powershell
$env:AXIOM_ENGINE_PATH = $enginePath
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $enginePath '.axiom\browsers'
npm run check
npm run test:browser
npm run test:browser:p2
npm run test:browser:p3
```

Los tests P3 usan procesos reales del motor y HTTP AI controlado. Cubren aprobación, aislamiento, revisión/aplicación/reapertura, errores, cancelación, respuestas tardías y conflictos. Las regresiones existentes del Engine conservan presupuestos, exactamente una ejecución al reanudar y rollback. Null no acredita GPU. La calidad/coste de un modelo real exige una evaluación manual separada; no se presenta una respuesta fixture como evidencia de inteligencia.

[ADR](adr/0004-p3-ai-and-review.md) · [Informe](reports/P3_REPORT.md).
