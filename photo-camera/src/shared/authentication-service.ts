import { Injectable, NgZone } from '@angular/core';
import * as auth from 'firebase/auth';
import { User } from './user';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  userData: any;
  constructor(
    public afStorage: AngularFireStorage,
    public afStore: AngularFirestore,
    public ngFireAuth: AngularFireAuth,
    public router: Router,
    public ngZone: NgZone
  ) {
    this.ngFireAuth.onAuthStateChanged((user) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
      } else {
        localStorage.setItem('user', '{}');
      }
    });
  }
  // Login in with email/password
  SignIn(email: any, password: any) {
    return this.ngFireAuth.signInWithEmailAndPassword(email, password);
  }
  async RegisterUser(email: string, password: string) {
    try {
      const result = await this.ngFireAuth.createUserWithEmailAndPassword(
        email,
        password
      );
      if (result && result.user) {
        // Send verification email
        await this.SendVerificationMail();

        // Save user data to Firestore
        const userData: User = {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          emailVerified: result.user.emailVerified || false,
        };
        await this.afStore
          .collection('user')
          .doc(result.user.uid)
          .set(userData);
      }
    } catch (error) {
      window.alert(error);
    }
  }
  // Email verification when new user register
  SendVerificationMail() {
    return this.ngFireAuth.currentUser.then((user: any) => {
      return user.sendEmailVerification().then(() => {
        this.router.navigate(['verify-email']);
      });
    });
  }

  // Recover password
  PasswordRecover(passwordResetEmail: any) {
    return this.ngFireAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert(
          'Password reset email has been sent, please check your inbox.'
        );
      })
      .catch((error) => {
        window.alert(error);
      });
  }
  // Returns true when user is looged in
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user !== null && user.emailVerified !== false ? true : false;
  }
  // Returns true when user's email is verified
  get isEmailVerified(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.emailVerified !== false ? true : false;
  }
  // Sign in with Gmail
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }
  // Auth providers
  AuthLogin(provider: any) {
    return this.ngFireAuth
      .signInWithPopup(provider)
      .then((result) => {
        this.ngZone.run(() => {
          this.router.navigate(['tabs']);
        });
        this.SetUserData(result.user);
      })
      .catch((error) => {
        window.alert(error);
      });
  }
  // Store user in localStorage
  SetUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afStore.doc(
      `users/${user.uid}`
    );
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
    return userRef.set(userData, {
      merge: true,
    });
  }
  checkLocalStorageUser(): User | null {
    const userString = localStorage.getItem('user');
    if (userString) {
      return JSON.parse(userString);
    }
    return null;
  }

  isUserAuthenticated(): boolean {
    return !!this.userData && !!this.userData.emailVerified;
  }
  getUserId() {
    if (this.checkLocalStorageUser()) {
      const user = this.checkLocalStorageUser();
      return user?.uid;
    }
    return this.userData?.uid || null;
  }
  // Sign-out
  SignOut() {
    return this.ngFireAuth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['/']);
    });
  }
}
