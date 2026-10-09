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

// Estado Administrador
let esAdmin = false;

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
    
    // Recargar eventos para mostrar las X chicas rojas
    escucharEventos();
    
    // (Se ha eliminado la línea que abría el formulario automáticamente aquí)
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

    if (snapshot.empty) {
      lista.innerHTML = "<p style='text-align:center;'>No hay eventos programados.</p>";
      return;
    }

    // Convertir la lista en un array para poder ordenarlo
    let eventosArr = [];
    snapshot.forEach((docSnapshot) => {
      eventosArr.push({
        id: docSnapshot.id,
        ...docSnapshot.data()
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
        
        // 1 hora y media en milisegundos (1.5h * 60m * 60s * 1000ms = 5400000ms)
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
        ${esAdmin ? `<button class="btn-borrar-x" onclick="borrarEvento('${evento.id}')" title="Eliminar acto">✕</button>` : ''}
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

// 4. Guardar evento
window.guardarEvento = async function(e) {
  if (e) e.preventDefault();
  if (!esAdmin) {
    alert("Acceso denegado");
    return;
  }
  
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

// 5. Borrar evento
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
