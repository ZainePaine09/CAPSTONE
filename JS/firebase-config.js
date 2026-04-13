import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-analytics.js";
import {
    getAuth,
    GoogleAuthProvider,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA5fP7eVk4Yi75k_jtzbNetQhtWUbbOaBE",
    authDomain: "smart-alumni-connect-e2196.firebaseapp.com",
    projectId: "smart-alumni-connect-e2196",
    storageBucket: "smart-alumni-connect-e2196.firebasestorage.app",
    messagingSenderId: "76666359268",
    appId: "1:76666359268:web:6cf6f6c06639c34c81cbf1",
    measurementId: "G-XQPBEELF74"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const firebaseReady = setPersistence(auth, browserLocalPersistence).catch(error => {
    console.warn('Firebase persistence could not be set:', error);
});

window.firebaseApp = app;
window.firebaseAnalytics = analytics;
window.firebaseAuth = auth;
window.firebaseGoogleProvider = googleProvider;
window.firebaseReady = firebaseReady;

window.firebaseCreateEmailUser = async function(email, password, displayName = '') {
    await firebaseReady;
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(credential.user, { displayName });
    }
    return credential;
};

window.firebaseSignInEmailUser = async function(email, password) {
    await firebaseReady;
    return signInWithEmailAndPassword(auth, email, password);
};

window.firebaseGoogleSignIn = async function() {
    await firebaseReady;
    return signInWithPopup(auth, googleProvider);
};

window.firebaseSignOutUser = async function() {
    await firebaseReady;
    return signOut(auth);
};

export { app, analytics, auth, googleProvider, firebaseConfig };