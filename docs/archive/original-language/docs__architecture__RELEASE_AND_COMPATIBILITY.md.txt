# Versiones, instalación y distribución

## Versionado

Platform, SDK y productos tienen versiones independientes. Un producto declara rango admitido del contrato de Platform y versiones de documentos. Fijar dependencias a una versión comprobada y lockfile; no consumir main remoto como dependencia. Los cambios incompatibles del contrato requieren nueva versión mayor cuando el contrato sea estable; durante 0.x explicitar qué minor rompe compatibilidad. Documentar deprecaciones y pruebas del consumidor antes de retirar un contrato.

El SDK de scripting del motor conserva su numeración: no es la versión del SDK de Platform. P0 no asigna una versión ejecutable a Platform ni publica paquetes.

## Distribución objetivo

Platform administra instalaciones oficiales y proyectos; artefactos separados por producto/SO/arquitectura y metadatos de compatibilidad/integridad. No mezclar directorios de programas con documentos del usuario. Instalar/actualizar en una ubicación nueva, comprobar integridad y salud, y activar solo al terminar tareas o cerrar sesiones. Mantener versión anterior para recuperación. No ejecutar instrucciones de instalación contenidas en proyectos no confiables.

El arranque directo del motor puede utilizar paquetes comunes instalados sin necesitar la ventana del Hub. El runtime exportado del juego no depende del host/editor/AI. El formato concreto de instalador, registro local y verificación de artefactos se elige mediante ADR en P4 con pruebas de Windows; P0 define requisitos, no promete un instalador existente.

## Offline y plataformas

Los flujos locales no requieren cuenta ni nube. AI remota, GitHub y descargas de productos informan conectividad necesaria; no bloquean abrir/guardar localmente. Windows es el primer recorrido de aceptación de la separación, preservando las verificaciones multiplataforma existentes del motor. No declarar soporte de distribución para otros sistemas sin ejecutar sus pruebas.

## Repositorios y licencia

AxiomPlatform y AxiomGameEngine públicos bajo MIT por decisión explícita del propietario. Las dependencias y fixtures mantienen sus licencias y atribuciones; la extracción incluye trazabilidad de origen y avisos. No copiar node_modules, binarios de dependencias o credenciales a Platform. La nueva licencia del motor no reescribe tags ni entregas históricas. El modelo comercial continúa postergado; la decisión MIT es vigente.
