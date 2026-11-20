# 🧩 Easy Prompts — Constructor y Gestor Modular de System Prompts

[![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-222222?style=flat&logo=github)](https://amlc-70.github.io/easy-prompts/)

> **Crea, edita y valida prompts jerárquicos con reglas condicionales, sugerencias Markov y manual descargable en PDF.**

---

## 📋 Descripción del Proyecto

**Easy Prompts** es una aplicación web ligera, modular y de alto rendimiento diseñada como un hub centralizado para la creación, validación, edición y distribución de *system prompts* estructurados (incluyendo formatos JSON y jerárquicos) orientados a agentes de Inteligencia Artificial y flujos de trabajo con LLMs.

Desarrollada sin dependencias pesadas de frameworks externos, la interfaz apuesta por una arquitectura limpia basada en **HTML5**, **CSS3 moderno (inspirado en Bulma)** y **JavaScript Vanilla**, garantizando tiempos de carga instantáneos, compatibilidad total con **GitHub Pages** y una experiencia responsiva adaptada tanto a escritorio como a dispositivos móviles.

---

## ✨ Características Principales

* **🏗️ Arquitectura Jerárquica y Modular:** Organización clara de prompts por categorías y estructuras reutilizables (roles, tonos, variables, reglas condicionales y metadatos).
* **⚡ Validación y Sugerencias Inteligentes:** Herramientas integradas para validar la sintaxis y estructura de los prompts, acompañadas de asistencia predictiva basada en cadenas de Markov.
* **📋 Gestión Rápida (Vista Previa y Copiado):** Inspección inmediata de código formateado (`Fira Code`) mediante modales adaptativos y copiado al portapapeles con un solo clic.
* **📄 Documentación y Manual en PDF:** Acceso directo a guías de uso y manual descargable en formato PDF para facilitar la adopción en equipos y proyectos.
* **📱 Diseño Mobile-First y 3D UI:** Interfaz con componentes estilizados en relieve (`btn-3d`, `input-3d`), menú hamburguesa adaptativo, carruseles multimedia, reproductores integrados y tablas responsivas.
* **🚀 Cero Dependencias de Build:** Funciona de forma nativa en el navegador, ideal para despliegue estático inmediato.

---

## 🗂️ Estructura del Repositorio

```text
easy-prompts/
├── css/
│   └── styles.css       # Hoja de estilos principal (variables, grid, tarjetas, modales y responsive)
├── js/
│   └── app.js           # Lógica de aplicación, carga dinámica, validación, filtros y eventos DOM
├── index.html           # Estructura semántica principal de la interfaz web
├── LICENSE              # Licencia GNU Affero General Public License v3.0 (AGPL-3.0)
└── README.md            # Documentación oficial del proyecto
```

---

## 🛠️ Stack Tecnológico

* **Frontend:** HTML5 Semántico, CSS3 (Grid, Flexbox, Custom Properties) y JavaScript (ES6+ Vanilla).
* **Tipografía:** [Inter](https://fonts.google.com/specimen/Inter) para lectura de interfaz y [Fira Code](https://fonts.google.com/specimen/Fira+Code) para bloques de código y estructuras JSON.
* **Despliegue:** GitHub Pages (Static Web Hosting).

---

## 🚀 Instalación y Uso Local

Al tratarse de una aplicación web estática que utiliza peticiones dinámicas (`fetch`), se recomienda ejecutarla mediante un servidor local para evitar restricciones de política CORS del navegador al abrir archivos con protocolo `file://`.

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/amlc-70/easy-prompts.git
   cd easy-prompts
   ```

2. **Inicia un servidor HTTP local (elige tu opción preferida):**
   * **Con Python 3:**
     ```bash
     python3 -m http.server 8080
     ```
   * **Con Node.js (`npx`):**
     ```bash
     npx serve .
     ```
   * **Con PHP:**
     ```bash
     php -S localhost:8080
     ```

3. **Abre en tu navegador:**
   Visita `http://localhost:8080` para interactuar con la plataforma.

---

## 🌐 Despliegue en Vivo

El proyecto se encuentra desplegado y accesible públicamente a través de GitHub Pages:

👉 **[Ver Demo en Vivo — Easy Prompts](https://amlc-70.github.io/easy-prompts/)**

---

## 🤝 Contribuciones

Las contribuciones, reportes de errores y sugerencias de mejora son bienvenidos. Si deseas colaborar:

1. Haz un **Fork** del proyecto.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m "feat: añade nueva funcionalidad"`).
4. Sube la rama a tu repositorio (`git push origin feature/nueva-funcionalidad`).
5. Abre un **Pull Request** detallando las mejoras propuestas.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **GNU Affero General Public License v3.0 (AGPL-3.0)**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Desarrollado por <a href="https://github.com/amlc-70"><strong>amlc-70</strong></a>
</p>