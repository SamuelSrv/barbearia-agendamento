import { 
    getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getUserRole } from './api.js';
import { updateNav } from './ui.js';
import { loadPage, state } from './main.js';

const auth = getAuth();

export function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userProfile = await getUserRole(user.uid);
            state.currentUser = { ...user, role: userProfile?.role || 'barber' };
        } else {
            state.currentUser = null;
            if (window.location.hash === '#admin') {
                loadPage('home'); // Redirect if logged out from admin page
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