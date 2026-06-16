# Plan Técnico

## Resumen ejecutivo

La solución propone automatizar el reabastecimiento del banco de preguntas de Lumeria utilizando los registros de preguntas faltantes generados durante la creación de materiales académicos. Cuando el sistema detecte que no existen suficientes preguntas para completar una generación, registrará un faltante asociado a tema, subtema y nivel. Un proceso asíncrono identificará estos registros pendientes y enviará solicitudes automáticas a NQ para generar nuevas preguntas. Las respuestas recibidas serán validadas, sometidas a control de duplicidad e incorporadas automáticamente al banco de preguntas IA. La solución incluye trazabilidad operativa, manejo de errores y procesamiento desacoplado para minimizar impacto sobre la operación principal del sistema.

---

# 1. Enfoque técnico (alto nivel)

La solución utilizará un modelo de procesamiento asíncrono basado en colas de trabajo.

Durante la generación de materiales académicos, cuando no existan suficientes preguntas para completar la solicitud, el sistema registrará un faltante asociado a tema, subtema y nivel.

Un proceso en segundo plano consumirá los registros pendientes y enviará solicitudes automáticas a NQ.

Las preguntas generadas serán validadas, verificadas contra posibles duplicados e incorporadas al banco de preguntas IA.

Finalmente, el sistema registrará el resultado del proceso para garantizar trazabilidad y monitoreo.

### Flujo general

```text
Generación de material
        ↓
Registro de faltante
        ↓
Cola de procesamiento
        ↓
Worker asíncrono
        ↓
Integración con NQ
        ↓
Recepción de preguntas
        ↓
Validación
        ↓
Control de duplicidad
        ↓
Inserción en banco IA
        ↓
Auditoría y monitoreo
```

---

# 2. Componentes afectados

### Registro de faltantes

Componente encargado de almacenar los faltantes detectados durante la generación de materiales.

### Gestor de procesamiento asíncrono

Administra la ejecución en segundo plano de solicitudes pendientes de reposición.

### Integración con NQ

Gestiona la comunicación con el servicio externo para solicitar la generación de preguntas.

### Módulo de validación

Verifica la consistencia e integridad de las preguntas generadas.

### Módulo de deduplicación

Evita la incorporación de preguntas repetidas dentro del banco IA.

### Banco de preguntas

Recibe y almacena las preguntas generadas que superan las validaciones establecidas.

### Auditoría y monitoreo

Registra eventos relevantes para seguimiento operativo y diagnóstico de errores.

---

# 3. Decisiones de arquitectura (Mini ADR)

## Decisión

Utilizar procesamiento asíncrono mediante colas para ejecutar la integración con NQ.

## Justificación

La generación de preguntas depende de un servicio externo y puede requerir tiempos de respuesta variables. Ejecutar el proceso en segundo plano evita afectar el rendimiento de la generación de materiales y mejora la capacidad de escalar múltiples solicitudes simultáneamente.

## Alternativa descartada

Procesamiento síncrono inmediatamente después de registrar el faltante.

## Motivo del descarte

Podría incrementar el tiempo de respuesta de la generación de materiales y degradar la experiencia de usuario.

---

# 4. Riesgos y dependencias

| Riesgo                                      | Mitigación                             |
| ------------------------------------------- | -------------------------------------- |
| API de NQ no disponible                     | Reintentos automáticos y monitoreo     |
| Respuesta inválida de NQ                    | Validación previa a la inserción       |
| Preguntas duplicadas                        | Control de duplicidad antes de guardar |
| Procesamiento simultáneo del mismo faltante | Control de estado y bloqueo lógico     |
| Alto volumen de faltantes pendientes        | Procesamiento mediante colas           |

### Dependencias

* Disponibilidad de la API NQ.
* Existencia de registros de faltantes con tema, subtema y nivel válidos.
* Disponibilidad del mecanismo de procesamiento asíncrono.

---

# 5. Trazabilidad

| User Story                                | Componentes relacionados                       |
| ----------------------------------------- | ---------------------------------------------- |
| US-1 Registrar faltantes                  | Registro de faltantes                          |
| AC-1.2 Procesar faltantes automáticamente | Gestor asíncrono e Integración NQ              |
| AC-1.3 Reabastecer banco de preguntas     | Validación, Deduplicación y Banco de preguntas |
| NFR-1 Procesamiento asíncrono             | Gestor asíncrono                               |
| NFR-2 Evitar duplicados                   | Módulo de deduplicación                        |
| NFR-3 Procesamiento concurrente           | Gestor asíncrono y control de estados          |
