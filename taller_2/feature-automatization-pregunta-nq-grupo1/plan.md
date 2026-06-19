# Plan Técnico

## Resumen ejecutivo

La solución propone automatizar el reabastecimiento del banco de preguntas de Lumeria utilizando los registros de preguntas faltantes generados durante la creación de materiales académicos. Cuando el sistema detecte que no existen suficientes preguntas para completar una generación, registrará un faltante asociado a curso, tema, subtema y nivel. Un worker secuencial identificará estos registros pendientes y enviará solicitudes automáticas a NQ para generar nuevas preguntas. Las respuestas recibidas serán validadas utilizando la lógica existente de control de duplicidad y únicamente las preguntas válidas serán almacenadas en la tabla temporal de revisión docente, todo dentro de una misma transacción. La solución incorpora procesamiento FIFO, control de estados (incluyendo `CANCELLED`), manejo de errores con distinción 4xx vs 5xx, reintentos automáticos (máximo 3, estándar del proyecto), trazabilidad completa y monitoreo vía Horizon para minimizar intervención manual y garantizar continuidad operativa.

---

# 1. Enfoque técnico (alto nivel)

La solución utilizará un modelo de procesamiento asíncrono basado en colas de trabajo con workers secuenciales (1 registro a la vez).

Durante la generación de materiales académicos, cuando no existan suficientes preguntas para completar la solicitud, el sistema registrará un faltante asociado a curso, tema, subtema y nivel. **Cada generación crea su propio registro separado**, no se acumulan.

Los registros pendientes serán procesados automáticamente mediante una cola FIFO estricta utilizando la fecha de generación del material como criterio de prioridad.

Antes de enviar una solicitud a NQ, el sistema validará que el curso se encuentre habilitado para la integración:
- **Curso deshabilitado en Lumeria** (curso, tema, subtema o nivel eliminado): se eliminan los registros `PENDING` asociados.
- **Curso deshabilitado en NQ**: el registro transita a `CANCELLED` sin enviarse a la cola.

Si el curso está habilitado, se dividirá la solicitud en bloques de hasta 5 preguntas según las restricciones de la API de NQ. Entre cada request a NQ se aplica un **delay fijo configurable** para evitar saturación.

Las preguntas recibidas serán sometidas al flujo existente de validación de duplicidad. Las preguntas válidas serán almacenadas en la tabla temporal de revisión docente y las preguntas descartadas generarán automáticamente nuevas solicitudes hasta completar la cantidad originalmente requerida, con un máximo de 3 ciclos de reposición. Si tras 3 ciclos no se alcanza la cantidad requerida, el faltante transitará a `FAILED` con motivo `max_reposition_cycles_exceeded`.

**Tanto el almacenamiento de preguntas como la actualización del faltante ocurren en una misma transacción** para evitar duplicados por crash del worker.

Manejo de errores HTTP:
- **5xx / timeout**: reintentos con backoff, máximo 3 (estándar del proyecto). Si se agotan, el registro vuelve a `PENDING` conservando su timestamp original. Un worker posterior reintentará desde el bloque donde falló.
- **4xx (bad request)**: `FAILED` inmediato sin reintento, registrado en logs para monitoreo vía Horizon.
- **429 (Too Many Requests)**: backoff respetando el header `Retry-After` de NQ, reintentos máx 3. Si se agotan, el registro vuelve a `PENDING` conservando su timestamp original.

Si un registro vuelve a `PENDING` por error de NQ (HTTP 5xx, timeout), conservará su timestamp original de generación para mantener la prioridad FIFO. Si un registro supera el tope de 3 reintentos sin éxito, transita a `FAILED` con motivo `max_retries_exceeded`.

Un registro `FAILED` podrá re-procesarse automáticamente si la causa se resuelve (ej. curso se re-habilita). Esto se evalúa en la siguiente consulta de faltantes para envío a cola; no hay reproceso inmediato.

El criterio de `COMPLETED` es `generated_quantity >= requested_quantity`.

