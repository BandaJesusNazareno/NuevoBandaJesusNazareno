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

// Manejo opcional de notificaciones en segundo plano
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'escudo.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
