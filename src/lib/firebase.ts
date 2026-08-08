import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// PostureLab Firebase project (Spark/free plan). These web config values are
// safe to ship in client code — access is controlled by Firebase security
// rules and the authorized-domains list, not by hiding these identifiers.
const firebaseConfig = {
  apiKey: 'AIzaSyDDFGNrrHcBAKNUBueQMZbHsZ_GODfH-wI',
  authDomain: 'posturelab-8de24.firebaseapp.com',
  projectId: 'posturelab-8de24',
  storageBucket: 'posturelab-8de24.firebasestorage.app',
  messagingSenderId: '818405108614',
  appId: '1:818405108614:web:101c435834ee3d66129a07',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);
