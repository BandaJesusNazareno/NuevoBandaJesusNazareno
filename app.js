const firebaseConfig = {
    apiKey: "AIzaSyA87GdLbgUDMlE-N_wQtJpLnGFgODA6Mpc",
    authDomain: "bandajesusnazareno2012.firebaseapp.com",
    projectId: "bandajesusnazareno2012",
    storageBucket: "bandajesusnazareno2012.firebasestorage.app",
    messagingSenderId: "330943605319",
    appId: "1:330943605319:web:bff3c29a673d1982af9f62",
    measurementId: "G-RZSLXYPJ2B"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const eventosRef = db.collection("eventos");

var esAdmin = false;
var idEventoEditando = null;
var eventosMap = {};

function formatearFecha(fechaOriginal) {
    if (!fechaOriginal) return '';
    var partes = fechaOriginal.split('-');
    if (partes.length === 3) {
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }
    return fechaOriginal;
}

function pedirClave() {
    if (esAdmin) {
        abrirFormularioDirecto();
    } else {
        document.getElementById("modalClave").style.display = "flex";
    }
}

function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = "none";
}

function validarClave() {
    var claveIngresada = document.getElementById("inputClave").value;
    if (claveIngresada === "nazareno2012") {  
        esAdmin = true;
        document.getElementById("inputClave").value = "";
        cerrarModal("modalClave");
        crearBotonFlotante();
        escucharEventos();
        
        document.querySelectorAll(".admin-only").forEach(function(el) {
            el.style.display = "block";
        });

        if (document.getElementById("modalAsistencia").style.display === "flex") {
            cargarComponentesYAsistencia();
        }
    } else {
        alert("Contraseña incorrecta");
    }
}

function crearBotonFlotante() {
    if (document.getElementById("btnFlotanteAgregar")) return;
    var btn = document.createElement("button");
    btn.id = "btnFlotanteAgregar";
    btn.innerHTML = "+";
    btn.title = "Añadir acto";
    btn.onclick = function() {
        abrirFormularioDirecto();
    };
    document.body.appendChild(btn);
}

function abrirFormularioDirecto() {
    if (esAdmin) {
        idEventoEditando = null;
        document.getElementById("formEvento").reset();
        document.getElementById("panelAdmin").style.display = "flex";
    } else {
        pedirClave();
    }
}

function escucharEventos() {
    eventosRef.onSnapshot(function(snapshot) {
        var lista = document.getElementById("listaEventos");
        if (!lista) return;
        
        lista.innerHTML = "";
        eventosMap = {};

        if (snapshot.empty) {
            lista.innerHTML = "<p style='text-align:center;'>No hay eventos programados.</p>";
            return;
        }

        var eventosArr = [];
        snapshot.forEach(function(docSnapshot) {
            var data = docSnapshot.data();
            var id = docSnapshot.id;
            eventosMap[id] = data;
            data.id = id;
            eventosArr.push(data);
        });

        eventosArr.sort(function(a, b) {
            if (!a.fecha) return 1;
            if (!b.fecha) return -1;
            return a.fecha.localeCompare(b.fecha);
        });

        eventosArr.forEach(function(evento) {
            if (evento.tipo && evento.tipo.toLowerCase() === "ensayo" && evento.fecha && evento.hora) {
                var fechaHoraEventoStr = evento.fecha + 'T' + evento.hora + ':00';
                var fechaHoraEvento = new Date(fechaHoraEventoStr);
                var tiempoLimite = new Date(fechaHoraEvento.getTime() + 5400000);
                var ahora = new Date();

                if (ahora > tiempoLimite) {
                    return;
                }
            }

            var tarjeta = document.createElement("div");
            tarjeta.className = "tarjeta-evento";
            var fechaFormateada = formatearFecha(evento.fecha);

            var htmlTarjeta = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">' +
                '<span class="badge ' + (evento.tipo ? evento.tipo.toLowerCase() : '') + '">' + (evento.tipo || 'Evento') + '</span>' +
                '<div style="display: flex; align-items: center; gap: 8px;">' +
                  '<span style="color: #D4AF37; font-weight: 700; font-size: 0.95rem;">' + (evento.hora || '') + '</span>';

            if (esAdmin) {
                htmlTarjeta += '<button class="btn-editar" onclick="cargarEdicionEvento(\'' + evento.id + '\')" title="Editar acto">✏️</button>' +
                               '<button class="btn-eliminar" onclick="borrarEvento(\'' + evento.id + '\')" title="Eliminar acto">✕</button>';
            }

            htmlTarjeta += '</div></div>' +
                '<h3 style="color: #ffffff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 600;">' + (evento.titulo || '') + '</h3>' +
                '<p style="margin: 4px 0; color: #cbd5e1; font-size: 0.9rem;">📅 <strong>Fecha:</strong> ' + fechaFormateada + '</p>' +
                '<p style="margin: 4px 0; color: #cbd5e1; font-size: 0.9rem;">📍 <strong>Lugar:</strong> ' + (evento.lugar || '') + '</p>';

            if (evento.detalles) {
                htmlTarjeta += '<p style="margin: 4px 0; color: #cbd5e1; font-size: 0.9rem;">📝 ' + evento.detalles + '</p>';
            }

            tarjeta.innerHTML = htmlTarjeta;
            lista.appendChild(tarjeta);
        });
    });
}

