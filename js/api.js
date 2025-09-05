import { db } from './firebase.js';
import {
    collection, getDocs, addDoc, doc, getDoc, setDoc,
    query, where, deleteDoc, onSnapshot, orderBy
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- BARBERS API ---
export function getBarbers(callback) {
    const q = query(collection(db, 'users'), where('role', '==', 'barber'));
    return onSnapshot(q, (snapshot) => {
        const barbers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(barbers);
    });
}
// Adiciona um barbeiro na coleção 'users' com a role 'barber'
export async function addBarber(name, imageUrl, about) {
    await addDoc(collection(db, "users"), {
        name,
        imageUrl,
        about,
        role: 'barber'
    });
}
export async function removeBarber(id) {
    await deleteDoc(doc(db, "users", id));
}
export async function getBarberById(id) {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}
export async function updateBarberWorkSchedule(barberId, schedule) {
    const barberRef = doc(db, "users", barberId);
    await setDoc(barberRef, { workSchedule: schedule }, { merge: true });
}


// --- SERVICES API ---
export function getServices(callback) {
    const servicesCol = collection(db, 'services');
    return onSnapshot(query(servicesCol, orderBy('name')), (snapshot) => {
        const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(services);
    });
}
export async function addService(serviceData) {
    await addDoc(collection(db, "services"), serviceData);
}
export async function updateService(id, serviceData) {
    await setDoc(doc(db, "services", id), serviceData);
}
export async function removeService(id) {
    await deleteDoc(doc(db, "services", id));
}

// --- APPOINTMENTS & BLOCKS API ---
export function getAppointments(barberId, date, callback) {
     const q = query(collection(db, "appointments"), where("barberId", "==", barberId), where("date", "==", date));
     return onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(appointments);
     });
}
export async function createAppointment(appointmentData) {
    await addDoc(collection(db, "appointments"), appointmentData);
}
export function getBlockedSlots(barberId, date, callback) {
    const q = query(collection(db, "blockedSlots"), where("barberId", "==", barberId), where("date", "==", date));
    return onSnapshot(q, (snapshot) => {
        const blocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(blocks);
    });
}
export async function addBlockedSlot(slotData) {
    await addDoc(collection(db, "blockedSlots"), slotData);
}
export async function removeBlockedSlot(slotId) {
    await deleteDoc(doc(db, "blockedSlots", slotId));
}

// --- USERS API ---
export async function getUserRole(uid) {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists() ? docSnap.data() : null;
}

// --- DASHBOARD API ---
export async function getAppointmentsForDateRange(startDate, endDate) {
    const q = query(collection(db, "appointments"), where("date", ">=", startDate), where("date", "<=", endDate));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
}