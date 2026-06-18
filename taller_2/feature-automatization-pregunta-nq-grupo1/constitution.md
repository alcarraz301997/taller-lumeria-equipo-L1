# Constitution

## 1. Technology Standards

* Backend desarrollado en PHP 8.3 y Laravel.
* Base de datos PostgreSQL.
* Arquitectura basada en capas (Domain, Application e Infrastructure).
* Procesamiento asíncrono mediante Jobs y colas para operaciones de larga duración.
* Análisis estático mediante PHPStan.
* Formateo obligatorio mediante Laravel Pint.

---

## 2. Security Requirements

* Toda entrada debe validarse antes de ser procesada.
* No se permite almacenar secretos o credenciales dentro del código fuente.
* La información sensible no debe registrarse en logs.
* Toda integración externa debe validar y sanitizar datos de entrada y salida.
* Los mecanismos de autenticación y autorización existentes deben respetarse en toda nueva funcionalidad.

---

## 3. Performance & Scalability

* Los procesos pesados deben ejecutarse mediante colas asíncronas.
* Las consultas a base de datos deben evitar patrones N+1.
* Los jobs deben ser idempotentes para soportar reintentos seguros.
* Las operaciones deben soportar procesamiento concurrente sin inconsistencias.
* Toda nueva funcionalidad debe diseñarse considerando crecimiento futuro del volumen de datos.

---

## 4. Coding Standards

* Uso obligatorio de DTOs para intercambio de información entre capas.
* Código y nombres técnicos en inglés.
* Clases en PascalCase y métodos en camelCase.
* Los controladores deben limitarse a orquestar solicitudes.
* La lógica de negocio debe implementarse mediante Services y Actions.
* Todo código nuevo debe cumplir las reglas definidas por PHPStan y Laravel Pint.

---

## 5. Architecture Principles

* La lógica de negocio debe permanecer desacoplada de la infraestructura.
* Las integraciones externas deben encapsularse mediante clientes o adaptadores dedicados.
* Las dependencias deben resolverse mediante inyección de dependencias.
* Los procesos asíncronos deben ser auditables y trazables.
* Los cambios de estado relevantes deben poder ser monitoreados.
* Las decisiones arquitectónicas relevantes deben documentarse mediante ADR cuando corresponda.

---

## 6. Testing Standards

### 6.1 Principios generales

* Toda funcionalidad nueva debe incluir pruebas automatizadas. No se acepta la omisión por criterio de "viabilidad" sin una justificación documentada y aprobada por el equipo (QA + Tech Lead + Product Owner).
* Los escenarios críticos de negocio deben ser verificables mediante casos de prueba con resultados medibles (estados en BD, conteo de registros, invocaciones a clientes externos, contenido de logs) — sin ambigüedad en el criterio de aceptación.
* Las pruebas deben documentarse en un plan de testing que incluya matriz de trazabilidad contra criterios de aceptación, casos borde, NFRs y artículos aplicables de esta constitución.

### 6.2 Tipos de prueba requeridos

| Tipo | Objetivo | Obligatoriedad |
|------|----------|----------------|
| Unitarias | Lógica de detección, validación estructural, reglas de negocio, máquinas de estado | Obligatorio — 100% de reglas de negocio |
| Integración | Comunicación con APIs externas, colas (Redis), persistencia (PostgreSQL), procesamiento FIFO, validación de duplicidad | Obligatorio — cubrir happy path + fallos externos |
| Seguridad | Protección de secretos en logs y stack traces, sanitización de contenido externo (HTML, scripts, caracteres de control), ofuscación de credenciales en todos los niveles de log (debug, info, error) | Obligatorio — toda integración externa |
| Concurrencia | Doble encolado, workers simultáneos, condiciones de carrera en lectura/escritura de estados, idempotencia de jobs | Obligatorio — cuando exista procesamiento asíncrono o múltiples workers |

### 6.3 Resiliencia y recuperación

* Toda operación asíncrona debe incluir casos de prueba para: reintentos con backoff, límites máximos de reintentos por ciclo y totales acumulados, distinción de errores 4xx vs 5xx/timeout, re-procesamiento automático de registros FAILED cuando la causa se resuelve.
* Los fallos de infraestructura deben contemplarse explícitamente: indisponibilidad de Redis (cola), indisponibilidad de base de datos durante inserción, timeout del cliente HTTP hacia servicios externos.
* Los mecanismos de integridad transaccional (transacción única preguntas + faltante) deben ser verificados para garantizar que un crash del worker no produzca registros huérfanos ni estados inconsistentes.
* Debe verificarse que los errores de infraestructura no produzcan pérdida de trazabilidad ni consumo duplicado de créditos externos.

### 6.4 Rendimiento y carga

* Cuando el plan de riesgos identifique "alto volumen" como riesgo, debe existir al menos un caso de prueba de carga/volumen que valide el comportamiento del sistema bajo estrés (miles de registros pendientes simultáneos).
* Las pruebas deben verificar que la cola y el procesamiento FIFO mantienen su orden bajo carga secuencial sostenida.

### 6.5 Cobertura de errores externos

* Las integraciones externas deben contemplar como mínimo los siguientes escenarios de error:
  - HTTP 5xx (errores de servidor) — reintentos con backoff, máximo 3 por ciclo
  - Timeout de conexión / lectura — mismo tratamiento que 5xx
  - HTTP 4xx (bad request, auth fallida) — FAILED inmediato sin reintento
  - Respuesta HTTP 200 con body inválido o incompleto (schema no esperado)
  - Respuesta exitosa con cantidad de datos distinta a la solicitada (exceso o defecto)

### 6.6 Monitoreo y notificación

* Los cambios de estado relevantes (transiciones a FAILED, CANCELLED, superación de límites de reposición y reintentos) deben ser verificables mediante logs estructurados visibles en Horizon y registros de auditoría en BD.
* Debe existir al menos un caso de prueba que valide que las condiciones de fallo permanente son detectables y trazables por el equipo de operaciones.

### 6.7 Regresión y datos preexistentes

* Antes de activar una funcionalidad nueva, debe definirse y probarse el comportamiento esperado con datos preexistentes creados bajo la versión anterior del sistema (migración retroactiva o exclusión explícita).
* Todo fallo de inserción en BD debe verificar rollback total sin registros huérfanos.

### 6.8 Mocking y entornos aislados

* Las integraciones externas deben probarse en entornos aislados utilizando mocks o stubs que simulen tanto respuestas exitosas como todos los escenarios de error definidos en 6.5. No se deben consumir créditos o recursos reales del servicio externo durante las pruebas.

---

## 7. Compliance & Governance

* Toda operación crítica debe mantener trazabilidad.
* Los errores deben registrarse de forma consistente para facilitar monitoreo y soporte.
* Las excepciones deben clasificarse y manejarse de acuerdo con los estándares del proyecto.
* Toda nueva funcionalidad debe respetar los principios definidos en esta constitución.
