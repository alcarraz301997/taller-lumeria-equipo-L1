# Test Cases

> Plan de pruebas para la automatización de generación de preguntas entre Lumeria y NQ.
> Este documento cubre happy path, casos borde, casos de error y escenarios negativos con datos, pasos y resultado esperado.

---

## 1. Resumen ejecutivo

Este plan de pruebas valida la automatización de generación de preguntas entre Lumeria y NQ.

El enfoque principal es asegurar que la detección automática de subtemas con stock insuficiente funcione correctamente y que la integración asíncrona no comprometa la integridad del banco de preguntas.

Se validarán flujos exitosos, manejo de errores externos, duplicidad de preguntas, validaciones internas, escenarios límite, trazabilidad de estados y cumplimiento de los principios de la constitución del proyecto.

---

## 2. Happy Path

### TC-01 — Detección automática de faltante

| Campo | Valor |
|-------|-------|
| **Datos** | Subtema con stock inferior al mínimo (threshold) durante generación de material |
| **Pasos** | 1. Usuario solicita generación de material académico. 2. Sistema verifica disponibilidad de preguntas en el banco por tema, subtema y nivel. 3. Detecta que el stock es insuficiente para completar la solicitud. 4. Registra el faltante con tema, subtema y nivel. |
| **Esperado** | Se crea registro de faltante con `{ tema, subtema, nivel }`. Se dispara `GenerationJob` a la cola. Estado inicial del faltante: `pending`. |

---

### TC-02 — Generación exitosa y reabastecimiento del banco

| Campo | Valor |
|-------|-------|
| **Datos** | Faltante pendiente válido. API NQ disponible. |
| **Pasos** | 1. `GenerationJob` toma el faltante de la cola Redis/Horizon. 2. Construye payload `{ tema, subtema, nivel }` y lo envía a NQ. 3. NQ responde exitosamente con **5 preguntas** válidas. 4. Sistema valida estructura de cada pregunta. 5. Inserta las 5 preguntas en el banco. |
| **Esperado** | 5 preguntas insertadas correctamente en el banco. `GenerationJob` finaliza con estado `completed`. Faltante marcado como procesado. |

---

### TC-03 — Ciclo de vida completo (trazabilidad de estados)

| Campo | Valor |
|-------|-------|
| **Datos** | Faltante válido, NQ responde OK, inserción exitosa |
| **Pasos** | 1. Faltante registrado → estado `pending`. 2. `GenerationJob` inicia procesamiento → estado `processing`. 3. NQ responde, preguntas insertadas → estado `completed`. 4. Se consulta trazabilidad del proceso. |
| **Esperado** | Trazabilidad registra los 3 estados en orden: `pending` → `processing` → `completed`. No se permite transición directa `pending` → `completed`. |

---

### TC-04 — Notificación de completado al usuario

| Campo | Valor |
|-------|-------|
| **Datos** | `GenerationJob` finaliza exitosamente |
| **Pasos** | 1. `GenerationJob` completa procesamiento con estado `completed`. 2. Sistema ejecuta notificación post-job. |
| **Esperado** | Usuario recibe notificación de que el reabastecimiento se completó exitosamente. |

---

## 3. Happy Path Negativo

### TC-05 — Stock suficiente no genera faltante

| Campo | Valor |
|-------|-------|
| **Datos** | Subtema con stock igual o superior al mínimo requerido |
| **Pasos** | 1. Usuario solicita generación de material. 2. Sistema verifica stock de preguntas para el subtema. 3. Stock es suficiente. |
| **Esperado** | No se registra faltante. No se crea `GenerationJob`. La generación de material continúa normalmente con las preguntas existentes. |

---

## 4. Casos Borde

### TC-06 — Subtema sin nivel configurado (CB-1)

| Campo | Valor |
|-------|-------|
| **Datos** | Faltante registrado cuyo subtema no tiene nivel configurado en la estructura académica del banco |
| **Pasos** | 1. Sistema intenta construir payload `{ tema, subtema, nivel }` para enviar a NQ. 2. Detecta que el subtema no tiene nivel asociado. 3. Valida la regla de negocio: "sin nivel no se puede enviar a NQ". |
| **Esperado** | Se bloquea el envío a NQ. `GenerationJob` → `failed`. Se registra error con motivo: `subtema sin nivel configurado`. No se envía solicitud a NQ. |

---

