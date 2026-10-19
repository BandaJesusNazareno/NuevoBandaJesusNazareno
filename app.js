// 1. Configuración de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, onSnapshot, deleteDoc, doc, setDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA87GdLbgUDMlE-N_wQtJpLnGFgODA6Mpc",
  authDomain: "bandajesusnazareno2012.firebaseapp.com",
  projectId: "bandajesusnazareno2012",
  storageBucket: "bandajesusnazareno2012.firebasestorage.app",
  messagingSenderId: "330943605319",
  appId: "1:330943605319:web:bff3c29a673d1982af9f62",
  measurementId: "G-RZSLXYPJ2B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventosRef = collection(db, "eventos");

let esAdmin = false;
let idEventoEditando = null;
let eventosMap = {};

function formatearFecha(fechaOriginal) {
  if (!fechaOriginal) return '';
  const partes = fechaOriginal.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaOriginal;
}

// 2. Control de Modales y Clave Admin
window.pedirClave = function() {
  if (esAdmin) {
    window.abrirFormularioDirecto();
  } else {
    document.getElementById("modalClave").style.display = "flex";
  }
};

window.cerrarModal = function(idModal) {
  document.getElementById(idModal).style.display = "none";
};

window.validarClave = function() {
  const claveIngresada = document.getElementById("inputClave").value;
  if (claveIngresada === "nazareno2012") {  
    esAdmin = true;
    document.getElementById("inputClave").value = "";
    cerrarModal("modalClave");
    crearBotonFlotante();
    escucharEventos();
  } else {
    alert("Contraseña incorrecta");
  }
};

function crearBotonFlotante() {
  if (document.getElementById("btnFlotanteAgregar")) return;

  const btn = document.createElement("button");
  btn.id = "btnFlotanteAgregar";
  btn.innerHTML = "+";
  btn.title = "Añadir acto";
  btn.onclick = function() {
    window.abrirFormularioDirecto();
  };
  document.body.appendChild(btn);
}

window.abrirFormularioDirecto = function() {
  if (esAdmin) {
    idEventoEditando = null;
    document.getElementById("formEvento").reset();
    document.getElementById("panelAdmin").style.display = "flex";
  } else {
    window.pedirClave();
  }
};

