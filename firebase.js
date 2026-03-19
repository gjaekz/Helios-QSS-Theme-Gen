import { firebaseConfig, hasFirebaseConfig } from "./firebase-config.js";

let db = null;
let storage = null;
let firebaseReady = false;
let firebaseFns = null;

if (hasFirebaseConfig()) {
  try {
    const firebaseAppModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const firebaseFirestoreModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    const firebaseStorageModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js");

    const app = firebaseAppModule.initializeApp(firebaseConfig);
    db = firebaseFirestoreModule.getFirestore(app);
    storage = firebaseStorageModule.getStorage(app);
    firebaseReady = true;
    firebaseFns = {
      addDoc: firebaseFirestoreModule.addDoc,
      collection: firebaseFirestoreModule.collection,
      doc: firebaseFirestoreModule.doc,
      getDocs: firebaseFirestoreModule.getDocs,
      increment: firebaseFirestoreModule.increment,
      orderBy: firebaseFirestoreModule.orderBy,
      query: firebaseFirestoreModule.query,
      serverTimestamp: firebaseFirestoreModule.serverTimestamp,
      updateDoc: firebaseFirestoreModule.updateDoc,
      ref: firebaseStorageModule.ref,
      uploadBytes: firebaseStorageModule.uploadBytes,
      uploadBytesResumable: firebaseStorageModule.uploadBytesResumable,
      getDownloadURL: firebaseStorageModule.getDownloadURL,
    };
  } catch (_error) {
    db = null;
    storage = null;
    firebaseReady = false;
    firebaseFns = null;
  }
}

export { db, storage, firebaseReady, firebaseFns };