escucharEventos();

function cargarEdicionEvento(id) {
    if (!esAdmin) return;
    var evento = eventosMap[id];
    if (!evento) return;

    idEventoEditando = id;
    document.getElementById("tituloEvento").value = evento.titulo || "";
    document.getElementById("tipoEvento").value = evento.tipo || "Ensayo";
    document.getElementById("horaEvento").value = evento.hora || "";
    document.getElementById("fechaEvento").value = evento.fecha || "";
    document.getElementById("lugarEvento").value = evento.lugar || "";
    document.getElementById("detallesEvento").value = evento.detalles || "";

    document.getElementById("panelAdmin").style.display = "flex";
}

function guardarEvento(e) {
    if (e) e.preventDefault();
    if (!esAdmin) {
        alert("Acceso denegado");
        return;
    }
    
    var datosEvento = {
        titulo: document.getElementById("tituloEvento").value,
        tipo: document.getElementById("tipoEvento").value,
        hora: document.getElementById("horaEvento").value,
        fecha: document.getElementById("fechaEvento").value,
        lugar: document.getElementById("lugarEvento").value,
        detalles: document.getElementById("detallesEvento").value
    };

    if (idEventoEditando) {
        eventosRef.doc(idEventoEditando).update(datosEvento)
            .then(function() {
                idEventoEditando = null;
                document.getElementById("formEvento").reset();
                cerrarModal('panelAdmin');
            })
            .catch(function(error) { alert("Error: " + error.message); });
    } else {
        eventosRef.add(datosEvento)
            .then(function() {
                document.getElementById("formEvento").reset();
                cerrarModal('panelAdmin');
            })
            .catch(function(error) { alert("Error: " + error.message); });
    }
}

function borrarEvento(id) {
    if (!esAdmin) return;
    if (confirm("¿Seguro que quieres eliminar este acto?")) {
        eventosRef.doc(id).delete().catch(function(error) {
            alert("Error al eliminar: " + error.message);
        });
    }
}

function abrirPanelAsistencia() {
    var hoy = new Date().toISOString().split('T')[0];
    var partesHoy = hoy.split('-');
    var hoyFormateado = partesHoy[2] + '/' + partesHoy[1] + '/' + partesHoy[0];

    document.getElementById('fechaAsistencia').value = hoyFormateado;
    document.getElementById('modalAsistencia').style.display = 'flex';
    
    var seccionAdmin = document.getElementById('adminSeccionComponentes');
    if (seccionAdmin) {
        seccionAdmin.style.display = esAdmin ? 'block' : 'none';
    }
    
    cargarComponentesYAsistencia();
}