### TC-07 — Registros repetidos consolidados antes de envío (CB-2)

| Campo | Valor |
|-------|-------|
| **Datos** | 3 registros de faltante idénticos (mismo tema, subtema, nivel) generados antes de que el procesamiento los tome |
| **Pasos** | 1. Durante generación de material se registran 3 faltantes iguales. 2. Procesador de faltantes identifica los 3 registros. 3. Consolida en una única solicitud a NQ (deduplica por tema + subtema + nivel). 4. Envía 1 solicitud a NQ. |
| **Esperado** | 1 sola solicitud enviada a NQ (no 3). 5 preguntas generadas e insertadas una sola vez. Los 3 registros de faltante se marcan como procesados. |

---

### TC-08 — Concurrencia sobre el mismo faltante (CB-5)

| Campo | Valor |
|-------|-------|
| **Datos** | Dos `GenerationJob` compiten por el mismo faltante simultáneamente |
| **Pasos** | 1. Job A toma faltante X y cambia su estado a `processing`. 2. Job B intenta tomar el mismo faltante X mientras Job A está en ejecución. 3. Sistema verifica que el faltante ya está en `processing`. |
| **Esperado** | Job B se bloquea. Solo Job A procesa el faltante. No se duplica la solicitud a NQ ni las preguntas insertadas. |

---

### TC-09 — NQ devuelve preguntas ya existentes en el banco (CB-3)

| Campo | Valor |
|-------|-------|
| **Datos** | NQ devuelve 5 preguntas. 2 de ellas ya existen en el banco con contenido idéntico |
| **Pasos** | 1. Job envía solicitud a NQ. 2. NQ responde con 5 preguntas. 3. Sistema compara cada pregunta contra el banco existente. 4. Detecta 2 duplicadas. |
| **Esperado** | 3 preguntas nuevas insertadas. 2 rechazadas por duplicidad. Se registra motivo de rechazo para cada duplicada. |

---

## 5. Casos de Error

### TC-10 — API NQ responde HTTP 500

| Campo | Valor |
|-------|-------|
| **Datos** | NQ retorna error interno `HTTP 500` |
| **Pasos** | 1. `GenerationJob` envía solicitud a NQ. 2. NQ responde `500 Internal Server Error`. 3. Sistema ejecuta estrategia de retry con backoff exponencial (máximo 3 intentos). 4. Tras 3 intentos fallidos, el job finaliza. |
| **Esperado** | Se ejecutan 3 reintentos con backoff exponencial. Tras agotar reintentos, `GenerationJob` → `failed`. Error registrado con trace completo y timestamp. |

---

### TC-11 — Timeout de NQ (sin respuesta)

| Campo | Valor |
|-------|-------|
| **Datos** | NQ no responde dentro del timeout configurado de 300s |
| **Pasos** | 1. `GenerationJob` envía solicitud a NQ. 2. Timeout de 300s se alcanza sin respuesta. 3. Sistema ejecuta retry. 4. Tras 3 intentos sin respuesta, el job finaliza. |
| **Esperado** | Retry automático (máx. 3 intentos). `GenerationJob` → `failed`. Se registra timeout con timestamp y contexto. |

---

### TC-12 — Pregunta con estructura inválida (validación fallida)

| Campo | Valor |
|-------|-------|
| **Datos** | NQ responde con pregunta que no cumple la estructura requerida (ej: sin enunciado, sin opciones, campos nulos) |
| **Pasos** | 1. NQ devuelve payload con pregunta malformada. 2. Sistema ejecuta validación estructural de cada pregunta antes de insertar. 3. Detecta campos obligatorios faltantes o inválidos. |
| **Esperado** | Pregunta rechazada con estado `VALIDATING FAILED`. No se inserta en el banco. Se registra motivo específico del rechazo. Las preguntas válidas del mismo lote sí se insertan. |

---

### TC-13 — Créditos NQ insuficientes

| Campo | Valor |
|-------|-------|
| **Datos** | NQ responde indicando que no tiene créditos disponibles para generar |
| **Pasos** | 1. `GenerationJob` envía solicitud a NQ. 2. NQ responde con error de créditos agotados. 3. Sistema identifica que no es un error transitorio (no aplica retry). |
| **Esperado** | No se insertan preguntas. `GenerationJob` → `failed`. Se notifica al administrador del sistema. Se registra error con contexto de créditos. |

---

### TC-14 — Partial success (respuesta mixta de NQ)

