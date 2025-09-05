import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// !!! ESTE É O LUGAR CORRETO PARA SUA CONFIGURAÇÃO !!!
// Cole sua configuração do Firebase aqui
const firebaseConfig = {
    apiKey: "AIzaSyAM5aEJRxxzuDUSfpuXL7sjYd_p0o5qet8",
    authDomain: "projetobarbearia01.firebaseapp.com",
    projectId: "projetobarbearia01",
    storageBucket: "projetobarbearia01.firebasestorage.app",
    messagingSenderId: "629044069637",
    appId: "1:629044069637:web:4b6de7ee41ad79c310636c"
};

// Inicializa o Firebase UMA VEZ e exporta os serviços que você vai usar
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);