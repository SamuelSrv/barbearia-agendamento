import { auth } from './firebase.js';
import {
    signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getUserRole } from './api.js';
import { updateNav } from './ui.js'; // Esta linha agora funcionará corretamente
import { loadPage, state } from './main.js';

export function setupAuthListener(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userProfile = await getUserRole(user.uid);
            state.currentUser = { ...user, role: userProfile?.role || 'barber' };
        } else {
            state.currentUser = null;
            if (window.location.hash.includes('admin')) {
                loadPage('home'); // Redireciona se estiver deslogado da página de admin
            }
        }
        updateNav(state.currentUser);
        if(callback) callback();
    });
}

export async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
    await signOut(auth);
}