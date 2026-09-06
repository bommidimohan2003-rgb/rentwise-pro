import type { FirebaseApp } from "firebase/app";
import type {
  Auth,
  User as FirebaseUser,
  NextOrObserver,
  Unsubscribe,
} from "firebase/auth";

export const app: FirebaseApp | null = null;
export const auth: Auth | null = null;
export const googleProvider = null;

export async function upsertFirestoreUser() {
  return;
}

export async function signInWithGooglePopup() {
  return null;
}

export async function handleRedirectResult() {
  return null;
}

export async function signOutFirebase() {
  return;
}

export function onAuthStateChanged(
  _nextOrObserver: NextOrObserver<FirebaseUser>,
): Unsubscribe {
  return () => {};
}

export function onIdTokenChanged(
  _nextOrObserver: NextOrObserver<FirebaseUser>,
): Unsubscribe {
  return () => {};
}

export { type FirebaseUser };
