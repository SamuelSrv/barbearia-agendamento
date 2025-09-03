import { 
    getFirestore, collection, getDocs, addDoc, doc, getDoc, 
    query, where, deleteDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const db = getFirestore();

// --- BARBERS API ---
export function getBarbers(callback) {
    const barbersCol = collection(db, 'barbers');
    return onSnapshot(barbersCol, (snapshot) => {
        const barbers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(barbers);
    });
}

export async function addBarber(name, imageUrl, about) {
    await addDoc(collection(db, "barbers"), { name, imageUrl, about });
}

export async function removeBarber(id) {
    await deleteDoc(doc(db, "barbers", id));
}

// --- APPOINTMENTS API ---
export async function getAppointments(barberId, date) {
     const q = query(collection(db, "appointments"), where("barberId", "==", barberId), where("date", "==", date));
     const querySnapshot = await getDocs(q);
     return querySnapshot.docs.map(doc => doc.data());
}

export function getAppointmentsForBarber(uid, date, callback) {
    const q = query(collection(db, "appointments"), where("barberId", "==", uid), where("date", "==", date));
    return onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(doc => doc.data());
        callback(appointments);
    });
}

export async function createAppointment(appointmentData) {
    await addDoc(collection(db, "appointments"), appointmentData);
}

// --- USERS API ---
export async function getUserRole(uid) {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists() ? docSnap.data() : null;
}