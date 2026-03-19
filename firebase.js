import { firebaseConfig, hasFirebaseConfig } from "./firebase-config.js";

let auth = null;
let db = null;
let storage = null;
let firebaseReady = false;
let firebaseFns = null;
let currentUserId = "";
let authReady = Promise.resolve("");

if (hasFirebaseConfig()) {
  try {
    const firebaseAppModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const firebaseAuthModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
    const firebaseFirestoreModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    const firebaseStorageModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js");

    const app = firebaseAppModule.initializeApp(firebaseConfig);
    auth = firebaseAuthModule.getAuth(app);
    db = firebaseFirestoreModule.getFirestore(app);
    storage = firebaseStorageModule.getStorage(app);
    authReady = firebaseAuthModule.signInAnonymously(auth).then((result) => {
      currentUserId = result.user.uid;
      return currentUserId;
    });
    firebaseReady = true;
    firebaseFns = {
      addDoc: firebaseFirestoreModule.addDoc,
      collection: firebaseFirestoreModule.collection,
      deleteDoc: firebaseFirestoreModule.deleteDoc,
      doc: firebaseFirestoreModule.doc,
      getDocs: firebaseFirestoreModule.getDocs,
      increment: firebaseFirestoreModule.increment,
      orderBy: firebaseFirestoreModule.orderBy,
      query: firebaseFirestoreModule.query,
      serverTimestamp: firebaseFirestoreModule.serverTimestamp,
      updateDoc: firebaseFirestoreModule.updateDoc,
      deleteObject: firebaseStorageModule.deleteObject,
      ref: firebaseStorageModule.ref,
      uploadBytes: firebaseStorageModule.uploadBytes,
      uploadBytesResumable: firebaseStorageModule.uploadBytesResumable,
      getDownloadURL: firebaseStorageModule.getDownloadURL,
    };
  } catch (_error) {
    auth = null;
    db = null;
    storage = null;
    firebaseReady = false;
    firebaseFns = null;
    currentUserId = "";
    authReady = Promise.resolve("");
  }
}

export { auth, authReady, currentUserId, db, storage, firebaseReady, firebaseFns };
