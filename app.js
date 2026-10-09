document.addEventListener('DOMContentLoaded', () => {
    // Si es la PRIMERA VEZ que se abre la app en este navegador, guarda los eventos iniciales
    if (localStorage.getItem('appIniciada') === null) {
        const eventosIniciales = [
            {
                id: 1,
                titulo: 'Ensayo General',
                tipo: 'Ensayo',
                fecha: '2026-10-08',
                hora: '21:00 h',
                lugar: 'Local de Ensayo de la Banda',
                detalles: 'Apertura de local a las 20:30 h. Puntualidad.'
            },
            {
                id: 2,
                titulo: 'Ensayo General',
                tipo: 'Ensayo',
                fecha: '2026-10-09',
                hora: '21:00',
                lugar: 'Local de Ensayo',
                detalles: ''
            }
        ];
        localStorage.setItem('eventosBanda', JSON.stringify(eventosIniciales));
        localStorage.setItem('appIniciada', 'true'); // Marca que ya se inició la app por primera vez
    }
    
    cargarEventos();
});

let esAdmin = false;

function pedirClave() {
    document.getElementById('modalClave').style.display = 'flex';
}

function validarClave() {
    const clave = document.getElementById('inputClave').value;
    if (clave === '1234') {
        esAdmin = true;
        cerrarModal('modalClave');
        document.getElementById('inputClave').value = '';
        document.getElementById('panelAdmin').style.display = 'flex';
        cargarEventos();
    } else {
        alert('Contraseña incorrecta');
    }
}

function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
}

function guardarEvento(event) {
    event.preventDefault();

    const titulo = document.getElementById('tituloEvento').value;
    const tipo = document.getElementById('tipoEvento').value;
    const hora = document.getElementById('horaEvento').value;
    const fecha = document.getElementById('fechaEvento').value;
    const lugar = document.getElementById('lugarEvento').value;
    const detalles = document.getElementById('detallesEvento').value;

    const nuevoEvento = {
        id: Date.now(),
        titulo,
        tipo,
        hora,
        fecha,
        lugar,
        detalles
    };

    let eventos = JSON.parse(localStorage.getItem('eventosBanda')) || [];
    eventos.push(nuevoEvento);
    localStorage.setItem('eventosBanda', JSON.stringify(eventos));

    document.getElementById('formEvento').reset();
    cerrarModal('panelAdmin');
    cargarEventos();
}

function cargarEventos() {
    const lista = document.getElementById('listaEventos');
    lista.innerHTML = '';
    const eventos = JSON.parse(localStorage.getItem('eventosBanda')) || [];

    const meses = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

    if (eventos.length === 0) {
        lista.innerHTML = '<p style="color:#8c9ba5; text-align:center;">No hay eventos ni ensayos programados.</p>';
        return;
    }

    eventos.forEach(ev => {
        const fechaObj = new Date(ev.fecha + 'T00:00:00');
        const dia = fechaObj.getDate() || '--';
        const mes = meses[fechaObj.getMonth()] || 'OCT';

        let badgeClass = 'badge-ensayo';
        if (ev.tipo === 'Concierto') badgeClass = 'badge-concierto';
        if (ev.tipo === 'Procesión') badgeClass = 'badge-procesion';

        const card = document.createElement('div');
        card.className = 'evento-card';
        card.innerHTML = `
            <div class="fecha-box">
                <span class="dia">${dia}</span>
                <span class="mes">${mes}</span>
            </div>
            <div class="evento-info">
                <span class="badge ${badgeClass}">${ev.tipo}</span>
                <h3>${ev.titulo}</h3>
                <div class="evento-detalle">🕒 ${ev.hora}</div>
                <div class="evento-detalle">📍 ${ev.lugar}</div>
                ${ev.detalles ? `<div class="evento-detalle">ℹ️ ${ev.detalles}</div>` : ''}
            </div>
            ${esAdmin ? `<button class="btn-eliminar-evento" onclick="borrarEvento(${ev.id})">&times;</button>` : ''}
        `;
        lista.appendChild(card);
    });
}

function borrarEvento(id) {
    let eventos = JSON.parse(localStorage.getItem('eventosBanda')) || [];
    eventos = eventos.filter(ev => ev.id !== id);
    localStorage.setItem('eventosBanda', JSON.stringify(eventos));
    cargarEventos();
}