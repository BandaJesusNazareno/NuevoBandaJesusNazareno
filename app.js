// 1. Configuración de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Variable para recordar si estás dentro como Admin
let esAdmin = false;

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
    document.getElementById("btnFlotanteAgregar").style.display = "flex";
    window.abrirFormularioDirecto();
  } else {
    alert("Contraseña incorrecta");
  }
};

window.abrirFormularioDirecto = function() {
  document.getElementById("panelAdmin").style.display = "flex";
};

// 3. Cargar y escuchar eventos en tiempo real desde Firebase
onSnapshot(eventosRef, (snapshot) => {
  const lista = document.getElementById("listaEventos");
  if (!lista) return;
  
  lista.innerHTML = "";

  if (snapshot.empty) {
    lista.innerHTML = "<p style='text-align:center;'>No hay eventos programados.</p>";
    return;
  }

  snapshot.forEach((docSnapshot) => {
    const evento = docSnapshot.data();
    const id = docSnapshot.id;

    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-evento";
    tarjeta.innerHTML = `
      <div class="evento-header">
        <span class="badge ${evento.tipo ? evento.tipo.toLowerCase() : ''}">${evento.tipo || 'Evento'}</span>
        <span class="evento-hora">${evento.hora || ''}</span>
      </div>
      <h3>${evento.titulo || ''}</h3>
      <p>📅 <strong>Fecha:</strong> ${evento.fecha || ''}</p>
      <p>📍 <strong>Lugar:</strong> ${evento.lugar || ''}</p>
      ${evento.detalles ? `<p>📝 ${evento.detalles}</p>` : ''}
      ${esAdmin ? `<button class="btn-borrar" onclick="borrarEvento('${id}')">Eliminar</button>` : ''}
    `;
    lista.appendChild(tarjeta);
  });
});

// 4. Guardar evento en la nube
window.guardarEvento = async function(e) {
  if (e) e.preventDefault();
  
  const nuevoEvento = {
    titulo: document.getElementById("tituloEvento").value,
    tipo: document.getElementById("tipoEvento").value,
    hora: document.getElementById("horaEvento").value,
    fecha: document.getElementById("fechaEvento").value,
    lugar: document.getElementById("lugarEvento").value,
    detalles: document.getElementById("detallesEvento").value
  };

  try {
    await addDoc(eventosRef, nuevoEvento);
    document.getElementById("formEvento").reset();
    cerrarModal('panelAdmin');
  } catch (error) {
    alert("Error al guardar en la nube: " + error.message);
  }
};

// 5. Borrar evento de la nube
window.borrarEvento = async function(id) {
  if (confirm("¿Seguro que quieres eliminar este acto?")) {
    try {
      await deleteDoc(doc(db, "eventos", id));
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  }
};
