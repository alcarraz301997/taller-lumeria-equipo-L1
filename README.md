# Taller 2 - Spec + Plan + Pruebas (Three Amigos)

## Equipo L1

### Integrantes

| Integrante                       | Cargo             | Rol Three Amigos |
| -------------------------------- | ----------------- | ---------------- |
| Eduardo Arrieta                  | Product Owner     | Product          |
| Junior Guillermo Alcarraz Montes | Backend Developer | Tech Lead        |
| Melisa Gutiérrez                 | QA Engineer       | QA               |

---

## Feature seleccionada

**Automatización de Preguntas NQ en segundo plano**

### Descripción

Actualmente la generación de preguntas NQ requiere ejecución manual y seguimiento operativo. Esta propuesta busca permitir que la generación se ejecute de manera asíncrona mediante procesamiento en segundo plano, permitiendo al usuario continuar con otras actividades mientras el sistema procesa la solicitud.

Los detalles funcionales se encuentran documentados en:

* `spec.md`
* `plan.md`
* `test-cases.md`
* `constitution.md`

---

# Coverage Matrix

| Requisito | Plan | Casos de prueba | Estado |
|-----------|------|----------------|--------|
| HU-1 AC-1 — Ejecución automática | Plan §2 (Registro de faltantes) | TC-01, TC-15 | ✅ |
| HU-1 AC-2 — FIFO cronológico | Plan §2 (Gestor FIFO) | TC-03 | ✅ |
| HU-1 AC-3 — Cola FIFO | Plan §2 (Gestor FIFO) | TC-03 | ✅ |
| HU-1 AC-4 — Cursos habilitados | Plan §2 (Integración con NQ) | TC-04, TC-10 | ✅ |
| HU-1 AC-5 — Atributos payload | Plan §2 (Integración con NQ) | TC-04 | ✅ |
| HU-1 AC-6 — División por bloques | Plan §1 (Flujo general) | TC-02, TC-20 | ✅ |
| HU-1 AC-7 — API existente | Plan §2 (Integración con NQ) | TC-01, TC-02, TC-05 | ✅ |
| HU-1 AC-8 — Error → PENDING | Plan §1 (Flujo general) | TC-11 | ✅ |
| HU-2 AC-1 — Recepción automática | Plan §2 (Tabla temporal) | TC-05 | ✅ |
| HU-2 AC-2 — Validación duplicidad | Plan §2 (Validador de duplicidad) | TC-05, TC-08, TC-22 | ✅ |
| HU-2 AC-3 — Descarte duplicados | Plan §2 (Validador de duplicidad) | TC-05, TC-08, TC-22 | ✅ |
| HU-2 AC-4 — Reposición automática | Plan §2 (Control de reposición) | TC-08 | ✅ |
| HU-2 AC-5 — Reenvío bajo bloques | Plan §1 (Flujo general) | TC-08, TC-20 | ✅ |
| HU-2 AC-6 — Tabla temporal | Plan §2 (Tabla temporal) | TC-05 | ✅ |
| HU-2 AC-7 — Conservación flujo | Plan §2 (Tabla temporal) | TC-05 | ✅ |
| HU-2 AC-8 — Reintento hasta completar | Plan §2 (Control de reposición) | TC-08 | ✅ |
| Constitution Art. 2 — Seguridad | — | TC-18, TC-21 | ✅ |
| Constitution Art. 3 — Idempotencia | — | TC-17, TC-09 | ✅ |
| Constitution Art. 7 — Trazabilidad | Plan §2 (Auditoría) | TC-16, TC-13, TC-19 | ✅ |

> Matriz completada y validada. Total: 22 casos de prueba cubriendo 16 ACs + 5 casos borde + 3 NFRs + 3 artículos de constitución.

---

# Gate de Claridad

## Grupo revisor

Pendiente

## Checklist

| Categoría    | Resultado |
| ------------ | --------- |
| Completitud  | ✅ |
| Claridad     | ✅ |
| Consistencia | ✅ |
| Testabilidad | ✅ |

## Observaciones

Tres artefactos alineados tras grilling cruzado. 14 roturas detectadas y mitigadas. Spec NEEDS_CLARIFICATION resuelto. Plan actualizado con reposition_cycles, timestamp conservado y flujo FAILED.

## Veredicto

⬜ 🟢 Aprobado

✅ 🟡 Aprobado con observaciones

⬜ 🔴 Requiere correcciones

---

# Historial de refinamiento

El equipo trabajó siguiendo el enfoque Spec-Driven Development (SDD), refinando progresivamente los artefactos mediante iteraciones y revisiones internas entre los roles Product, Tech Lead y QA.

Los cambios y refinamientos pueden consultarse en el historial de commits del repositorio.
