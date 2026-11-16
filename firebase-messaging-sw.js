// Importar los scripts de Firebase para el segundo plano
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA87GdLbgUDMlE-N_wQtJpLnGFgODA6Mpc",
    authDomain: "bandajesusnazareno2012.firebaseapp.com",
    projectId: "bandajesusnazareno2012",
    storageBucket: "bandajesusnazareno2012.firebasestorage.app",
    messagingSenderId: "330943605319",
    appId: "1:330943605319:web:bff3c29a673d1982af9f62",
    measurementId: "G-RZSLXYPJ2B"
});

const messaging = firebase.messaging();

// Manejo de notificaciones en segundo plano con protección contra errores
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);
    
    const notificationTitle = (payload.notification && payload.notification.title) ? payload.notification.title : "Banda Jesús Nazareno";
    const notificationOptions = {
        body: (payload.notification && payload.notification.body) ? payload.notification.body : "Nuevo aviso en la agenda oficial",
        icon: 'escudo.png'
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Evento crucial para aplicaciones instaladas: abre la app al hacer clic en la notificación
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});