| Campo | Valor |
|-------|-------|
| **Datos** | NQ devuelve 5 preguntas. 3 válidas, 2 con estructura inválida |
| **Pasos** | 1. NQ responde con payload mixto. 2. Sistema valida cada pregunta individualmente. 3. Inserta las 3 válidas. 4. Rechaza las 2 inválidas. |
| **Esperado** | 3 preguntas insertadas correctamente. 2 rechazadas con motivo registrado. `GenerationJob` → `completed` (con advertencia de rechazos parciales). |

---

## 6. Escenarios Negativos

### TC-15 — GenerationJob no se encola (fallo Redis / queue)

| Campo | Valor |
|-------|-------|
| **Datos** | Redis o Horizon no disponible al momento de disparar el job |
| **Pasos** | 1. Sistema detecta faltante y registra el registro. 2. Intenta encolar `GenerationJob`. 3. Conexión a Redis falla o cola no disponible. |
| **Esperado** | `GenerationJob` no se encola. Faltante permanece en `pending`. Se registra error de infraestructura. Se notifica al administrador. |

---

### TC-16 — Payload malformado hacia NQ

| Campo | Valor |
|-------|-------|
| **Datos** | Datos del faltante corruptos o incompletos (tema vacío, subtema nulo, nivel inválido) |
| **Pasos** | 1. `GenerationJob` intenta construir payload para NQ. 2. Validación pre-envío detecta datos inválidos en el faltante. |
| **Esperado** | No se envía solicitud a NQ. `GenerationJob` → `failed`. Error registrado con detalle del campo inválido. |

---

### TC-17 — Falla inserción en BD tras respuesta exitosa de NQ (resultados huérfanos)

| Campo | Valor |
|-------|-------|
| **Datos** | NQ responde exitosamente con 5 preguntas válidas, pero la base de datos de preguntas no está disponible |
| **Pasos** | 1. NQ devuelve 5 preguntas válidas. 2. Sistema intenta insertar en el banco de preguntas. 3. Conexión a BD falla o lanza excepción durante la inserción. |
| **Esperado** | No se insertan preguntas huérfanas ni parciales. Todo el proceso → `failed`. Las preguntas recibidas de NQ se descartan (no se persisten). Error registrado con trace completo, timestamp y contexto. |

---

### TC-18 — Transición a failed sin omitir estado intermedio

| Campo | Valor |
|-------|-------|
| **Datos** | Faltante válido. Error durante el procesamiento (ej: NQ 500 irrecuperable) |
| **Pasos** | 1. Faltante creado → `pending`. 2. `GenerationJob` inicia → `processing`. 3. Ocurre error durante el envío a NQ (sin reintentos exitosos). 4. Job finaliza con error → `failed`. 5. Se consulta trazabilidad del proceso. |
| **Esperado** | Trazabilidad: `pending` → `processing` → `failed`. No se permite omitir el estado `processing`. No hay transición directa `pending` → `failed`. |

---

### TC-19 — Notificación de fallo al usuario

| Campo | Valor |
|-------|-------|
| **Datos** | `GenerationJob` finaliza en estado `failed` |
| **Pasos** | 1. `GenerationJob` falla durante el procesamiento. 2. Sistema ejecuta notificación post-job. |
| **Esperado** | Usuario recibe notificación de que el reabastecimiento falló, incluyendo motivo del fallo. |

---

### TC-20 — Registro de errores con trazabilidad completa (Constitution Art. 3.4.1)

| Campo | Valor |
|-------|-------|
| **Datos** | Cualquier error durante el procesamiento del job (timeout, HTTP 500, validación, etc.) |
| **Pasos** | 1. Ocurre un error durante la ejecución del `GenerationJob`. 2. Sistema captura y registra el error. 3. Se consulta el log de errores. |
| **Esperado** | El registro de error contiene: mensaje descriptivo, excepción original (trace completo), identificador del proceso o solicitud asociada, timestamp exacto, contexto adicional (usuario, curso, módulo). |

---

### TC-21 — Idempotencia del GenerationJob (Constitution Art. 4.4)

