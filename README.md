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
| HU-2 AC-9 — Límite 3 ciclos reposición | Plan §1 (Flujo general) | TC-08, TC-25 | ✅ |
| Constitution Art. 2 — Seguridad | — | TC-18, TC-21 | ✅ |
| Constitution Art. 3 — Idempotencia | — | TC-17, TC-09 | ✅ |
| Constitution Art. 7 — Trazabilidad | Plan §2 (Auditoría) | TC-16, TC-13, TC-19 | ✅ |
| NFR-4 — Latencia job < 1s | Plan §5 (Trazabilidad) | TC-31 | ✅ |
| NFR-5 — HTTP 429 (Rate Limiting) | Plan §4 (Riesgos) | TC-28 | ✅ |
| NFR-6 — Connection/Read timeout | Plan §4 (Riesgos) | TC-29 | ✅ |

> Matriz completada y validada. Total: 31 casos de prueba (TC-01 a TC-31) cubriendo 17 ACs + 5 casos borde + 6 NFRs + 3 artículos de constitución + Redis indisponible + Carga/volumen.

---

# Gate de Claridad

## Grupo revisor

Equipo L2

## Checklist

| Categoría    | Resultado | Observación breve |
| ------------ | --------- | ----------------- |
| Completitud  | ⚠️ Parcial | Faltan NFR cuantitativos (latencia, RPS), manejo HTTP 429, timeouts y Redis indisponible.
| Claridad     | ⚠️ Parcial | Ambigüedades en trigger (inmediato vs batch), y en la cantidad a solicitar por faltante.
| Consistencia | ⚠️ Parcial | Mezcla de idioma (constitución: inglés técnicos; spec: español). "3 ciclos" aparece en TCs; falta en spec.
| Testabilidad | ✅ Parcial | TCs detallados; faltan cargas/429/timeouts/Redis.

## Hallazgos clave (corregidos)

- Las US y TCs son mayoritariamente medibles (DB counts, estados, invocaciones).  
- **CORREGIDO:** NFRs numéricos agregados (latencia < 1s, NFR-4).  
- **CORREGIDO:** TCs agregados para HTTP 429 (TC-28), connection/read timeouts (TC-29), Redis indisponible (TC-30) y carga/volumen (TC-31).  
- **CORREGIDO:** Trigger definido como batch programado en HU-1 AC-1.  
- **CORREGIDO:** Convención de idioma unificada (términos técnicos en inglés).  

## Acciones realizadas

1. ✅ Añadido en spec.md: NFRs cuantitativos (NFR-4 latencia < 1s), política HTTP 429 (NFR-5) y timeouts (NFR-6).
2. ✅ Incorporado en spec.md: regla "máximo 3 ciclos de reposición" como HU-2 AC-9.
3. ✅ Añadidos TCs: HTTP 429 (TC-28), connection/read timeout (TC-29), Redis indisponible (TC-30), carga/volumen (TC-31).
4. ✅ Convención de idioma definida: términos técnicos en inglés; spec, plan y TCs actualizados.
5. ✅ Trigger de envío definido: batch programado (HU-1 AC-1). Preguntas abiertas resueltas en spec §6.

---

# Historial de refinamiento

El equipo trabajó siguiendo el enfoque Spec-Driven Development (SDD), refinando progresivamente los artefactos mediante iteraciones y revisiones internas entre los roles Product, Tech Lead y QA.

Los cambios y refinamientos pueden consultarse en el historial de commits del repositorio.
