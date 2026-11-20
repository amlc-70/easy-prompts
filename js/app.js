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
  const doc = global.document;

  function mostrarDiagnostico(mensaje, detalleJson) {
    const aviso = doc.getElementById("estado_validacion");
    const areaJson = doc.getElementById("salida_json");
    if (aviso) {
      aviso.textContent = mensaje;
    }
    if (areaJson && typeof detalleJson === "string") {
      areaJson.value = detalleJson;
    }
  }

  global.addEventListener("error", function (event) {
    const msg = event && event.message ? event.message : "Error de script";
    const src = event && event.filename ? ` (${event.filename}:${event.lineno || 0})` : "";
    mostrarDiagnostico(`❌ Error JS${src}: ${msg}`);
  });

  function leerValoresCheckbox(nombreCampo) {
    const nodos = doc.querySelectorAll(`input[type="checkbox"][name="${nombreCampo}"]:checked`);
    return Array.from(nodos).map(function (el) {
      return el.value;
    });
  }

  function leerRadio(nombreCampo, porDefecto) {
    const marcado = doc.querySelector(`input[type="radio"][name="${nombreCampo}"]:checked`);
    return marcado ? marcado.value : porDefecto;
  }

  function leerValorPorId(id) {
    const el = doc.getElementById(id);
    return el ? el.value : "";
  }

  function leerCheckedPorId(id) {
    const el = doc.getElementById(id);
    return el ? Boolean(el.checked) : false;
  }

  function escribirValorPorId(id, valor) {
    const el = doc.getElementById(id);
    if (el) {
      el.value = valor == null ? "" : String(valor);
    }
  }

  function escribirCheckedPorId(id, checked) {
    const el = doc.getElementById(id);
    if (el) {
      el.checked = Boolean(checked);
    }
  }

  function marcarCheckboxesPorValores(nombreCampo, valores) {
    const setValores = new Set(Array.isArray(valores) ? valores : []);
    const nodos = doc.querySelectorAll(`input[type="checkbox"][name="${nombreCampo}"]`);
    nodos.forEach(function (el) {
      el.checked = setValores.has(el.value);
    });
  }

  function recolectarEstadoFormulario() {
    const limitesTexto = leerValorPorId("limites_personalizados")
      .split(/\n+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);

    return {
      usuario_motor: leerValorPorId("usuario_motor") || "invitado",
      ia_tipo: leerValorPorId("ia_tipo"),
      ia_personalizada: leerValorPorId("ia_personalizada"),
      idioma_prompt: leerValorPorId("idioma_prompt") || "es",
      diferenciar_idioma: leerCheckedPorId("diferenciar_idioma"),
      idioma_instancia: leerValorPorId("idioma_instancia") || "es",
      nivel_instancia: leerValorPorId("nivel_instancia"),
      tipos_aplicacion_web: leerValoresCheckbox("tipos_aplicacion_web"),
      objetivo_principal: leerValorPorId("objetivo_principal"),
      contexto_entorno: leerValorPorId("contexto_entorno"),
      entregables_esperados: leerValoresCheckbox("entregables_esperados"),
      criterios_exclusion: leerValorPorId("criterios_exclusion"),
      modo_nombre_ia: leerRadio("modo_nombre_ia", "ninguno"),
      nombre_ia: leerValorPorId("nombre_ia"),
      rol_ia: leerValorPorId("rol_ia"),
      especializacion_ia: leerValorPorId("especializacion_ia"),
      tono_estilo: leerValorPorId("tono_estilo"),
      nivel_profundidad: leerValorPorId("nivel_profundidad"),
      formato_salida: leerValoresCheckbox("formato_salida"),
      rigor_epistemico: leerValoresCheckbox("rigor_epistemico"),
      etica_y_control_humano: leerValoresCheckbox("etica_y_control_humano"),
      limites_tecnicos: leerValoresCheckbox("limites_tecnicos"),
      comportamiento_y_formato: leerValoresCheckbox("comportamiento_y_formato"),
      limites_personalizados: limitesTexto
    };
  }

  function construirObjetoPromptJerarquico(estado) {
    const val = global.ValidadorPrompt;
    const limpiarTexto = val && val.limpiarTexto
      ? val.limpiarTexto
      : function (v) { return typeof v === "string" ? v.trim() : ""; };
    const limpiarArreglo = val && val.limpiarArregloTexto
      ? val.limpiarArregloTexto
      : function (a) { return Array.isArray(a) ? a.filter(Boolean) : []; };
    const cond = val && val.evaluarCondicionales
      ? val.evaluarCondicionales(estado)
      : {
          json_exclusivo: estado.formato_salida.includes("json_puro"),
          formato_salida_efectivo: estado.formato_salida.includes("json_puro")
            ? ["json_puro"]
            : estado.formato_salida,
          modo_investigacion_activo: String(estado.nivel_instancia || "").toLowerCase() === "investigacion",
          requiere_ia_personalizada: String(estado.ia_tipo || "").toLowerCase() === "otra",
          idioma_prompt: estado.idioma_prompt || "es",
          idioma_instancia: estado.idioma_instancia || estado.idioma_prompt || "es",
          guias_proveedor_aplicadas: []
        };

    const iaTipo = limpiarTexto(estado.ia_tipo);
    const iaFinal = cond.requiere_ia_personalizada
      ? limpiarTexto(estado.ia_personalizada)
      : iaTipo;

    const modoNombre = limpiarTexto(estado.modo_nombre_ia) || "ninguno";
    const nombreAsignado =
      modoNombre === "asignado" ? limpiarTexto(estado.nombre_ia) : null;

    return {
      _comentario: "Objeto jerárquico de configuración de prompt para ejecución controlada",
      metadata: {
        _comentario: "Parámetros de entorno, idioma, nivel de instancia y guías del proveedor",
        version_esquema: (val && val.ESQUEMA_VERSION) || "1.0.0",
        proveedor_ia: iaFinal,
        idioma_prompt: cond.idioma_prompt,
        idioma_instancia: cond.idioma_instancia,
        nivel_instancia: limpiarTexto(estado.nivel_instancia),
        guias_proveedor_aplicadas: cond.guias_proveedor_aplicadas
      },
      identidad_ia: {
        _comentario: "Identidad nominal, rol, estilo comunicativo, profundidad y formato de respuesta",
        modo_nombre: modoNombre,
        nombre_ia: nombreAsignado,
        instruccion_nombre:
          modoNombre === "autogenerado"
            ? "Elegir un nombre propio coherente con el rol, nivel y dominio configurados y presentarse con él."
            : null,
        rol: limpiarTexto(estado.rol_ia),
        especializacion: limpiarTexto(estado.especializacion_ia),
        tono_estilo: limpiarTexto(estado.tono_estilo),
        nivel_profundidad: limpiarTexto(estado.nivel_profundidad),
        formato_salida: cond.formato_salida_efectivo
      },
      trabajo: {
        _comentario: "Definición del desarrollo web, objetivo, contexto y entregables esperados",
        tipos_aplicacion_web: limpiarArreglo(estado.tipos_aplicacion_web),
        objetivo_principal: limpiarTexto(estado.objetivo_principal),
        contexto_entorno: limpiarTexto(estado.contexto_entorno),
        entregables_esperados: limpiarArreglo(estado.entregables_esperados),
        criterios_exclusion: limpiarTexto(estado.criterios_exclusion)
      },
      limites: {
        _comentario: "Restricciones críticas de veracidad, ética/control humano, arquitectura y conducta",
        rigor_epistemico: limpiarArreglo(estado.rigor_epistemico),
        etica_y_control_humano: limpiarArreglo(estado.etica_y_control_humano),
        limites_tecnicos: limpiarArreglo(estado.limites_tecnicos),
        comportamiento_y_formato: limpiarArreglo(estado.comportamiento_y_formato),
        limites_personalizados: limpiarArreglo(estado.limites_personalizados)
      },
      condicionales_activos: {
        _comentario: "Estado de reglas condicionales activadas durante la construcción",
        json_exclusivo: cond.json_exclusivo,
        modo_investigacion_activo: cond.modo_investigacion_activo
      }
    };
  }

  function aplicarReglasVisuales(estado) {
    const val = global.ValidadorPrompt;
    if (!val || typeof val.evaluarCondicionales !== "function") {
      return;
    }
    const cond = val.evaluarCondicionales(estado);

    const campoIaOtra = doc.getElementById("grupo_ia_personalizada");
    if (campoIaOtra) {
      campoIaOtra.hidden = !cond.requiere_ia_personalizada;
    }

    const selIdiomaInstancia = doc.getElementById("idioma_instancia");
    if (selIdiomaInstancia) {
      selIdiomaInstancia.disabled = !estado.diferenciar_idioma;
      if (!estado.diferenciar_idioma) {
        selIdiomaInstancia.value = cond.idioma_prompt;
      }
    }

    const grupoNombreIa = doc.getElementById("grupo_nombre_ia");
    if (grupoNombreIa) {
      grupoNombreIa.hidden = !cond.requiere_nombre_ia;
    }

    const checksFormato = doc.querySelectorAll('input[type="checkbox"][name="formato_salida"]');
    checksFormato.forEach(function (chk) {
      if (chk.value !== "json_puro") {
        if (cond.bloquear_otros_formatos) {
          chk.checked = false;
          chk.disabled = true;
        } else {
          chk.disabled = false;
        }
      }
    });

    const panelInvestigacion = doc.getElementById("panel_sugerencias_investigacion");
    if (panelInvestigacion) {
      panelInvestigacion.hidden = !cond.modo_investigacion_activo;
      const lista = panelInvestigacion.querySelector("ul");
      if (lista) {
        lista.innerHTML = "";
        cond.sugerencias_investigacion.forEach(function (texto) {
          const li = doc.createElement("li");
          li.textContent = texto;
          lista.appendChild(li);
        });
      }
    }

    if (cond.modo_investigacion_activo && estado.rigor_epistemico.length === 0) {
      const chkRigor = doc.querySelector(
        'input[type="checkbox"][name="rigor_epistemico"][value="Cero invención de datos"]'
      );
      if (chkRigor) {
        chkRigor.checked = true;
      }
    }
  }

  function renderizarSugerenciasMarkov(estado) {
    const contenedor = doc.getElementById("sugerencias_markov");
    if (!contenedor) {
      return;
    }
    if (!global.MotorMarkov || typeof global.MotorMarkov.obtenerSugerencias !== "function") {
      contenedor.innerHTML = "<li>MotorMarkov no cargado en esta página.</li>";
      return;
    }

    const estadosActivos = [];
    if (estado.nivel_instancia) {
      estadosActivos.push(`nivel:${estado.nivel_instancia.toLowerCase()}`);
    }
    if (estado.ia_tipo) {
      estadosActivos.push(`ia:${estado.ia_tipo.toLowerCase()}`);
    }
    if (estado.formato_salida.includes("json_puro")) {
      estadosActivos.push("formato:json_puro");
    }

    const sugerencias = global.MotorMarkov.obtenerSugerencias({
      usuario: estado.usuario_motor,
      estadosActivos: estadosActivos,
      limite: 5
    });

    contenedor.innerHTML = "";
    if (sugerencias.length === 0) {
      const li = doc.createElement("li");
      li.textContent = "Selecciona Nivel, IA o Formato para ver sugerencias Markov.";
      contenedor.appendChild(li);
      return;
    }

    sugerencias.forEach(function (item) {
      const li = doc.createElement("li");
      li.textContent = `${item.clave} (${item.porcentaje}% afinidad)`;
      contenedor.appendChild(li);
    });
  }

  function actualizarVistaPrevia(forzarMensajeExito) {
    try {
      const estadoInicial = recolectarEstadoFormulario();
      aplicarReglasVisuales(estadoInicial);
      const estadoActualizado = recolectarEstadoFormulario();

      const validacion =
        global.ValidadorPrompt && typeof global.ValidadorPrompt.validarEstado === "function"
          ? global.ValidadorPrompt.validarEstado(estadoActualizado)
          : { valido: false, errores: ["ValidadorPrompt no disponible"] };

      const objetoJson = construirObjetoPromptJerarquico(estadoActualizado);
      const jsonFormateado = JSON.stringify(objetoJson, null, 2);

      const salidaJson = doc.getElementById("salida_json");
      if (salidaJson) {
        salidaJson.value = jsonFormateado;
      }

      const estadoValidacion = doc.getElementById("estado_validacion");
      if (estadoValidacion) {
        if (validacion.valido) {
          estadoValidacion.textContent = forzarMensajeExito
            ? "✅ JSON generado y validado correctamente. Listo para copiar o descargar."
            : "✅ JSON válido y campos obligatorios completos.";
        } else {
          estadoValidacion.textContent = forzarMensajeExito
            ? `⚠️ JSON generado con campos pendientes: ${validacion.errores.join(" | ")}`
            : `Pendiente: ${validacion.errores.join(" | ")}`;
        }
      }

      renderizarSugerenciasMarkov(estadoActualizado);
      return { validacion: validacion, jsonTexto: jsonFormateado, estado: estadoActualizado };
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      mostrarDiagnostico(`❌ Error al actualizar JSON: ${msg}`);
      return { validacion: { valido: false, errores: [msg] }, jsonTexto: "", estado: {} };
    }
  }

  function cargarEstadoEnFormulario(datos) {
    if (!datos || typeof datos !== "object") {
      return;
    }
    const meta = datos.metadata || {};
    const idIa = datos.identidad_ia || {};
    const trabajo = datos.trabajo || {};
    const limites = datos.limites || {};

    if (meta.proveedor_ia) {
      const selIa = doc.getElementById("ia_tipo");
      const existeOpcion = selIa
        ? Array.from(selIa.options).some(function (opt) {
            return opt.value === meta.proveedor_ia;
          })
        : false;
      if (existeOpcion) {
        escribirValorPorId("ia_tipo", meta.proveedor_ia);
        escribirValorPorId("ia_personalizada", "");
      } else {
        escribirValorPorId("ia_tipo", "otra");
        escribirValorPorId("ia_personalizada", meta.proveedor_ia);
      }
    }

    if (meta.idioma_prompt) {
      escribirValorPorId("idioma_prompt", meta.idioma_prompt);
    }
    if (meta.idioma_instancia) {
      const dif = meta.idioma_instancia !== meta.idioma_prompt;
      escribirCheckedPorId("diferenciar_idioma", dif);
      escribirValorPorId("idioma_instancia", meta.idioma_instancia);
    }
    if (meta.nivel_instancia) {
      escribirValorPorId("nivel_instancia", meta.nivel_instancia);
    }

    if (idIa.modo_nombre) {
      const radio = doc.querySelector(
        `input[type="radio"][name="modo_nombre_ia"][value="${idIa.modo_nombre}"]`
      );
      if (radio) {
        radio.checked = true;
      }
    }
    escribirValorPorId("nombre_ia", idIa.nombre_ia || "");
    escribirValorPorId("rol_ia", idIa.rol || "");
    escribirValorPorId("especializacion_ia", idIa.especializacion || "");
    escribirValorPorId("tono_estilo", idIa.tono_estilo || "");
    escribirValorPorId("nivel_profundidad", idIa.nivel_profundidad || "");
    marcarCheckboxesPorValores("formato_salida", idIa.formato_salida || []);

    marcarCheckboxesPorValores("tipos_aplicacion_web", trabajo.tipos_aplicacion_web || []);
    escribirValorPorId("objetivo_principal", trabajo.objetivo_principal || "");
    escribirValorPorId("contexto_entorno", trabajo.contexto_entorno || "");
    marcarCheckboxesPorValores("entregables_esperados", trabajo.entregables_esperados || []);
    escribirValorPorId("criterios_exclusion", trabajo.criterios_exclusion || "");

    marcarCheckboxesPorValores("rigor_epistemico", limites.rigor_epistemico || []);
    marcarCheckboxesPorValores("etica_y_control_humano", limites.etica_y_control_humano || []);
    marcarCheckboxesPorValores("limites_tecnicos", limites.limites_tecnicos || []);
    marcarCheckboxesPorValores("comportamiento_y_formato", limites.comportamiento_y_formato || []);
    escribirValorPorId(
      "limites_personalizados",
      Array.isArray(limites.limites_personalizados)
        ? limites.limites_personalizados.join("\n")
        : ""
    );

    actualizarVistaPrevia(false);
  }

  function registrarEventos() {
    let rafId = null;
    function programarActualizacion() {
      if (rafId !== null) {
        return;
      }
      rafId = global.requestAnimationFrame(function () {
        rafId = null;
        actualizarVistaPrevia(false);
      });
    }

    const formulario = doc.getElementById("form_prompt_json");
    if (formulario) {
      formulario.addEventListener("input", programarActualizacion);
      formulario.addEventListener("change", function () {
        actualizarVistaPrevia(false);
      });
    }

    const btnCrearJson = doc.getElementById("btn_crear_json");
    if (btnCrearJson) {
      btnCrearJson.addEventListener("click", function () {
        actualizarVistaPrevia(true);
        const ventanaSalida = doc.getElementById("ventana_salida_json");
        if (ventanaSalida && typeof ventanaSalida.scrollIntoView === "function") {
          ventanaSalida.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }

    const btnCopiar = doc.getElementById("btn_copiar_json");
    if (btnCopiar) {
      btnCopiar.addEventListener("click", function () {
        const res = actualizarVistaPrevia(false);
        const aviso = doc.getElementById("estado_validacion");
        if (global.navigator && global.navigator.clipboard && res.jsonTexto) {
          global.navigator.clipboard.writeText(res.jsonTexto).then(
            function () {
              if (aviso) aviso.textContent = "📋 JSON copiado al portapapeles.";
            },
            function () {
              if (aviso) aviso.textContent = "⚠️ No se pudo copiar automáticamente; selecciona y copia desde la ventana.";
            }
          );
        }
      });
    }

    const btnDescargar = doc.getElementById("btn_descargar_json");
    if (btnDescargar) {
      btnDescargar.addEventListener("click", function () {
        const res = actualizarVistaPrevia(false);
        if (global.MotorMarkov && res.validacion && res.validacion.valido) {
          const seq = [
            res.estado.nivel_instancia ? `nivel:${res.estado.nivel_instancia.toLowerCase()}` : null,
            res.estado.ia_tipo ? `ia:${res.estado.ia_tipo.toLowerCase()}` : null,
            res.estado.formato_salida && res.estado.formato_salida.includes("json_puro")
              ? "formato:json_puro"
              : null
          ].filter(Boolean);
          global.MotorMarkov.registrarSecuencia(res.estado.usuario_motor, seq);
        }

        const blob = new Blob([res.jsonTexto], { type: "application/json;charset=utf-8" });
        const url = global.URL.createObjectURL(blob);
        const enlace = doc.createElement("a");
        enlace.href = url;
        enlace.download = "prompt_configurado.json";
        doc.body.appendChild(enlace);
        enlace.click();
        doc.body.removeChild(enlace);
        global.URL.revokeObjectURL(url);
      });
    }

    const btnImportar = doc.getElementById("btn_importar_json");
    if (btnImportar) {
      btnImportar.addEventListener("click", function () {
        const areaJson = doc.getElementById("salida_json");
        const aviso = doc.getElementById("estado_validacion");
        if (!areaJson || !global.ValidadorPrompt) {
          return;
        }
        const resultado = global.ValidadorPrompt.analizarYCorregirJson(areaJson.value);
        if (!resultado.ok) {
          if (aviso) {
            aviso.textContent = `❌ Error de sintaxis: ${resultado.error}`;
          }
          return;
        }
        cargarEstadoEnFormulario(resultado.data);
        if (aviso) {
          aviso.textContent = resultado.corregido
            ? `🔧 JSON corregido y cargado: ${resultado.cambios.join(" ")}`
            : "✅ JSON importado y cargado en el formulario.";
        }
      });
    }

    const btnLimpiarMotor = doc.getElementById("btn_limpiar_motor");
    if (btnLimpiarMotor) {
      btnLimpiarMotor.addEventListener("click", function () {
        if (!global.MotorMarkov) {
          return;
        }
        const usuario = leerValorPorId("usuario_motor") || "invitado";
        const borrarTodos = leerCheckedPorId("limpiar_todos_usuarios_motor");
        const resMotor = global.MotorMarkov.limpiarMotor(usuario, borrarTodos);
        const aviso = doc.getElementById("estado_validacion");
        actualizarVistaPrevia(false);
        if (aviso) {
          aviso.textContent = resMotor.ok
            ? `🗑️ Motor limpiado (${resMotor.eliminadas.join(", ")}).`
            : "⚠️ No se pudo limpiar el motor en localStorage.";
        }
      });
    }
  }

  function iniciarApp() {
    registrarEventos();
    actualizarVistaPrevia(false);
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", iniciarApp);
  } else {
    iniciarApp();
  }
})(window);