| Campo | Valor |
|-------|-------|
| **Datos** | Mismo faltante procesado exitosamente. Se intenta ejecutar un segundo job con la misma entrada |
| **Pasos** | 1. Job A procesa faltante X → 5 preguntas insertadas → `completed`. 2. Job B (mismo faltante X) se ejecuta nuevamente (por reintento, duplicado de cola o error de infraestructura). 3. Sistema verifica si el faltante X ya fue completado. |
| **Esperado** | Job B detecta que X ya fue procesado exitosamente. No envía nueva solicitud a NQ. No duplica preguntas en el banco. Job B finaliza sin efectos laterales. |

---

### TC-22 — Clasificación de excepciones según Constitution Art. 3.4.2

| Campo | Valor |
|-------|-------|
| **Datos** | Distintos tipos de error durante el procesamiento |
| **Pasos** | 1. Simular error de regla de negocio (subtema sin nivel). 2. Simular error de autenticación con NQ (ODISEO_KEY inválida). 3. Simular error no controlado (excepción genérica). 4. Verificar el tipo de excepción lanzada y su código HTTP. |
| **Esperado** | Regla de negocio → `DomainException` (409). Autenticación → `UnauthorizedException` (401). Error no controlado → `Exception` (500). Cada excepción se clasifica correctamente según ADR-0007. |

---

### TC-23 — ODISEO_KEY no expuesta en logs ni respuestas (Constitution Art. 6.3)

| Campo | Valor |
|-------|-------|
| **Datos** | Error durante comunicación con NQ usando `ODISEO_KEY` |
| **Pasos** | 1. `GenerationJob` falla al comunicarse con NQ (error de autenticación). 2. Sistema registra el error en logs. 3. Se consultan los logs de error y la respuesta HTTP del job. |
| **Esperado** | Los logs contienen descripción del error pero **no** exponen el valor de `ODISEO_KEY`. La key no aparece en mensajes de error, stack traces ni respuestas HTTP. |

---

## 7. Matriz de trazabilidad

| Fuente | ID | Caso de prueba |
|--------|-----|---------------|
| **Spec — AC-1.1** | Registro de faltantes | TC-01, TC-05 |
| **Spec — AC-1.2** | Envío asíncrono a NQ | TC-02, TC-10, TC-11, TC-16 |
| **Spec — AC-1.3** | Inserción y validación | TC-02, TC-09, TC-12, TC-14 |
| **Spec — CB-1** | Subtema sin nivel | TC-06 |
| **Spec — CB-2** | Registros repetidos | TC-07 |
| **Spec — CB-3** | Preguntas duplicadas | TC-09 |
| **Spec — CB-4** | API NQ error / timeout | TC-10, TC-11 |
| **Spec — CB-5** | Concurrencia mismo faltante | TC-08 |
| **Spec — NFR-1** | Procesamiento asíncrono | TC-02, TC-15 |
| **Spec — NFR-2** | Integridad y no duplicados | TC-09, TC-12, TC-14 |
| **Spec — NFR-3** | Concurrencia sin bloqueo | TC-08 |
| **Constitution — Art. 3.2** | Trazabilidad de estados | TC-03, TC-18 |
| **Constitution — Art. 3.3** | Integridad — no resultados parciales | TC-17 |
| **Constitution — Art. 3.4.1** | Registro obligatorio de errores | TC-20 |
| **Constitution — Art. 3.4.2** | Clasificación de excepciones | TC-22 |
| **Constitution — Art. 4.2** | Notificación de resultado | TC-04, TC-19 |
| **Constitution — Art. 4.4** | Idempotencia de jobs | TC-21 |
| **Constitution — Art. 6.3** | ODISEO_KEY no expuesta | TC-23 |

---

## 8. Resultado esperado

| Aspecto | Descripción |
|---------|-------------|
| **Abastecimiento** | El sistema mantendrá abastecimiento automático del banco de preguntas sin intervención manual |
| **Dependencia** | Se reducirá dependencia operativa del docente |
| **Escalabilidad** | La integración soportará escalabilidad futura sin afectar estabilidad del ecosistema Lumeria |
| **Trazabilidad** | La arquitectura garantizará trazabilidad, resiliencia, consistencia de datos y control sobre dependencias externas |
| **Cobertura** | 23 casos de prueba cubriendo happy path (4), happy path negativo (1), casos borde (4), casos de error (5) y escenarios negativos (9) |

---

## Vigencia

Este plan de pruebas entra en vigor inmediatamente y aplica a la feature de automatización de preguntas NQ. Debe actualizarse conforme se descubran nuevos escenarios durante la implementación o se resuelvan las preguntas pendientes de clarificación del spec.
