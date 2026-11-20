/*
  Easy Prompts — Validador y Normalizador Jerárquico JSON (amlc-70)
  Copyright (C) 2026 Adrián (amlc / amlc-70)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

"use strict";

(function (global) {
  const SUFIJO_HISTORIAL = "_markov_historial_v1";

  /**
   * Matriz base de transición diseñada para sugerir opciones coherentes
   * según el estado o selección actual ("origen" -> { "destino": peso }).
   */
  const MATRIZ_BASE = {
    "nivel:investigacion": {
      "tono:analitico_critico": 4,
      "tono:tecnico_riguroso": 3,
      "formato:tablas_comparativas": 3,
      "limite:rigor_cero_invencion": 5,
      "limite:rigor_hechos_inferencias": 5,
      "limite:rigor_trazabilidad": 4
    },
    "nivel:desarrollo": {
      "tono:tecnico_riguroso": 4,
      "tono:directo_pragmatico": 4,
      "formato:codigo_completo": 5,
      "formato:json_puro": 2,
      "limite:tecnico_sin_truncar": 5,
      "limite:tecnico_esquema_estricto": 4,
      "limite:tecnico_seguridad_saneamiento": 4
    },
    "nivel:academico": {
      "tono:didactico_guiado": 5,
      "formato:secciones_encabezados": 4,
      "formato:listas_numeradas": 3,
      "limite:rigor_trazabilidad": 4,
      "limite:rigor_hechos_inferencias": 3
    },
    "nivel:profesional": {
      "tono:directo_pragmatico": 4,
      "tono:tecnico_riguroso": 3,
      "formato:listas_numeradas": 3,
      "formato:tablas_comparativas": 3,
      "limite:comportamiento_sin_relleno": 4,
      "limite:etica_control_humano": 4
    },
    "formato:json_puro": {
      "limite:tecnico_esquema_estricto": 6,
      "limite:tecnico_sin_truncar": 4,
      "limite:comportamiento_sin_relleno": 4
    },
    "ia:gemini": {
      "formato:secciones_encabezados": 3,
      "limite:tecnico_esquema_estricto": 3
    },
    "ia:chatgpt": {
      "tono:directo_pragmatico": 3,
      "limite:comportamiento_no_asumir": 3
    },
    "ia:deepseek": {
      "tono:analitico_critico": 4,
      "limite:rigor_hechos_inferencias": 4
    },
    "ia:leonardo": {
      "tono:directo_pragmatico": 4,
      "limite:comportamiento_cierre_alcance": 4
    }
  };

  /**
   * Normaliza el identificador de usuario para construir la clave
   * `<usuario>_markov_historial_v1` de forma segura y predecible.
   */
  function normalizarUsuario(usuario) {
    if (typeof usuario !== "string") {
      return "invitado";
    }
    const limpio = usuario
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return limpio || "invitado";
  }

  function obtenerClaveUsuario(usuario) {
    return `${normalizarUsuario(usuario)}${SUFIJO_HISTORIAL}`;
  }

  function cargarHistorialUsuario(usuario) {
    const clave = obtenerClaveUsuario(usuario);
    try {
      const raw = global.localStorage.getItem(clave);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_err) {
      return {};
    }
  }

  function guardarHistorialUsuario(usuario, historial) {
    const clave = obtenerClaveUsuario(usuario);
    try {
      global.localStorage.setItem(clave, JSON.stringify(historial));
      return true;
    } catch (_err) {
      return false;
    }
  }

  /**
   * Registra una transición s_i -> s_j en el historial local del usuario.
   */
  function registrarTransicion(usuario, estadoOrigen, estadoDestino) {
    if (!estadoOrigen || !estadoDestino || estadoOrigen === estadoDestino) {
      return false;
    }
    const historial = cargarHistorialUsuario(usuario);
    if (!historial[estadoOrigen] || typeof historial[estadoOrigen] !== "object") {
      historial[estadoOrigen] = {};
    }
    const actual = Number(historial[estadoOrigen][estadoDestino]) || 0;
    historial[estadoOrigen][estadoDestino] = actual + 1;
    return guardarHistorialUsuario(usuario, historial);
  }

  /**
   * Registra una secuencia de estados seleccionados en orden.
   */
  function registrarSecuencia(usuario, secuenciaEstados) {
    if (!Array.isArray(secuenciaEstados) || secuenciaEstados.length < 2) {
      return 0;
    }
    let registradas = 0;
    for (let i = 0; i < secuenciaEstados.length - 1; i += 1) {
      if (registrarTransicion(usuario, secuenciaEstados[i], secuenciaEstados[i + 1])) {
        registradas += 1;
      }
    }
    return registradas;
  }

  /**
   * Calcula probabilidades y sugerencias ordenadas a partir de la matriz base
   * combinada con el historial acumulado del usuario activo.
   */
  function obtenerSugerencias(opciones) {
    const cfg = opciones && typeof opciones === "object" ? opciones : {};
    const usuario = normalizarUsuario(cfg.usuario);
    const estadosActivos = Array.isArray(cfg.estadosActivos) ? cfg.estadosActivos : [];
    const excluidos = new Set(Array.isArray(cfg.excluidos) ? cfg.excluidos : []);
    const limiteResultados = Number.isInteger(cfg.limite) && cfg.limite > 0 ? cfg.limite : 5;

    const historial = cargarHistorialUsuario(usuario);
    const acumuladorPesos = {};

    estadosActivos.forEach(function (origen) {
      const baseTransiciones = MATRIZ_BASE[origen] || {};
      const histTransiciones = historial[origen] || {};
      const destinos = new Set([
        ...Object.keys(baseTransiciones),
        ...Object.keys(histTransiciones)
      ]);

      destinos.forEach(function (destino) {
        if (excluidos.has(destino) || estadosActivos.includes(destino)) {
          return;
        }
        const pesoBase = Number(baseTransiciones[destino]) || 0;
        const pesoHist = Number(histTransiciones[destino]) || 0;
        const pesoTotal = pesoBase + pesoHist;
        if (pesoTotal > 0) {
          acumuladorPesos[destino] = (acumuladorPesos[destino] || 0) + pesoTotal;
        }
      });
    });

    const entries = Object.entries(acumuladorPesos);
    const sumaTotal = entries.reduce(function (acc, item) {
      return acc + item[1];
    }, 0);

    if (sumaTotal <= 0) {
      return [];
    }

    return entries
      .map(function (item) {
        const claveDestino = item[0];
        const peso = item[1];
        return {
          clave: claveDestino,
          peso: peso,
          probabilidad: Number((peso / sumaTotal).toFixed(4)),
          porcentaje: Math.round((peso / sumaTotal) * 100)
        };
      })
      .sort(function (a, b) {
        return b.peso - a.peso;
      })
      .slice(0, limiteResultados);
  }

  /**
   * Limpia el historial del usuario indicado o, si `todosLosUsuarios` es true,
   * elimina todas las claves terminadas en `_markov_historial_v1`.
   */
  function limpiarMotor(usuario, todosLosUsuarios) {
    const eliminadas = [];
    try {
      if (todosLosUsuarios === true) {
        const clavesABorrar = [];
        for (let i = 0; i < global.localStorage.length; i += 1) {
          const k = global.localStorage.key(i);
          if (k && k.endsWith(SUFIJO_HISTORIAL)) {
            clavesABorrar.push(k);
          }
        }
        clavesABorrar.forEach(function (k) {
          global.localStorage.removeItem(k);
          eliminadas.push(k);
        });
      } else {
        const clave = obtenerClaveUsuario(usuario);
        global.localStorage.removeItem(clave);
        eliminadas.push(clave);
      }
    } catch (_err) {
      return { ok: false, eliminadas: [] };
    }
    return { ok: true, eliminadas: eliminadas };
  }

  global.MotorMarkov = {
    MATRIZ_BASE: MATRIZ_BASE,
    SUFIJO_HISTORIAL: SUFIJO_HISTORIAL,
    normalizarUsuario: normalizarUsuario,
    obtenerClaveUsuario: obtenerClaveUsuario,
    cargarHistorialUsuario: cargarHistorialUsuario,
    registrarTransicion: registrarTransicion,
    registrarSecuencia: registrarSecuencia,
    obtenerSugerencias: obtenerSugerencias,
    limpiarMotor: limpiarMotor
  };
})(window);
