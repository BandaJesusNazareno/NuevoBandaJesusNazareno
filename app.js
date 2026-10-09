// 1. Configuración de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Estado Administrador y Control de Edición
let esAdmin = false;
let idEventoEditando = null; // Variable para saber si estamos editando un evento existente
let eventosMap = {}; // Mapa para guardar los datos de los eventos en memoria

// Función para formatear la fecha de AAAA-MM-DD a DD/MM/AAAA
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
    
    // CREAR EL BOTÓN FLOTANTE (+) SOLO CUANDO SE INGRESA LA CLAVE CORRECTA
    crearBotonFlotante();
    
    // Recargar eventos para mostrar los botones de administración
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
    // Si se abre con el '+', limpiamos la id de edición para crear uno nuevo
    idEventoEditando = null;
    document.getElementById("formEvento").reset();
    document.getElementById("panelAdmin").style.display = "flex";
  } else {
    window.pedirClave();
  }
};

// 3. Cargar y escuchar eventos en tiempo real desde Firebase
function escucharEventos() {
  onSnapshot(eventosRef, (snapshot) => {
    const lista = document.getElementById("listaEventos");
    if (!lista) return;
    
    lista.innerHTML = "";
    eventosMap = {}; // Limpiar el mapa local en cada actualización

    if (snapshot.empty) {
      lista.innerHTML = "<p style='text-align:center;'>No hay eventos programados.</p>";
      return;
    }

    // Convertir la lista en un array para poder ordenarlo
    let eventosArr = [];
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const id = docSnapshot.id;
      eventosMap[id] = data; // Guardamos los datos para poder editarlos después
      eventosArr.push({
        id,
        ...data
      });
    });

    // Ordenar de menor a mayor fecha (los días más próximos arriba)
    eventosArr.sort((a, b) => {
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return a.fecha.localeCompare(b.fecha);
    });

    // Generar la tarjeta de cada acto
    eventosArr.forEach((evento) => {
      // COMPROBACIÓN: Ocultar ensayos 1 hora y media después de su inicio
      if (evento.tipo && evento.tipo.toLowerCase() === "ensayo" && evento.fecha && evento.hora) {
        const fechaHoraEventoStr = `${evento.fecha}T${evento.hora}:00`;
        const fechaHoraEvento = new Date(fechaHoraEventoStr);
        
        // 1 hora y media en milisegundos (5400000ms)
        const tiempoLimite = new Date(fechaHoraEvento.getTime() + 5400000);
        const ahora = new Date();

        // Si ya ha pasado 1 hora y media, se omite y no se dibuja
        if (ahora > tiempoLimite) {
          return;
        }
      }

      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta-evento";

      // Formato DD/MM/AAAA
      const fechaFormateada = formatearFecha(evento.fecha);

      tarjeta.innerHTML = `
        ${esAdmin ? `
          <button class="btn-editar" onclick="cargarEdicionEvento('${evento.id}')" title="Editar acto">✏️</button>
          <button class="btn-borrar-x" onclick="borrarEvento('${evento.id}')" title="Eliminar acto">✕</button>
        ` : ''}
        <div class="evento-header">
          <span class="badge ${evento.tipo ? evento.tipo.toLowerCase() : ''}">${evento.tipo || 'Evento'}</span>
          <span class="evento-hora">${evento.hora || ''}</span>
        </div>
        <h3>${evento.titulo || ''}</h3>
        <p>📅 <strong>Fecha:</strong> ${fechaFormateada}</p>
        <p>📍 <strong>Lugar:</strong> ${evento.lugar || ''}</p>
        ${evento.detalles ? `<p>📝 ${evento.detalles}</p>` : ''}
      `;
      lista.appendChild(tarjeta);
    });
  });
}

// Iniciar escucha
escucharEventos();

// 4. Preparar formulario para editar evento existente
window.cargarEdicionEvento = function(id) {
  if (!esAdmin) return;
  const evento = eventosMap[id];
  if (!evento) return;

  idEventoEditando = id; // Guardamos el ID del documento que vamos a modificar

  // Rellenar el formulario con los datos actuales del evento
  document.getElementById("tituloEvento").value = evento.titulo || "";
  document.getElementById("tipoEvento").value = evento.tipo || "Ensayo";
  document.getElementById("horaEvento").value = evento.hora || "";
  document.getElementById("fechaEvento").value = evento.fecha || "";
  document.getElementById("lugarEvento").value = evento.lugar || "";
  document.getElementById("detallesEvento").value = evento.detalles || "";

  // Mostrar el modal
  document.getElementById("panelAdmin").style.display = "flex";
};

// 5. Guardar evento (Nuevo o Editado)
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
      // Si estamos editando, actualizamos el documento existente en Firestore
      await updateDoc(doc(db, "eventos", idEventoEditando), datosEvento);
      idEventoEditando = null; // Reiniciamos la variable de edición
    } else {
      // Si no, creamos uno nuevo
      await addDoc(eventosRef, datosEvento);
    }

    document.getElementById("formEvento").reset();
    cerrarModal('panelAdmin');
  } catch (error) {
    alert("Error al guardar en la nube: " + error.message);
  }
};

// 6. Borrar evento
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
