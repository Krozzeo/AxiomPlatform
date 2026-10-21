# ADR-P0004 — Núcleo AI y revisión con adaptadores de dominio

2026-10-21. Implementado en ramas P3 para revisión. Base Platform 228e1be, Engine d6aad38; P2 no se integra por avanzar esta tanda.

## Decisión

Extraer transporte OpenAI/modelos/límites/consumo, ejecución de turnos y ciclo de tarea a services/ai. El adaptador de producto suministra contexto, normalización de herramientas, guard de vigencia, instrucciones y aceptación final. No trasladar OpenAiAssistant completo: contiene reglas de C#, escenas y PMD. El núcleo compartido cuenta uso real antes de rechazar una respuesta tardía y no permite convertirla en nuevas herramientas.

En modo alojado, AiAccount mantiene una credencial de sesión; SharedAiProvider usa IPC ligado a sesión/proyecto desde el host. Epoch invalida conexiones anteriores; cancelación llega fuera de la cola de solicitudes. Desconectar afecta a todos y cerrar un producto solo cancela sus solicitudes. El host elimina OPENAI_API_KEY del entorno de sus hijos. Una clave introducida en el editor transita al host. El ledger solo conserva contadores por producto/proyecto; errores y respuestas se redactan antes de devolverlas. Un cierre del host registra uso pendiente como desconocido y una respuesta posterior no escribe sobre un ledger de una sesión nueva.

ToolRegistry valida los contratos existentes dentro de cada producto: nombres heredados de herramientas permanecen compatibles y nunca se fusionan globalmente entre productos. Identidad de producto/sesión/revisión y capacidades se fijan por host/adaptador, no por argumentos del modelo. Propuestas manuales y AI usan el mismo cálculo de diferencias, hashes y guard humano extraídos. Persistencia genérica de journals conserva recibos/pending calls; su selección de campos y semántica de reconciliación siguen en el adaptador. La transacción que valida/promueve recursos y modifica MAIN pertenece al producto.

El proveedor se instala por HTTPS con commit/integridad, publicado antes del consumidor; no requiere merges simultáneos. No cambia el SDK C# ni los documentos de juego. Preferencias/modelo se recuerdan; la conexión debe probarse de nuevo al abrir. La autonomía determinista del motor queda como implementación de dominio, no como orquestador universal.

## Evidencia y límites

21 tests Platform y 444 Engine, con aprobación/revisión/cancelación/errores/conflictos y exactamente una ejecución al reanudar cubiertos. Navegadores P1/P2/P3, HTTP AI controlado, Null. No se usaron credenciales reales ni se atribuye calidad de modelo a estas pruebas. Los checks remotos y #55 siguen independientes. [Guía y recorridos](../P3_GUIDE.md).

Contrato del proveedor contrastado con [documentación oficial de Responses](https://developers.openai.com/api/docs/guides/migrate-to-responses): store:false, output tipado y conservación de resultados/llamadas por call_id. No hay migración de modelos, streaming o cambio de endpoint en P3.