Finalmente, el sistema registrará el resultado del proceso en logs. El monitoreo operativo se realiza vía Horizon.

### Flujo general

```text
Generación de material
        ↓
Registro de faltante (PENDING)
(cada generación = registro separado)
        ↓
Cola FIFO (ordenado por fecha generación)
        ↓
Worker secuencial (1 registro a la vez)
        ↓
Validación de curso habilitado
   ↓ No (en Lumeria)    ↓ No (en NQ)          ↓ Sí
  Eliminar PENDING     CANCELLED           Continuar
  asociados                                     ↓
                                        División en bloques (máx. 5)
                                        (delay fijo configurable entre requests)
                                                ↓
                                        Integración con NQ
                                     ↓ OK                 ↓ Error
                                  Recepción        ┌─────────┬─────────┐
                                      ↓          5xx/timeout    4xx
                                  Validación      reintentos    FAILED
                                  duplicidad     (máx 3)          ↓
                                      ↓        ┌────┴────┐    (logs)
                                  Transacción  OK    Agotados
                                  única (pregs  ↓        ↓
                                  + faltante)  sigo  PENDING
                                      ↓        (cons. timestamp)
                                  ¿generated >= requested?
                                      ↓ No                ↓ Sí
                                  ¿Ciclos < 3?       COMPLETED
                                ↓ Sí          ↓ No
                            Solicitar        FAILED
                            reposición    (max_reposition
                                ↓         _cycles_exceeded)
                            Actualizar
                            (PARTIAL)
```

---

# 2. Componentes afectados

### Registro de faltantes

Componente encargado de almacenar los faltantes detectados durante la generación de materiales.

Mantiene la trazabilidad completa del proceso mediante estados de procesamiento y control de cantidades generadas.

Estados:

* PENDING
* PROCESSING
* PARTIAL
* COMPLETED
* FAILED
* **CANCELLED** (curso deshabilitado en NQ)

Información:

* requested_quantity
* generated_quantity
* pending_quantity
* processed_at
* retry_count
* reposition_cycles
* failure_reason (course_disabled_in_nq, max_reposition_cycles_exceeded, max_retries_exceeded, bad_request)

### Control de reposición

Mantiene la relación entre los registros de faltantes y las preguntas generadas en el banco IA.

Permite determinar cuándo un faltante ha sido satisfecho completamente y evita solicitudes duplicadas hacia NQ.

### Gestor FIFO de procesamiento

Administra la ejecución automática de registros pendientes respetando el orden cronológico de generación.

Workers secuenciales: procesan 1 registro a la vez, eliminando la necesidad de locks distribuidos.

### Integración con NQ

Gestiona la comunicación con el servicio externo para solicitar generación de preguntas.

Responsabilidades:

* Validar cursos habilitados (Lumeria y NQ).
* Diferenciar deshabilitado en Lumeria (eliminar PENDING) vs en NQ (CANCELLED).
* Dividir solicitudes en bloques máximos de 5 preguntas.
* Aplicar delay fijo configurable entre requests.
* Gestionar reintentos automáticos (máx 3 para 5xx/timeout; 4xx → FAILED directo).
* Solicitar reposiciones cuando existan preguntas descartadas por duplicidad.

### Validador de duplicidad

Utiliza la lógica existente de Lumeria para identificar preguntas previamente registradas.

### Tabla temporal de revisión docente

Almacena únicamente las preguntas válidas generadas por NQ para continuar con el flujo actual de revisión académica.

### Auditoría y monitoreo

Registra eventos relevantes para seguimiento operativo, diagnóstico de errores y análisis de desempeño. Monitoreo vía Horizon.

---

# 3. Decisiones de arquitectura (Mini ADR)

## Decisión

Utilizar procesamiento asíncrono mediante colas FIFO con workers secuenciales para ejecutar automáticamente la integración con NQ.

## Justificación

La generación de preguntas depende de un servicio externo y puede presentar tiempos de respuesta variables. El uso de colas permite desacoplar el proceso de generación de materiales, priorizar registros pendientes y soportar múltiples solicitudes sin afectar la experiencia de usuario. Workers secuenciales eliminan la necesidad de locks distribuidos y simplifican la consistencia.

