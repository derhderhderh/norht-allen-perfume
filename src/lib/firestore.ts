import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { defaultOptions } from "@/lib/default-options";
import type { EmailEvent, FragranceNote, PerfumeOrder, ProductOptions, PromoCode } from "@/lib/types";

export async function ensureUserProfile(uid: string, data: { name: string; email: string }) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...data,
      role: "customer",
      createdAt: serverTimestamp()
    });
  }
}

export async function updateUserProfile(uid: string, data: { name: string }) {
  await updateDoc(doc(db, "users", uid), data);
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid, ...snap.data() } as { uid: string; name: string; email: string; role: "customer" | "admin" }) : null;
}

export async function getActiveNotes() {
  const snap = await getDocs(query(collection(db, "notes"), where("active", "==", true)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as FragranceNote)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllNotes() {
  const snap = await getDocs(collection(db, "notes"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as FragranceNote)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveNote(note: Partial<FragranceNote> & Pick<FragranceNote, "name" | "category">) {
  const payload = {
    name: note.name,
    category: note.category,
    description: note.description || "",
    imageUrl: note.imageUrl || "",
    active: note.active ?? true,
    createdAt: note.createdAt || serverTimestamp()
  };

  if (note.id) {
    await updateDoc(doc(db, "notes", note.id), payload);
    return note.id;
  }

  const ref = await addDoc(collection(db, "notes"), payload);
  return ref.id;
}

export async function getProductOptions() {
  const snap = await getDoc(doc(db, "products", "options"));
  return snap.exists() ? (snap.data() as ProductOptions) : defaultOptions;
}

export async function saveProductOptions(options: ProductOptions) {
  await setDoc(doc(db, "products", "options"), options, { merge: true });
}

export async function getPromoCodes() {
  const snap = await getDocs(collection(db, "promoCodes"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as PromoCode)
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function savePromoCode(promo: Partial<PromoCode> & Pick<PromoCode, "code">) {
  const normalized = promo.code.trim().toUpperCase();
  const id = promo.id || normalized.toLowerCase();
  await setDoc(doc(db, "promoCodes", id), {
    code: normalized,
    description: promo.description || "100% off order",
    active: promo.active ?? true,
    percentOff: 100,
    createdAt: promo.createdAt || serverTimestamp()
  }, { merge: true });
  return id;
}

export async function getCustomerOrders(uid: string) {
  const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", uid), limit(50)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as PerfumeOrder)
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

export async function getAllOrders() {
  const snap = await getDocs(query(collection(db, "orders"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as PerfumeOrder)
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

export async function getEmailEvents() {
  const snap = await getDocs(query(collection(db, "emailEvents"), limit(100)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as EmailEvent)
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}
