# Plan Técnico

## Resumen ejecutivo

La solución propone automatizar el reabastecimiento del banco de preguntas de Lumeria utilizando los registros de preguntas faltantes generados durante la creación de materiales académicos. Cuando el sistema detecte que no existen suficientes preguntas para completar una generación, registrará un faltante asociado a curso, tema, subtema y nivel. Un proceso asíncrono identificará estos registros pendientes y enviará solicitudes automáticas a NQ para generar nuevas preguntas. Las respuestas recibidas serán validadas utilizando la lógica existente de control de duplicidad y únicamente las preguntas válidas serán almacenadas en la tabla temporal de revisión docente. La solución incorpora procesamiento FIFO, control de estados, manejo de errores, reintentos automáticos y trazabilidad completa para minimizar intervención manual y garantizar continuidad operativa.

---

# 1. Enfoque técnico (alto nivel)

La solución utilizará un modelo de procesamiento asíncrono basado en colas de trabajo.

Durante la generación de materiales académicos, cuando no existan suficientes preguntas para completar la solicitud, el sistema registrará un faltante asociado a curso, tema, subtema y nivel.

Los registros pendientes serán procesados automáticamente mediante una cola FIFO utilizando la fecha de generación del material como criterio de prioridad.

Antes de enviar una solicitud a NQ, el sistema validará que el curso se encuentre habilitado para la integración y dividirá la solicitud en bloques de hasta 5 preguntas según las restricciones operativas actuales.

Las preguntas recibidas serán sometidas al flujo existente de validación de duplicidad. Las preguntas válidas serán almacenadas en la tabla temporal de revisión docente y las preguntas descartadas generarán automáticamente nuevas solicitudes hasta completar la cantidad originalmente requerida.

Finalmente, el sistema registrará el resultado del proceso para garantizar trazabilidad y monitoreo.

### Flujo general

```text
Generación de material
        ↓
Registro de faltante (PENDING)
        ↓
Cola FIFO
        ↓
Worker asíncrono
        ↓
Validación de curso habilitado
        ↓
División en bloques (máx. 5)
        ↓
Integración con NQ
        ↓
Recepción de preguntas
        ↓
Validación de duplicidad
        ↓
¿Cantidad requerida completada?
      ↓ No                  ↓ Sí
Solicitar reposición     Almacenar preguntas válidas
      ↓                  en tabla temporal
Actualizar estado              ↓
(PARTIAL)                 COMPLETED
```

---

# 2. Componentes afectados

### Registro de faltantes

Componente encargado de almacenar los faltantes detectados durante la generación de materiales.

Mantiene la trazabilidad completa del proceso mediante estados de procesamiento y control de cantidades generadas.

Estados sugeridos:

* `PENDING`: pendiente de envío a NQ.
* `PROCESSING`: solicitud en ejecución.
* `PARTIAL`: completado parcialmente por duplicados o reposiciones pendientes.
* `COMPLETED`: cantidad requerida completada exitosamente.
* `FAILED`: error de integración o procesamiento.

Información adicional:

* Cantidad solicitada.
* Cantidad generada válida.
* Cantidad pendiente.
* Fecha de procesamiento.
* Último intento.

### Gestor FIFO de procesamiento

Administra la ejecución automática de registros pendientes respetando el orden cronológico de generación del material asociado.

### Integración con NQ

Gestiona la comunicación con el servicio externo para solicitar generación de preguntas.

Responsabilidades:

* Validar cursos habilitados.
* Dividir solicitudes en bloques máximos de 5 preguntas.
* Gestionar reintentos.
* Solicitar reposiciones automáticas cuando existan preguntas descartadas por duplicidad.

### Validador de duplicidad

Utiliza la lógica existente de Lumeria para identificar preguntas previamente registradas y descartar duplicados.

### Tabla temporal de revisión docente

Almacena únicamente las preguntas válidas generadas por NQ para continuar con el flujo actual de revisión académica.

### Auditoría y monitoreo

Registra eventos relevantes para seguimiento operativo, diagnóstico de errores y análisis de desempeño.

---

# 3. Decisiones de arquitectura (Mini ADR)

## Decisión

Utilizar procesamiento asíncrono mediante colas FIFO para ejecutar automáticamente la integración con NQ.

## Justificación

La generación de preguntas depende de un servicio externo y puede presentar tiempos de respuesta variables. El uso de colas permite desacoplar el proceso de generación de materiales, priorizar registros pendientes y soportar múltiples solicitudes concurrentes sin afectar la experiencia de usuario.

## Alternativa descartada

Procesamiento síncrono inmediatamente después del registro del faltante.

## Motivo del descarte

Incrementaría el tiempo de respuesta de la generación de materiales y afectaría la escalabilidad del sistema.

---

# 4. Riesgos y dependencias

| Riesgo                                         | Mitigación                                                   |
| ---------------------------------------------- | ------------------------------------------------------------ |
| API de NQ no disponible                        | Reintentos automáticos y monitoreo                           |
| Respuesta inválida de NQ                       | Validación previa al almacenamiento                          |
| Preguntas duplicadas                           | Validación automática y solicitud de reposición              |
| Procesamiento simultáneo del mismo faltante    | Control de estados y bloqueo lógico                          |
| Alto volumen de faltantes pendientes           | Procesamiento mediante cola FIFO                             |
| Cursos no habilitados para integración         | Validación previa al envío                                   |
| Reposición incompleta por duplicidad reiterada | Reintentos automáticos hasta completar la cantidad requerida |

### Dependencias

* Disponibilidad de la API NQ.
* Existencia de registros de faltantes con curso, tema, subtema y nivel válidos.
* Disponibilidad del mecanismo de procesamiento asíncrono.
* Disponibilidad del servicio actual de validación de duplicidad.
* Disponibilidad de la tabla temporal de revisión docente.

---

# 5. Trazabilidad

| Requisito                                            | Componentes relacionados                |
| ---------------------------------------------------- | --------------------------------------- |
| HU-1.1 Ejecución automática del envío                | Gestor FIFO y procesamiento asíncrono   |
| HU-1.2 Procesamiento por prioridad                   | Gestor FIFO                             |
| HU-1.3 Regla FIFO                                    | Gestor FIFO                             |
| HU-1.4 Cursos habilitados                            | Integración con NQ                      |
| HU-1.5 Validación de atributos enviados              | Integración con NQ                      |
| HU-1.6 División por bloques                          | Integración con NQ                      |
| HU-1.8 Manejo de errores de integración              | Integración con NQ y Auditoría          |
| HU-2.1 Recepción automática de preguntas             | Integración con NQ                      |
| HU-2.2 Validación de duplicidad                      | Validador de duplicidad                 |
| HU-2.3 Descarte de duplicados                        | Validador de duplicidad                 |
| HU-2.4 Solicitud automática de reposición            | Integración con NQ                      |
| HU-2.6 Almacenamiento de preguntas válidas           | Tabla temporal de revisión              |
| HU-2.8 Reintentos hasta completar cantidad requerida | Integración con NQ y control de estados |
| NFR-1 Procesamiento asíncrono                        | Gestor FIFO                             |
| NFR-2 Evitar duplicados                              | Validador de duplicidad                 |
| NFR-3 Procesamiento concurrente                      | Gestor FIFO y control de estados        |

```
```