## Alternativa descartada

Procesamiento síncrono inmediatamente después del registro del faltante.

## Motivo del descarte

Incrementaría el tiempo de respuesta de la generación de materiales y afectaría la escalabilidad del sistema.

---

# 4. Riesgos y dependencias

| Riesgo                                      | Mitigación                          |
| ------------------------------------------- | ----------------------------------- |
| API de NQ no disponible                     | Reintentos automáticos (máx 3, luego FAILED) |
| Respuesta inválida de NQ (4xx)              | FAILED inmediato sin reintento      |
| Preguntas duplicadas                        | Validación automática y reposición (máx 3 ciclos) |
| Procesamiento simultáneo del mismo faltante | Workers secuenciales (1 registro a la vez) |
| Crash del worker tras recibir preguntas     | Transacción única (preguntas + faltante) |
| Alto volumen de faltantes pendientes        | Cola FIFO + workers secuenciales    |
| Cursos no habilitados                       | Validación previa: eliminar PENDING (Lumeria) o CANCELLED (NQ) |
| Reposición incompleta                       | Máximo 3 ciclos de reposición, luego FAILED |
| Inanición FIFO por reintentos infinitos     | Tope de 3 reintentos por error 5xx/timeout |
| Rate limiting de NQ                         | Backoff respetando Retry-After + reintentos máx 3 |
| Redis indisponible (cola/caché)             | El job falla y el registro vuelve a PENDING. Sin caché, se consume nuevo crédito NQ en el reintento. Monitoreo vía Horizon para alertar |
| Registros FAILED sin supervisión            | Monitoreo vía Horizon (logs)        |
| Reproceso de FAILED no controlado           | Solo en siguiente consulta a cola si causa se resuelve |

### Dependencias

* Disponibilidad de la API NQ.
* Existencia de registros válidos de faltantes.
* Disponibilidad del mecanismo de procesamiento asíncrono.
* Disponibilidad de la tabla temporal de revisión docente (misma BD que faltantes).
* La API NQ limita las solicitudes a un máximo de 5 preguntas por petición.
* La lógica de validación de duplicidad existente es reutilizable.

---

# 5. Trazabilidad

| Requisito                       | Componentes relacionados         |
| ------------------------------- | -------------------------------- |
| HU-1 Registro de faltantes      | Registro de faltantes            |
| HU-1 Procesamiento automático   | Gestor FIFO                      |
| HU-1 Integración con NQ         | Integración con NQ               |
| HU-2 Validación de duplicidad   | Validador de duplicidad          |
| HU-2 Reposición automática      | Control de reposición            |
| HU-2 Almacenamiento temporal    | Tabla temporal de revisión       |
| NFR-1 Procesamiento asíncrono   | Gestor FIFO                      |
| NFR-2 Evitar duplicados         | Validador de duplicidad + transacción única |
| NFR-3 Procesamiento secuencial  | Workers secuenciales             |
| NFR-4 Latencia job < 1s          | Workers secuenciales + optimización de queries |
| NFR-5 HTTP 429                  | Backoff con Retry-After + reintentos máx 3 |
| NFR-6 Connection/read timeout   | Mismo tratamiento que 5xx        |
| NFR-7 Monitoreo operativo       | Horizon + logs                   |

---

# 6. Assumptions

* NQ generará preguntas respetando el curso, tema, subtema y nivel enviados en la solicitud.
* Los registros de faltantes mantienen información académica suficiente para construir el payload hacia NQ.
* La validación de duplicidad existente en Lumeria puede reutilizarse sin modificaciones significativas.
* La tabla temporal de revisión docente y la tabla de faltantes están en la misma base de datos (soporta transacciones únicas).
* El volumen de faltantes permite workers secuenciales sin impacto operativo significativo.
* El delay fijo configurable entre requests a NQ es suficiente para evitar rate limiting.

---
