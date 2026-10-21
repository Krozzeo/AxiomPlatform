# Axiom Platform — Documento maestro

Fecha: 2026-10-21. Estado: P0/P1 integradas y P2 implementada en ramas para revisión; P3 implementada en ramas para revisión; P4–P5 pendientes. Nombre canónico: **Axiom**, nunca Axion en identificadores nuevos.

## Actualización P1

P1 fue integrada tras CI aprobado y aceptación manual del usuario. [Informe histórico](reports/P1_REPORT.md) y [guía P1](P1_GUIDE.md). Su evidencia no acredita automáticamente P2.

## Actualización P2

P1 fue aceptada manualmente y se integró con CI. P2 implementa catálogo/servicios compartidos en ramas para revisión; [informe](reports/P2_REPORT.md). La decisión comercial sigue aplazada. Los estados P0/P1 anteriores se conservan como historia.

## Actualización P3

AI y revisión genéricas extraídas y consumidas por el motor; cuenta AI compartida en sesión, preferencias por proyecto y autoridad de dominio conservada. [Guía](P3_GUIDE.md), [ADR](adr/0004-p3-ai-and-review.md) e [informe](reports/P3_REPORT.md). P2/P3 aún no integradas y #55 sigue abierto. P4/P5 continúan pendientes.

## Propósito

Crear una familia de aplicaciones especializadas de juegos e ingeniería, utilizables manualmente desde el navegador y diseñadas para que agentes AI operen mediante herramientas semánticas verificables. Platform ofrece el entorno y los servicios comunes. Game Engine es el primer producto real; un CAD paramétrico, un entorno matemático y una aplicación de animación son posibilidades futuras, sin fecha o alcance funcional aprobado.

## Usuarios y recorridos objetivo

- Una persona abre Platform, agrega un proyecto y lo abre en su producto compatible.
- La persona edita manualmente; un agente utiliza operaciones de dominio con las mismas validaciones.
- Una propuesta se inspecciona, valida y aplica sin perder cambios concurrentes.
- Una cuenta externa puede estar conectada en la sesión, con repositorio y preferencias independientes por proyecto.
- Una aplicación o formato incompatible produce un diagnóstico antes de escribir datos.
- Un juego exportado se ejecuta sin Platform, editor, AI o daemon de desarrollo.

Estos recorridos son objetivos. P0 no los declara implementados fuera del motor actual.

## Decisiones aceptadas

1. Dos repositorios iniciales: AxiomPlatform y AxiomGameEngine, públicos y con licencia MIT por instrucción posterior del propietario. Se conservan avisos de terceros y el historial de licencias anteriores del motor.
2. Platform alberga Hub, servicios comunes y SDK de integración; Game Engine mantiene sus dominios. No se crean repositorios por biblioteca en P0.
3. Productos con versiones y pruebas propias. Platform es la entrada habitual; el motor conserva arranque directo para desarrollo y automatización. Exportados independientes.
4. Extracción gradual, sin reescritura del stack ni copia permanente de carpetas como mecanismo de integración.
5. Configuración separada por Platform, producto, proyecto y sesión. Credenciales fuera del proyecto y del repositorio.
6. AI común para conexión/orquestación; herramientas, reglas, contexto y evidencias de dominio pertenecen al producto.
7. Formatos nativos independientes, envoltura común mínima e intercambio explícito. Un CAD no usa obligatoriamente entidades o mallas del motor como modelo paramétrico.
8. Integraciones oficiales primero. Extensiones externas, marketplace, colaboración en tiempo real, nube propia y automatización entre productos quedan fuera de P1–P4.
9. Actualización sin interrumpir tareas activas; compatibilidad declarada; migraciones incompatibles requieren confirmación y copia recuperable.
10. El modelo comercial se posterga. MIT es la decisión de licencia actual y no decide servicios, soporte o monetización futura.

## Alcance y límites

Platform comparte infraestructura demostrada, no un motor universal. Renderer, compute, físicas, geometría exacta y cálculo matemático permanecen especializados hasta tener una necesidad real de reutilización. Los componentes compartidos deben existir detrás de contratos públicos; Platform no importa clases de escenas, Unity o Game Engine.

Game Engine conserva la implementación propia funcional de la API objetivo de Unity, shaders y físicas GPU planificados en M19–M40. La separación no implementa ni aumenta su cobertura. No se renumeran esas milestones ni se exige terminar toda Platform antes de avanzar en ellas.

## Éxito y planificación

P0 es documentación coherente, trazable al código existente y lista para iniciar P1. P1 demuestra un recorrido vertical con el motor existente; P2 extrae servicios; P3 separa AI; P4 estabiliza interfaz compartida y distribución; P5 verifica la arquitectura con un segundo consumidor pequeño. No hay fechas o estimaciones de cobertura inventadas. [Gates](ROADMAP.md).

## Antecedentes de inspección P0 y supuestos originales

En la base de P0, el motor combinaba editor de navegador, Rust/Wasm, WebGPU/Null, C# y daemon Node de producción; el daemon Rust tenía alcance menor. Su Hub enumeraba productos futuros no disponibles y los servicios de Hub, GitHub y AI se inicializaban junto a SceneWorkspace. P1/P2 desacoplan host, catálogo y transporte/cuenta GitHub; AI queda para P3.

Se usa como base de inspección el commit del motor `871a72f6d2c720e99e0a8d1598c0f35af69c4d78`. Su árbol coincide con el candidato que aprobó CI 329; esa evidencia histórica no acredita futuros commits ni todas las repeticiones de CI. La validación manual de GitHub nativo y el fallo intermitente de Inspector siguen siendo pendientes separados.

Los supuestos originales de P1 (apertura sin migrar documentos, negociación del primer recorrido y arranque directo conservado) fueron comprobados por esa entrega. P2 y las etapas siguientes mantienen pruebas y recuperación independientes.

## Pendiente de CI descubierto al documentar P0

El run posterior de la base 871a72f terminó con fallo M17 y del gate agregado: [run 39507425121](https://github.com/Krozzeo/AxiomGameEngine/actions/runs/39507425121), 44/46 trabajos aprobados. Se registró [#51](https://github.com/Krozzeo/AxiomGameEngine/issues/51), aserción de posiciones de runtime sin cambio, sin causa confirmada. No se presenta la base como totalmente verde por el CI 329 anterior del mismo árbol. La rama P0 y Platform tienen sus propias verificaciones; este fallo sigue pendiente en el motor.