// 3. Cargar y escuchar eventos en tiempo real
function escucharEventos() {
  onSnapshot(eventosRef, (snapshot) => {
    const lista = document.getElementById("listaEventos");
    if (!lista) return;
    
    lista.innerHTML = "";
    eventosMap = {};

    if (snapshot.empty) {
      lista.innerHTML = "<p style='text-align:center;'>No hay eventos programados.</p>";
      return;
    }

    let eventosArr = [];
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const id = docSnapshot.id;
      eventosMap[id] = data;
      eventosArr.push({ id, ...data });
    });

    eventosArr.sort((a, b) => {
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return a.fecha.localeCompare(b.fecha);
    });

    eventosArr.forEach((evento) => {
      if (evento.tipo && evento.tipo.toLowerCase() === "ensayo" && evento.fecha && evento.hora) {
        const fechaHoraEventoStr = `${evento.fecha}T${evento.hora}:00`;
        const fechaHoraEvento = new Date(fechaHoraEventoStr);
        const tiempoLimite = new Date(fechaHoraEvento.getTime() + 5400000);
        const ahora = new Date();

        if (ahora > tiempoLimite) {
          return;
        }
      }

      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta-evento";
      const fechaFormateada = formatearFecha(evento.fecha);

      tarjeta.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span class="badge ${evento.tipo ? evento.tipo.toLowerCase() : ''}">${evento.tipo || 'Evento'}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #D4AF37; font-weight: 700; font-size: 0.95rem;">${evento.hora || ''}</span>
            ${esAdmin ? `
              <button class="btn-editar" onclick="cargarEdicionEvento('${evento.id}')" title="Editar acto">✏️</button>
              <button class="btn-eliminar" onclick="borrarEvento('${evento.id}')" title="Eliminar acto">✕</button>
            ` : ''}
          </div>
        </div>
        <h3 style="color: #ffffff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 600;">${evento.titulo || ''}</h3>
        <p style="margin: 4px 0; color: #cbd5e1; font-size: 0.9rem;">📅 <strong>Fecha:</strong> ${fechaFormateada}</p>
        <p style="margin: 4px 0; color: #cbd5e1; font-size: 0.9rem;">📍 <strong>Lugar:</strong> ${evento.lugar || ''}</p>
        ${evento.detalles ? `<p style="margin: 4px 0; color: #cbd5e1; font-size: 0.9rem;">📝 ${evento.detalles}</p>` : ''}
      `;
      lista.appendChild(tarjeta);
    });
  });
}

escucharEventos();

window.cargarEdicionEvento = function(id) {
  if (!esAdmin) return;
  const evento = eventosMap[id];
  if (!evento) return;

  idEventoEditando = id;
  document.getElementById("tituloEvento").value = evento.titulo || "";
  document.getElementById("tipoEvento").value = evento.tipo || "Ensayo";
  document.getElementById("horaEvento").value = evento.hora || "";
  document.getElementById("fechaEvento").value = evento.fecha || "";
  document.getElementById("lugarEvento").value = evento.lugar || "";
  document.getElementById("detallesEvento").value = evento.detalles || "";

  document.getElementById("panelAdmin").style.display = "flex";
};

window.guardarEvento = async function(e) {
  if (e) e.preventDefault();
  if (!esAdmin) {
    alert("Acceso denegado");
    return;
  }
  
  const datosEvento = {
    titulo: document.getElementById("tituloEvento").value,
    tipo: document.getElementById("tipoEvento").value,
    hora: document.getElementById("horaEvento").value,
    fecha: document.getElementById("fechaEvento").value,
    lugar: document.getElementById("lugarEvento").value,
    detalles: document.getElementById("detallesEvento").value
  };

  try {
    if (idEventoEditando) {
      await updateDoc(doc(db, "eventos", idEventoEditando), datosEvento);
      idEventoEditando = null;
    } else {
      await addDoc(eventosRef, datosEvento);
    }

    document.getElementById("formEvento").reset();
    cerrarModal('panelAdmin');
  } catch (error) {
    alert("Error al guardar en la nube: " + error.message);
  }
};

window.borrarEvento = async function(id) {
  if (!esAdmin) return;
  
  if (confirm("¿Seguro que quieres eliminar este acto?")) {
    try {
      await deleteDoc(doc(db, "eventos", id));
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  }
};

// 4. Panel de Control de Asistencia y Gestión de Músicos
window.abrirPanelAsistencia = function() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaAsistencia').value = hoy;
    document.getElementById('modalAsistencia').style.display = 'flex';
    cargarComponentesYAsistencia();
};

window.cargarComponentesYAsistencia = async function() {
    const fecha = document.getElementById('fechaAsistencia').value;
    if (!fecha) return;

    try {
        const querySnapshot = await getDocs(collection(db, "componentes"));
        let cornetasHTML = '';
        let bateriaHTML = '';

        const asistenciaDoc = await getDoc(doc(db, "asistencias", fecha));
        let registrosAsistencia = asistenciaDoc.exists() ? asistenciaDoc.data().registros || {} : {};

        querySnapshot.forEach((resDoc) => {
            const comp = resDoc.data();
            const idComp = resDoc.id;
            const estado = registrosAsistencia[idComp] || ''; 

            const htmlItem = `
                <div class="item-componente">
                    <span style="color: #fff; font-size: 0.9rem;">${comp.nombre}</span>
                    <div class="acciones-asistencia">
                        <button type="button" class="btn-asiste ${estado === 'asiste' ? 'activo' : ''}" onclick="marcarAsistencia(event, '${idComp}', 'asiste')">Sí</button>
                        <button type="button" class="btn-no-asiste ${estado === 'no' ? 'activo' : ''}" onclick="marcarAsistencia(event, '${idComp}', 'no')">No</button>
                        <button type="button" class="btn-borrar-componente" onclick="eliminarComponente('${idComp}')" title="Dar de baja">🗑️</button>
                    </div>
                </div>
            `;

            if (comp.seccion === 'corneta') {
                cornetasHTML += htmlItem;
            } else {
                bateriaHTML += htmlItem;
            }
        });

        document.getElementById('listaCornetasAsistencia').innerHTML = cornetasHTML || '<p style="color:#64748b; font-size:0.85rem;">No hay cornetas registradas.</p>';
        document.getElementById('listaBateriaAsistencia').innerHTML = bateriaHTML || '<p style="color:#64748b; font-size:0.85rem;">No hay batería/tambores registrados.</p>';

    } catch (error) {
        console.error("Error al cargar componentes:", error);
    }
};

let asistenciaTemporal = {};

window.marcarAsistencia = function(e, idComp, estado) {
    asistenciaTemporal[idComp] = estado;
    
    const item = e.target.closest('.acciones-asistencia');
    item.querySelector('.btn-asiste').classList.toggle('activo', estado === 'asiste');
    item.querySelector('.btn-no-asiste').classList.toggle('activo', estado === 'no');
};

window.cargarAsistenciaFecha = function() {
    asistenciaTemporal = {};
    cargarComponentesYAsistencia();
};

window.agregarComponente = async function() {
    const nombre = document.getElementById('nuevoNombreComponente').value.trim();
    const seccion = document.getElementById('nuevoSeccionComponente').value;

    if (!nombre) {
        alert("Por favor, escribe el nombre del componente.");
        return;
    }

    try {
        await addDoc(collection(db, "componentes"), { nombre, seccion });
        document.getElementById('nuevoNombreComponente').value = '';
        cargarComponentesYAsistencia();
    } catch (error) {
        console.error("Error al añadir componente:", error);
    }
};

window.eliminarComponente = async function(idComp) {
    if (confirm("¿Estás seguro de dar de baja a este componente de la banda?")) {
        try {
            await deleteDoc(doc(db, "componentes", idComp));
            cargarComponentesYAsistencia();
        } catch (error) {
            console.error("Error al eliminar componente:", error);
        }
    }
};

window.guardarAsistenciaFirebase = async function() {
    const fecha = document.getElementById('fechaAsistencia').value;
    if (!fecha) {
        alert("Selecciona una fecha.");
        return;
    }

    try {
        const ref = doc(db, "asistencias", fecha);
        const actualDoc = await getDoc(ref);
        let currentRegistros = actualDoc.exists() ? actualDoc.data().registros || {} : {};

        const registrosFinales = { ...currentRegistros, ...asistenciaTemporal };

        await setDoc(ref, { fecha, registros: registrosFinales });
        alert("¡Asistencia guardada correctamente!");
        cerrarModal('modalAsistencia');
    } catch (error) {
        console.error("Error al guardar asistencia:", error);
        alert("Hubo un error al guardar.");
    }
};

// 5. Enlace seguro de los botones de la cabecera para módulos
document.addEventListener("DOMContentLoaded", () => {
    const btnAsistencia = document.getElementById("btnAsistencia");
    if (btnAsistencia) {
        btnAsistencia.addEventListener("click", abrirPanelAsistencia);
    }

    const btnAdmin = document.getElementById("btnAdmin");
    if (btnAdmin) {
        btnAdmin.addEventListener("click", pedirClave);
    }
});
