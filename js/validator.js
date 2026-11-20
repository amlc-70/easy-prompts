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
  const ESQUEMA_VERSION = "1.0.0";
  const MAX_CARACTERES_JSON = 262144; // 256 KiB de entrada máxima para proteger memoria

  const GUIAS_PROVEEDOR = Object.freeze({
    gemini: [
      "Usar delimitadores consistentes (etiquetas XML o encabezados Markdown) y ubicar instrucciones o anclas claras.",
      "Definir esquema estructurado estricto cuando se solicite JSON y validar siempre los valores."
    ],
    chatgpt: [
      "Colocar la instrucción principal al inicio y separar contexto o datos con delimitadores claros.",
      "Ser específico en el resultado esperado y en los criterios de aceptación antes de iterar."
    ],
    deepseek: [
      "Especificar criterios observables, restricciones no negociables y condiciones de fallo o contraejemplos.",
      "Alinear el nivel de detalle con la complejidad real del problema y el modo de respuesta."
    ],
    leonardo: [
      "Describir atributos visuales concretos (sujeto, composición, iluminación, estilo) sin depender de frases conversacionales.",
      "Separar las exclusiones o elementos no deseados en lugar de redactar negaciones ambiguas en el prompt principal."
    ],
    otra: [
      "Declarar explícitamente el formato de salida, las restricciones de alcance y los criterios de verificación."
    ]
  });

  const SUGERENCIAS_INVESTIGACION = Object.freeze([
    "Separar explícitamente hechos verificados, inferencias/hipótesis y zonas de incertidumbre.",
    "Exigir trazabilidad, criterios de falsabilidad y contraejemplos antes de cerrar conclusiones.",
    "Prohibir la fabricación de fuentes, citas, métricas o referencias inexistentes."
  ]);

  function limpiarTexto(valor) {
    if (typeof valor !== "string") {
      return "";
    }
    return valor.replace(/\r\n/g, "\n").trim();
  }

  function limpiarArregloTexto(lista) {
    if (!Array.isArray(lista)) {
      return [];
    }
    const vistos = new Set();
    const resultado = [];
    for (let i = 0; i < lista.length; i += 1) {
      const texto = limpiarTexto(String(lista[i] || ""));
      if (texto && !vistos.has(texto)) {
        vistos.add(texto);
        resultado.push(texto);
      }
    }
    return resultado;
  }

  /**
   * Evalúa reglas condicionales derivadas del estado del formulario:
   * - Si formato incluye "json_puro", bloquea otros formatos.
   * - Si nivel es "investigacion", activa sugerencias y guías de rigor epistémico.
   * - Resuelve idioma de instancia si no está diferenciado.
   */
  function evaluarCondicionales(estado) {
    const datos = estado && typeof estado === "object" ? estado : {};
    const formatosActuales = limpiarArregloTexto(datos.formato_salida);
    const jsonExclusivo = formatosActuales.includes("json_puro");
    const formatoSalidaEfectivo = jsonExclusivo ? ["json_puro"] : formatosActuales;

    const nivel = limpiarTexto(datos.nivel_instancia).toLowerCase();
    const modoInvestigacion = nivel === "investigacion";

    const iaSeleccionada = limpiarTexto(datos.ia_tipo).toLowerCase() || "otra";
    const requiereIaPersonalizada = iaSeleccionada === "otra";

    const diferenciarIdioma = Boolean(datos.diferenciar_idioma);
    const idiomaPrompt = limpiarTexto(datos.idioma_prompt) || "es";
    const idiomaInstancia = diferenciarIdioma
      ? (limpiarTexto(datos.idioma_instancia) || idiomaPrompt)
      : idiomaPrompt;

    const modoNombre = limpiarTexto(datos.modo_nombre_ia) || "ninguno";
    const requiereNombreIa = modoNombre === "asignado";

    const baseGuias = GUIAS_PROVEEDOR[iaSeleccionada] || GUIAS_PROVEEDOR.otra;
    const guiasProveedor = modoInvestigacion
      ? baseGuias.concat(SUGERENCIAS_INVESTIGACION)
      : baseGuias.slice();

    return {
      json_exclusivo: jsonExclusivo,
      bloquear_otros_formatos: jsonExclusivo,
      formato_salida_efectivo: formatoSalidaEfectivo,
      modo_investigacion_activo: modoInvestigacion,
      sugerencias_investigacion: modoInvestigacion ? SUGERENCIAS_INVESTIGACION.slice() : [],
      requiere_ia_personalizada: requiereIaPersonalizada,
      requiere_nombre_ia: requiereNombreIa,
      idioma_prompt: idiomaPrompt,
      idioma_instancia: idiomaInstancia,
      guias_proveedor_aplicadas: guiasProveedor
    };
  }

  /**
   * Valida los campos obligatorios principales del modelo.
   */
  function validarEstado(estado) {
    const datos = estado && typeof estado === "object" ? estado : {};
    const cond = evaluarCondicionales(datos);
    const errores = [];

    const iaTipo = limpiarTexto(datos.ia_tipo);
    if (!iaTipo) {
      errores.push("Debes seleccionar el tipo de IA a utilizar.");
    }
    if (cond.requiere_ia_personalizada && !limpiarTexto(datos.ia_personalizada)) {
      errores.push("Seleccionaste 'Otra' IA: debes especificar cuál.");
    }
    if (!cond.idioma_prompt) {
      errores.push("Debes seleccionar el idioma del prompt.");
    }
    if (!limpiarTexto(datos.nivel_instancia)) {
      errores.push("Debes seleccionar el nivel de la instancia.");
    }

    const tiposApp = limpiarArregloTexto(datos.tipos_aplicacion_web);
    if (tiposApp.length === 0) {
      errores.push("Debes marcar al menos un tipo de desarrollo o aplicación web.");
    }

    if (!limpiarTexto(datos.objetivo_principal)) {
      errores.push("El objetivo principal del trabajo es obligatorio.");
    }
    if (cond.requiere_nombre_ia && !limpiarTexto(datos.nombre_ia)) {
      errores.push("Seleccionaste nombre asignado para la IA: debes indicar el nombre.");
    }
    if (!limpiarTexto(datos.rol_ia)) {
      errores.push("El rol o persona de la IA es obligatorio.");
    }
    if (!limpiarTexto(datos.tono_estilo)) {
      errores.push("El tono o estilo de comunicación es obligatorio.");
    }
    if (!limpiarTexto(datos.nivel_profundidad)) {
      errores.push("El nivel de profundidad de la respuesta es obligatorio.");
    }
    if (cond.formato_salida_efectivo.length === 0) {
      errores.push("Debes elegir al menos un formato de salida.");
    }

    const totalLimites =
      limpiarArregloTexto(datos.rigor_epistemico).length +
      limpiarArregloTexto(datos.etica_y_control_humano).length +
      limpiarArregloTexto(datos.limites_tecnicos).length +
      limpiarArregloTexto(datos.comportamiento_y_formato).length +
      limpiarArregloTexto(datos.limites_personalizados).length;

    if (totalLimites === 0) {
      errores.push("Debes definir al menos un límite crítico, ético, técnico o de comportamiento.");
    }

    return {
      valido: errores.length === 0,
      errores: errores,
      condicionales: cond
    };
  }

  /**
   * Normaliza un objeto importado para garantizar que cumpla la estructura
   * jerárquica de Easy Prompts sin alterar tipos esperados.
   */
  function normalizarEstructuraImportada(rawData, cambios) {
    const listaCambios = Array.isArray(cambios) ? cambios : [];
    if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
      return {
        ok: false,
        error: "La raíz del JSON debe ser un objeto jerárquico válido."
      };
    }

    const meta = rawData.metadata && typeof rawData.metadata === "object" ? rawData.metadata : {};
    const idIa = rawData.identidad_ia && typeof rawData.identidad_ia === "object" ? rawData.identidad_ia : {};
    const trabajo = rawData.trabajo && typeof rawData.trabajo === "object" ? rawData.trabajo : {};
    const limites = rawData.limites && typeof rawData.limites === "object" ? rawData.limites : {};

    const formatosRaw = limpiarArregloTexto(idIa.formato_salida);
    const tieneJsonPuro = formatosRaw.includes("json_puro");
    const formatosNormalizados = tieneJsonPuro ? ["json_puro"] : formatosRaw;
    if (tieneJsonPuro && formatosRaw.length > 1) {
      listaCambios.push("Se aplicó exclusividad de 'json_puro' descartando formatos adicionales.");
    }

    const limitesPers = Array.isArray(limites.limites_personalizados)
      ? limpiarArregloTexto(limites.limites_personalizados)
      : limpiarArregloTexto(
          typeof limites.limites_personalizados === "string"
            ? limites.limites_personalizados.split(/\n+/)
            : []
        );

    const normalizado = {
      _comentario: limpiarTexto(rawData._comentario) || "Objeto jerárquico de configuración de prompt para ejecución controlada",
      metadata: {
        _comentario: limpiarTexto(meta._comentario) || "Parámetros de entorno, idioma, nivel de instancia y guías del proveedor",
        version_esquema: limpiarTexto(meta.version_esquema) || ESQUEMA_VERSION,
        proveedor_ia: limpiarTexto(meta.proveedor_ia),
        idioma_prompt: limpiarTexto(meta.idioma_prompt) || "es",
        idioma_instancia: limpiarTexto(meta.idioma_instancia) || limpiarTexto(meta.idioma_prompt) || "es",
        nivel_instancia: limpiarTexto(meta.nivel_instancia),
        guias_proveedor_aplicadas: limpiarArregloTexto(meta.guias_proveedor_aplicadas)
      },
      identidad_ia: {
        _comentario: limpiarTexto(idIa._comentario) || "Identidad nominal, rol, estilo comunicativo, profundidad y formato de respuesta",
        modo_nombre: limpiarTexto(idIa.modo_nombre) || "ninguno",
        nombre_ia: idIa.nombre_ia ? limpiarTexto(String(idIa.nombre_ia)) : null,
        instruccion_nombre: idIa.instruccion_nombre ? limpiarTexto(String(idIa.instruccion_nombre)) : null,
        rol: limpiarTexto(idIa.rol),
        especializacion: limpiarTexto(idIa.especializacion),
        tono_estilo: limpiarTexto(idIa.tono_estilo),
        nivel_profundidad: limpiarTexto(idIa.nivel_profundidad),
        formato_salida: formatosNormalizados
      },
      trabajo: {
        _comentario: limpiarTexto(trabajo._comentario) || "Definición del desarrollo web, objetivo, contexto y entregables esperados",
        tipos_aplicacion_web: limpiarArregloTexto(trabajo.tipos_aplicacion_web),
        objetivo_principal: limpiarTexto(trabajo.objetivo_principal),
        contexto_entorno: limpiarTexto(trabajo.contexto_entorno),
        entregables_esperados: limpiarArregloTexto(trabajo.entregables_esperados),
        criterios_exclusion: limpiarTexto(trabajo.criterios_exclusion)
      },
      limites: {
        _comentario: limpiarTexto(limites._comentario) || "Restricciones críticas de veracidad, ética/control humano, arquitectura y conducta",
        rigor_epistemico: limpiarArregloTexto(limites.rigor_epistemico),
        etica_y_control_humano: limpiarArregloTexto(limites.etica_y_control_humano),
        limites_tecnicos: limpiarArregloTexto(limites.limites_tecnicos),
        comportamiento_y_formato: limpiarArregloTexto(limites.comportamiento_y_formato),
        limites_personalizados: limitesPers
      }
    };

    return { ok: true, data: normalizado };
  }

  /**
   * Convierte cadenas delimitadas por comillas simples '...' a comillas dobles "..."
   * fuera de cadenas delimitadas por comillas dobles ya existentes.
   */
  function convertirComillasSimplesADobles(texto) {
    let salida = "";
    let enDoble = false;
    let enSimple = false;
    let escape = false;
    let seConvirtio = false;

    for (let i = 0; i < texto.length; i += 1) {
      const ch = texto[i];

      if (enDoble) {
        salida += ch;
        if (escape) {
          escape = false;
        } else if (ch === "\\") {
          escape = true;
        } else if (ch === '"') {
          enDoble = false;
        }
        continue;
      }

      if (enSimple) {
        if (escape) {
          salida += ch === "'" ? "'" : ch;
          escape = false;
        } else if (ch === "\\") {
          escape = true;
          salida += "\\";
        } else if (ch === "'") {
          enSimple = false;
          salida += '"';
          seConvirtio = true;
        } else if (ch === '"') {
          salida += '\\"';
        } else {
          salida += ch;
        }
        continue;
      }

      if (ch === '"') {
        enDoble = true;
        salida += ch;
      } else if (ch === "'") {
        enSimple = true;
        salida += '"';
        seConvirtio = true;
      } else {
        salida += ch;
      }
    }

    return { texto: salida, convertido: seConvirtio };
  }

  /**
   * Intenta parsear JSON estricto; si falla, aplica correcciones seguras
   * (comillas curvas/simples, comentarios // o /* *, comas colgantes) y normaliza esquema.
   */
  function analizarYCorregirJson(textoEntrada) {
    const original = typeof textoEntrada === "string" ? textoEntrada : "";
    const trimmed = original.trim();
    if (!trimmed) {
      return {
        ok: false,
        corregido: false,
        data: null,
        cambios: [],
        error: "La entrada JSON está vacía."
      };
    }

    if (trimmed.length > MAX_CARACTERES_JSON) {
      return {
        ok: false,
        corregido: false,
        data: null,
        cambios: [],
        error: `El JSON excede el límite de seguridad (${MAX_CARACTERES_JSON} caracteres).`
      };
    }

    try {
      const directo = JSON.parse(trimmed);
      const cambiosDirectos = [];
      const normDirecta = normalizarEstructuraImportada(directo, cambiosDirectos);
      if (!normDirecta.ok) {
        return {
          ok: false,
          corregido: false,
          data: null,
          cambios: [],
          error: normDirecta.error
        };
      }
      return {
        ok: true,
        corregido: cambiosDirectos.length > 0,
        data: normDirecta.data,
        cambios: cambiosDirectos,
        error: null
      };
    } catch (_errDirecto) {
      // Continuar hacia autocorrección asistida
    }

    const cambios = [];
    let candidato = trimmed;

    // 1. Comillas tipográficas curvas dobles -> rectas dobles
    const sinCurvasDobles = candidato.replace(/[\u201C\u201D]/g, '"');
    if (sinCurvasDobles !== candidato) {
      candidato = sinCurvasDobles;
      cambios.push("Se normalizaron comillas tipográficas curvas a comillas rectas.");
    }

    // 2. Eliminar comentarios de bloque /* ... */ y de línea // ... fuera de cadenas
    let sinComentarios = "";
    let enCadena = false;
    let comillaActiva = "";
    let escapeActivo = false;
    let seQuitoComentario = false;

    for (let i = 0; i < candidato.length; i += 1) {
      const ch = candidato[i];
      const sig = candidato[i + 1];

      if (enCadena) {
        sinComentarios += ch;
        if (escapeActivo) {
          escapeActivo = false;
        } else if (ch === "\\") {
          escapeActivo = true;
        } else if (ch === comillaActiva) {
          enCadena = false;
          comillaActiva = "";
        }
        continue;
      }

      if (ch === '"' || ch === "'") {
        enCadena = true;
        comillaActiva = ch;
        sinComentarios += ch;
        continue;
      }

      if (ch === "/" && sig === "*") {
        const cierre = candidato.indexOf("*/", i + 2);
        if (cierre !== -1) {
          i = cierre + 1;
          seQuitoComentario = true;
          continue;
        }
      }

      if (ch === "/" && sig === "/") {
        const finLinea = candidato.indexOf("\n", i + 2);
        if (finLinea !== -1) {
          i = finLinea - 1;
        } else {
          i = candidato.length - 1;
        }
        seQuitoComentario = true;
        continue;
      }

      sinComentarios += ch;
    }

    if (seQuitoComentario) {
      candidato = sinComentarios;
      cambios.push("Se retiraron comentarios no estándar (// o /* */) para cumplir JSON estricto.");
    }

    // 3. Normalizar comillas simples curvas/rectas usadas como delimitadores
    const sinCurvasSimples = candidato.replace(/[\u2018\u2019]/g, "'");
    const resSimples = convertirComillasSimplesADobles(sinCurvasSimples);
    if (resSimples.convertido || sinCurvasSimples !== candidato) {
      candidato = resSimples.texto;
      cambios.push("Se convirtieron comillas simples delimitadoras a comillas dobles estándar.");
    }

    // 4. Eliminar comas finales colgantes antes de } o ]
    const sinComasColgantes = candidato.replace(/,\s*([}\]])/g, "$1");
    if (sinComasColgantes !== candidato) {
      candidato = sinComasColgantes;
      cambios.push("Se eliminaron comas finales antes de '}' o ']'.");
    }

    try {
      const recuperado = JSON.parse(candidato);
      const normRecuperada = normalizarEstructuraImportada(recuperado, cambios);
      if (!normRecuperada.ok) {
        return {
          ok: false,
          corregido: false,
          data: null,
          cambios: cambios,
          error: normRecuperada.error
        };
      }
      return {
        ok: true,
        corregido: cambios.length > 0,
        data: normRecuperada.data,
        cambios: cambios,
        error: null
      };
    } catch (errFinal) {
      return {
        ok: false,
        corregido: false,
        data: null,
        cambios: cambios,
        error: errFinal && errFinal.message ? errFinal.message : "Error de sintaxis JSON."
      };
    }
  }

  global.ValidadorPrompt = {
    ESQUEMA_VERSION: ESQUEMA_VERSION,
    MAX_CARACTERES_JSON: MAX_CARACTERES_JSON,
    GUIAS_PROVEEDOR: GUIAS_PROVEEDOR,
    SUGERENCIAS_INVESTIGACION: SUGERENCIAS_INVESTIGACION,
    limpiarTexto: limpiarTexto,
    limpiarArregloTexto: limpiarArregloTexto,
    evaluarCondicionales: evaluarCondicionales,
    validarEstado: validarEstado,
    normalizarEstructuraImportada: normalizarEstructuraImportada,
    analizarYCorregirJson: analizarYCorregirJson
  };
})(window);
