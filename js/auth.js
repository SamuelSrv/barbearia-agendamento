// Importa a instância 'auth' já inicializada
import { auth } from './firebase.js';
import {
    signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getUserRole } from './api.js';
import { updateNav } from './ui.js';
import { loadPage, state } from './main.js';

export function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userProfile = await getUserRole(user.uid);
            state.currentUser = { ...user, role: userProfile?.role || 'barber' };
        } else {
            state.currentUser = null;
            if (window.location.hash === '#admin') {
                loadPage('home'); // Redireciona se estiver deslogado da página de admin
            }
        }
        updateNav(state.currentUser);
    });
}

export async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
    await signOut(auth);
}