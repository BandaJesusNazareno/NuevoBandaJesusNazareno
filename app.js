// 1. Configuración de Firebase con tus claves
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

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventosRef = collection(db, "eventos");

// 2. Escuchar cambios en tiempo real (se actualiza solo en todos los móviles)
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
      <button class="btn-borrar" onclick="borrarEvento('${id}')">Eliminar</button>
    `;
    lista.appendChild(tarjeta);
  });
});

// 3. Guardar nuevo evento en la nube
window.guardarEvento = async function(e) {
  if (e) e.preventDefault();
  
  const nuevoEvento = {
    titulo: document.getElementById("tituloEvento")?.value || "",
    tipo: document.getElementById("tipoEvento")?.value || "",
    hora: document.getElementById("horaEvento")?.value || "",
    fecha: document.getElementById("fechaEvento")?.value || "",
    lugar: document.getElementById("lugarEvento")?.value || "",
    detalles: document.getElementById("detallesEvento")?.value || ""
  };

  try {
    await addDoc(eventosRef, nuevoEvento);
    const form = document.getElementById("formEvento");
    if (form) form.reset();
    if (typeof cerrarModal === 'function') cerrarModal('panelAdmin');
  } catch (error) {
    alert("Error al guardar en la nube: " + error.message);
  }
};

// 4. Borrar evento de la nube
window.borrarEvento = async function(id) {
  if (confirm("¿Seguro que quieres eliminar este acto?")) {
    try {
      await deleteDoc(doc(db, "eventos", id));
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  }
};
