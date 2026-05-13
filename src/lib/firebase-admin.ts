import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function privateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const key = privateKey();
  if (!projectId || !clientEmail || !key) {
    throw new Error("Missing Firebase Admin service account environment variables");
  }
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: key
    })
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export async function requireUser(idToken: string | null) {
  if (!idToken) throw new Error("Missing auth token");
  return getAdminAuth().verifyIdToken(idToken);
}

export async function requireAdmin(idToken: string | null) {
  const decoded = await requireUser(idToken);
  const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
  if (snap.data()?.role !== "admin") throw new Error("Admin access required");
  return decoded;
}
