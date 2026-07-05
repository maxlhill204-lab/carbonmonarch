window.MONARCH_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCR8lZn2hpEclNwBw2-twmnr_9K8HRK1Bk",
  authDomain: "carbonmonarch-main.firebaseapp.com",
  projectId: "carbonmonarch-main",
  storageBucket: "carbonmonarch-main.firebasestorage.app",
  messagingSenderId: "844268539489",
  appId: "1:844268539489:web:3b430b6c2baf5b5f30a420",
  measurementId: "G-5RH8FPMTTN"
};

(function () {
  if (!window.firebase || !window.MONARCH_FIREBASE_CONFIG) return;
  if (!firebase.apps.length) {
    firebase.initializeApp(window.MONARCH_FIREBASE_CONFIG);
  }
  window.MONARCH_FIREBASE = {
    app: firebase.app(),
    auth: firebase.auth(),
    db: firebase.firestore(),
    googleProvider: new firebase.auth.GoogleAuthProvider()
  };
})();