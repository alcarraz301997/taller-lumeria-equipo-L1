# Plan Técnico

## Resumen ejecutivo

La solución propone automatizar el reabastecimiento del banco de preguntas de Lumeria utilizando los registros de preguntas faltantes generados durante la creación de materiales académicos. Cuando el sistema detecte que no existen suficientes preguntas para completar una generación, registrará un faltante asociado a curso, tema, subtema y nivel. Un proceso asíncrono identificará estos registros pendientes y enviará solicitudes automáticas a NQ para generar nuevas preguntas. Las respuestas recibidas serán validadas utilizando la lógica existente de control de duplicidad y únicamente las preguntas válidas serán almacenadas en la tabla temporal de revisión docente. La solución incorpora procesamiento FIFO, control de estados, manejo de errores, reintentos automáticos y trazabilidad completa para minimizar intervención manual y garantizar continuidad operativa.

---

# 1. Enfoque técnico (alto nivel)

La solución utilizará un modelo de procesamiento asíncrono basado en colas de trabajo.

Durante la generación de materiales académicos, cuando no existan suficientes preguntas para completar la solicitud, el sistema registrará un faltante asociado a curso, tema, subtema y nivel.

Los faltantes serán acumulativos para una misma combinación de curso, tema, subtema y nivel.

Los registros pendientes serán procesados automáticamente mediante una cola FIFO estricta utilizando la fecha de generación del material como criterio de prioridad.

Antes de enviar una solicitud a NQ, el sistema validará que el curso se encuentre habilitado para la integración y dividirá la solicitud en bloques de hasta 5 preguntas según las restricciones de la API de NQ.

Las preguntas recibidas serán sometidas al flujo existente de validación de duplicidad. Las preguntas válidas serán almacenadas en la tabla temporal de revisión docente y las preguntas descartadas generarán automáticamente nuevas solicitudes hasta completar la cantidad originalmente requerida, con un máximo de 3 ciclos de reposición. Si tras 3 ciclos no se alcanza la cantidad requerida, el faltante transitará a `FAILED` con motivo `max_reposition_cycles_exceeded`.

Si un registro vuelve a `PENDING` por error de NQ (HTTP 5xx, timeout), conservará su timestamp original de generación para mantener la prioridad FIFO.

Finalmente, el sistema registrará el resultado del proceso para garantizar trazabilidad y monitoreo.

### Flujo general

```text
Generación de material
        ↓
Registro de faltante (PENDING)
        ↓
Cola FIFO (ordenado por fecha generación)
        ↓
Worker asíncrono
        ↓
Validación de curso habilitado
   ↓ No                ↓ Sí
FAILED              Continuar
(no habilitado)         ↓
                División en bloques (máx. 5)
                        ↓
                Integración con NQ
                   ↓ OK           ↓ Error (5xx/timeout)
                Recepción      Reintentos (backoff)
                    ↓               ↓
                Validación     Agotados → PENDING
                duplicidad     (conserva timestamp)
                    ↓
                ¿Cantidad requerida completada?
                      ↓ No                  ↓ Sí
                ¿Ciclos < 3?           COMPLETED
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

Estados sugeridos:

* PENDING
* PROCESSING
* PARTIAL
* COMPLETED
* FAILED

Información sugerida:

* requested_quantity
* generated_quantity
* pending_quantity
* processed_at
* retry_count
* reposition_cycles

### Control de reposición

Mantiene la relación entre los registros de faltantes y las preguntas generadas en el banco IA.

Permite determinar cuándo un faltante ha sido satisfecho completamente y evita solicitudes duplicadas hacia NQ.

### Gestor FIFO de procesamiento

Administra la ejecución automática de registros pendientes respetando el orden cronológico de generación.

### Integración con NQ

Gestiona la comunicación con el servicio externo para solicitar generación de preguntas.

Responsabilidades:

* Validar cursos habilitados.
* Dividir solicitudes en bloques máximos de 5 preguntas.
* Gestionar reintentos automáticos.
* Solicitar reposiciones cuando existan preguntas descartadas por duplicidad.

### Validador de duplicidad

Utiliza la lógica existente de Lumeria para identificar preguntas previamente registradas.

### Tabla temporal de revisión docente

Almacena únicamente las preguntas válidas generadas por NQ para continuar con el flujo actual de revisión académica.

### Auditoría y monitoreo

Registra eventos relevantes para seguimiento operativo, diagnóstico de errores y análisis de desempeño.

---

# 3. Decisiones de arquitectura (Mini ADR)

## Decisión

Utilizar procesamiento asíncrono mediante colas FIFO para ejecutar automáticamente la integración con NQ.

## Justificación

La generación de preguntas depende de un servicio externo y puede presentar tiempos de respuesta variables. El uso de colas permite desacoplar el proceso de generación de materiales, priorizar registros pendientes y soportar múltiples solicitudes sin afectar la experiencia de usuario.

## Alternativa descartada

Procesamiento síncrono inmediatamente después del registro del faltante.

## Motivo del descarte

Incrementaría el tiempo de respuesta de la generación de materiales y afectaría la escalabilidad del sistema.

---

# 4. Riesgos y dependencias

| Riesgo                                      | Mitigación                          |
| ------------------------------------------- | ----------------------------------- |
| API de NQ no disponible                     | Reintentos automáticos              |
| Respuesta inválida de NQ                    | Validación previa al almacenamiento |
| Preguntas duplicadas                        | Validación automática y reposición  |
| Procesamiento simultáneo del mismo faltante | Control de estados                  |
| Alto volumen de faltantes pendientes        | Cola FIFO                           |
| Cursos no habilitados                       | Validación previa                   |
| Reposición incompleta                       | Máximo 3 ciclos de reposición, luego FAILED |

### Dependencias

* Disponibilidad de la API NQ.
* Existencia de registros válidos de faltantes.
* Disponibilidad del mecanismo de procesamiento asíncrono.
* Disponibilidad de la tabla temporal de revisión docente.
* La API NQ limita las solicitudes a un máximo de 5 preguntas por petición.

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
| NFR-2 Evitar duplicados         | Validador de duplicidad          |
| NFR-3 Procesamiento concurrente | Gestor FIFO y control de estados |

---

# 6. Assumptions

* NQ generará preguntas respetando el curso, tema, subtema y nivel enviados en la solicitud.
* Los registros de faltantes mantienen información académica suficiente para construir el payload hacia NQ.
* La validación de duplicidad existente en Lumeria puede reutilizarse sin modificaciones significativas.

---