function cargarComponentesYAsistencia() {
    var fechaInput = document.getElementById('fechaAsistencia').value;
    if (!fechaInput) return;

    var partsSel = fechaInput.includes('/') ? fechaInput.split('/') : fechaInput.split('-');
    var numSel = 0;
    if (partsSel.length === 3) {
        if (partsSel[0].length === 4) {
            numSel = parseInt(partsSel[0] + partsSel[1] + partsSel[2], 10);
        } else {
            numSel = parseInt(partsSel[2] + partsSel[1] + partsSel[0], 10);
        }
    }

    db.collection("componentes").get().then(function(querySnapshot) {
        var componentesArr = [];
        querySnapshot.forEach(function(resDoc) {
            var data = resDoc.data();
            data.id = resDoc.id;
            componentesArr.push(data);
        });

        // Ordenar: Los más antiguos arriba, los nuevos abajo
        componentesArr.sort(function(a, b) {
            var tA = a.creadoEn || 0;
            var tB = b.creadoEn || 0;
            return tA - tB;
        });

        var cornetasHTML = '';
        var bateriaHTML = '';
        
        var totalMusicos = 0;
        var totalPresentes = 0;
        var totalAusentes = 0;

        var fechaFirestore = fechaInput;
        if (fechaInput.includes('/')) {
            var p = fechaInput.split('/');
            fechaFirestore = p[2] + '-' + p[1] + '-' + p[0];
        }

        db.collection("asistencias").doc(fechaFirestore).get().then(function(asistenciaDoc) {
            var registrosAsistencia = asistenciaDoc.exists ? asistenciaDoc.data().registros || {} : {};

            componentesArr.forEach(function(comp) {
                var idComp = comp.id;
                
                var fechaAltaStr = comp.fechaAlta || "01/01/2024";
                var partsAlta = fechaAltaStr.includes('/') ? fechaAltaStr.split('/') : fechaAltaStr.split('-');
                var numAlta = 0;
                if (partsAlta.length === 3) {
                    if (partsAlta[0].length === 4) {
                        numAlta = parseInt(partsAlta[0] + partsAlta[1] + partsAlta[2], 10);
                    } else {
                        numAlta = parseInt(partsAlta[2] + partsAlta[1] + partsAlta[0], 10);
                    }
                }

                if (numSel < numAlta) {
                    return; 
                }

                var estado = registrosAsistencia[idComp] || ''; 

                totalMusicos++;
                if (estado === 'asiste') {
                    totalPresentes++;
                } else if (estado === 'no') {
                    totalAusentes++;
                }

                var htmlItem = '<div class="item-componente" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">' +
                    '<span style="color: #fff; font-size: 0.9rem;">' + comp.nombre + '</span>' +
                    '<div class="acciones-asistencia" style="display: flex; gap: 6px; align-items: center;">';

                if (esAdmin) {
                    htmlItem += '<button type="button" class="btn-asiste ' + (estado === 'asiste' ? 'activo' : '') + '" onclick="marcarAsistenciaDirecto(event, \'' + idComp + '\', \'asiste\')">Sí</button>' +
                                '<button type="button" class="btn-no-asiste ' + (estado === 'no' ? 'activo' : '') + '" onclick="marcarAsistenciaDirecto(event, \'' + idComp + '\', \'no\')">No</button>' +
                                '<button type="button" class="btn-borrar-componente" onclick="eliminarComponente(\'' + idComp + '\')" title="Dar de baja" style="background:none; border:none; cursor:pointer; font-size: 1rem;">🗑️</button>';
                } else {
                    if (estado === 'asiste') {
                        htmlItem += '<span class="asistencia-badge-si">SÍ</span>';
                    } else if (estado === 'no') {
                        htmlItem += '<span class="asistencia-badge-no">NO</span>';
                    } else {
                        htmlItem += '<span style="color: #94a3b8; font-size: 0.85rem; font-style: italic;">Sin registrar</span>';
                    }
                }

                htmlItem += '</div></div>';

                if (comp.seccion === 'corneta') {
                    cornetasHTML += htmlItem;
                } else {
                    bateriaHTML += htmlItem;
                }
            });

            document.getElementById('totalMusicosCount').innerText = totalMusicos;
            document.getElementById('totalPresentesCount').innerText = totalPresentes;
            document.getElementById('totalAusentesCount').innerText = totalAusentes;

            document.getElementById('listaCornetasAsistencia').innerHTML = cornetasHTML || '<p style="color:#64748b; font-size:0.85rem;">No hay cornetas registradas para esta fecha.</p>';
            document.getElementById('listaBateriaAsistencia').innerHTML = bateriaHTML || '<p style="color:#64748b; font-size:0.85rem;">No hay batería/tambores registrados para esta fecha.</p>';
        });
    }).catch(function(error) {
        console.error("Error al cargar componentes:", error);
    });
}

function marcarAsistenciaDirecto(e, idComp, estado) {
    if (!esAdmin) return;
    var fechaInput = document.getElementById('fechaAsistencia').value;
    if (!fechaInput) return;

    var fechaFirestore = fechaInput;
    if (fechaInput.includes('/')) {
        var p = fechaInput.split('/');
        fechaFirestore = p[2] + '-' + p[1] + '-' + p[0];
    }

    var ref = db.collection("asistencias").doc(fechaFirestore);
    ref.get().then(function(doc) {
        var currentRegistros = doc.exists ? doc.data().registros || {} : {};
        currentRegistros[idComp] = estado;

        ref.set({ fecha: fechaFirestore, registros: currentRegistros }).then(function() {
            cargarComponentesYAsistencia();
        });
    }).catch(function(error) {
        console.error("Error al actualizar asistencia:", error);
    });
}

function cargarAsistenciaFecha() {
    cargarComponentesYAsistencia();
}

function agregarComponente() {
    if (!esAdmin) return;
    var nombre = document.getElementById('nuevoNombreComponente').value.trim();
    var seccion = document.getElementById('nuevoSeccionComponente').value;

    if (!nombre) {
        alert("Por favor, escribe el nombre del componente.");
        return;
    }

    var hoy = new Date();
    var anio = hoy.getFullYear();
    var mes = String(hoy.getMonth() + 1).padStart(2, '0');
    var dia = String(hoy.getDate()).padStart(2, '0');
    var fechaAltaFormateada = dia + '/' + mes + '/' + anio;

    db.collection("componentes").add({ 
        nombre: nombre, 
        seccion: seccion,
        fechaAlta: fechaAltaFormateada,
        creadoEn: Date.now() 
    }).then(function() {
        document.getElementById('nuevoNombreComponente').value = '';
        cargarComponentesYAsistencia();
    }).catch(function(error) {
        console.error("Error al añadir componente:", error);
    });
}

function eliminarComponente(idComp) {
    if (!esAdmin) return;
    if (confirm("¿Estás seguro de dar de baja a este componente de la banda?")) {
        db.collection("componentes").doc(idComp).delete().then(function() {
            cargarComponentesYAsistencia();
        }).catch(function(error) {
            console.error("Error al eliminar componente:", error);
        });
    }
}
