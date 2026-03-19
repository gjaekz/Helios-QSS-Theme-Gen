export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => typeof value === "string" && value.trim().length > 0);
}
