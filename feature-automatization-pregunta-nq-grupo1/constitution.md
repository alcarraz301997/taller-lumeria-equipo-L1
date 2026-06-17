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

* Toda funcionalidad nueva debe incluir pruebas automatizadas cuando sea viable.
* Los escenarios críticos de negocio deben ser verificables mediante casos de prueba.
* Las integraciones externas deben contemplar escenarios exitosos y de error.
* Las pruebas deben cubrir casos borde y escenarios de concurrencia cuando aplique.

---

## 7. Compliance & Governance

* Toda operación crítica debe mantener trazabilidad.
* Los errores deben registrarse de forma consistente para facilitar monitoreo y soporte.
* Las excepciones deben clasificarse y manejarse de acuerdo con los estándares del proyecto.
* Toda nueva funcionalidad debe respetar los principios definidos en esta constitución.
