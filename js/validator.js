"use strict";

(function (global) {
  const ESQUEMA_VERSION = "1.0.0";

  const GUIAS_PROVEEDOR = {
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
  };

  const SUGERENCIAS_INVESTIGACION = [
    "Separar explícitamente hechos verificados, inferencias/hipótesis y zonas de incertidumbre.",
    "Exigir trazabilidad, criterios de falsabilidad y contraejemplos antes de cerrar conclusiones.",
    "Prohibir la fabricación de fuentes, citas, métricas o referencias inexistentes."
  ];

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
    lista.forEach(function (item) {
      const texto = limpiarTexto(String(item || ""));
      if (texto && !vistos.has(texto)) {
        vistos.add(texto);
        resultado.push(texto);
      }
    });
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

    const guiasProveedor = [
      ...(GUIAS_PROVEEDOR[iaSeleccionada] || GUIAS_PROVEEDOR.otra),
      ...(modoInvestigacion ? SUGERENCIAS_INVESTIGACION : [])
    ];

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
   * Intenta parsear JSON estricto; si falla, aplica correcciones seguras
   * (comentarios // o /* */, comas colgantes, comillas tipográficas) y reporta.
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

    try {
      const directo = JSON.parse(trimmed);
      return {
        ok: true,
        corregido: false,
        data: directo,
        cambios: [],
        error: null
      };
    } catch (_errDirecto) {
      // Continuar hacia autocorrección asistida
    }

    const cambios = [];
    let candidato = trimmed;

    // 1. Comillas tipográficas curvas -> rectas
    const sinCurvas = candidato
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");
    if (sinCurvas !== candidato) {
      candidato = sinCurvas;
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

    // 3. Eliminar comas finales colgantes antes de } o ]
    const sinComasColgantes = candidato.replace(/,\s*([}\]])/g, "$1");
    if (sinComasColgantes !== candidato) {
      candidato = sinComasColgantes;
      cambios.push("Se eliminaron comas finales antes de '}' o ']'.");
    }

    try {
      const recuperado = JSON.parse(candidato);
      return {
        ok: true,
        corregido: cambios.length > 0,
        data: recuperado,
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
    GUIAS_PROVEEDOR: GUIAS_PROVEEDOR,
    SUGERENCIAS_INVESTIGACION: SUGERENCIAS_INVESTIGACION,
    limpiarTexto: limpiarTexto,
    limpiarArregloTexto: limpiarArregloTexto,
    evaluarCondicionales: evaluarCondicionales,
    validarEstado: validarEstado,
    analizarYCorregirJson: analizarYCorregirJson
  };
})(window);