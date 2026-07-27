---
markdown
---
inclusion: always
---

# TTP — Plataforma de Adopción Responsable Impulsada por IA

## Propósito

TTP es una plataforma web que centraliza y estandariza el proceso de adopción de mascotas, conectando rescatistas, refugios y personas que desean adoptar. A través de inteligencia artificial, automatiza la generación de perfiles de mascotas y simplifica el flujo de adopción, reduciendo la dispersión de información y los procesos manuales ineficientes.

---

## Problema

Las mascotas en adopción se publican de forma fragmentada en redes sociales y canales informales, con información incompleta, sin estándares y sin un proceso de seguimiento claro. Esto dificulta a los adoptantes encontrar mascotas adecuadas y a los rescatistas gestionar las solicitudes de manera eficiente.

---

## Usuarios Principales

- **Rescatistas independientes** — Personas que rescatan animales de forma voluntaria y necesitan publicarlos rápidamente sin inversión de tiempo elevada.
- **Refugios de animales** — Organizaciones que gestionan múltiples animales y requieren un sistema organizado de registro y seguimiento.
- **Adoptantes potenciales** — Personas que buscan una mascota para adoptar y desean información confiable y completa antes de tomar una decisión.

---

## Alcance del MVP

El MVP debe permitir el flujo completo desde el registro de una mascota hasta la recepción de una solicitud de adopción:

- **Autenticación de usuarios** mediante AWS Cognito (registro, login y gestión de sesión).
- **Registro de mascotas** con datos básicos: nombre, especie, raza, edad, sexo, tamaño y estado de salud.
- **Carga de fotografías** almacenadas en Amazon S3.
- **Generación automática de descripción** del perfil de la mascota usando la API de OpenAI, a partir de los datos ingresados y las imágenes.
- **Catálogo público** de mascotas disponibles, con filtros básicos (especie, tamaño, ubicación).
- **Formulario de solicitud de adopción** que notifica al rescatista o refugio.

---

## Funcionalidades Futuras

- Matching inteligente entre perfiles de adoptantes y mascotas (IA).
- Sistema de mensajería interna entre rescatistas y adoptantes.
- Panel de gestión para refugios (métricas, estados de solicitudes, historial).
- Verificación de identidad para adoptantes.
- Integración con veterinarias para historial médico digital.
- App móvil nativa (iOS / Android).
- Soporte multilenguaje.
- Alertas de mascotas perdidas o encontradas.

---

## Stack Tecnológico

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend/API:** Next.js API Routes + TypeScript
- **ORM y base de datos:** Prisma + PostgreSQL
- **Autenticación:** AWS Cognito
- **Almacenamiento de imágenes:** Amazon S3
- **Inteligencia Artificial:** OpenAI API (GPT-4o o equivalente)

---

## Restricciones

- El MVP no incluye pagos ni procesos legales de adopción; es una plataforma de conexión.
- Las descripciones generadas por IA deben ser revisables por el rescatista antes de publicarse.
- El sistema debe cumplir con buenas prácticas de privacidad de datos (no se almacenan contraseñas; la autenticación está delegada a AWS Cognito).
- Las imágenes deben tener un tamaño máximo definido para controlar costos de S3.
- La generación de descripciones con IA tiene un costo por llamada; se debe limitar el número de regeneraciones por publicación.

---

## Criterios de Éxito

| Criterio | Métrica objetivo (MVP) |
|---|---|
| Mascotas registradas | ≥ 50 perfiles activos al lanzamiento |
| Solicitudes de adopción enviadas | ≥ 20 solicitudes en el primer mes |
| Adopciones concretadas (rastreables) | ≥ 5 en los primeros 3 meses |
| Tiempo de registro de una mascota | < 5 minutos incluyendo descripción por IA |
| Satisfacción de rescatistas | NPS ≥ 40 en encuesta post-onboarding |
| Uptime de la plataforma | ≥ 99.5% mensual |
---