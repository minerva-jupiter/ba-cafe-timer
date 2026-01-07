"use client";

import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, authProvider } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { saveTapHistory, testNotification } from "@/lib/handleTap";
import OneSignal from "react-onesignal";

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsSignedIn(true);
        const userId = user.uid;

        try {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          });

          await OneSignal.login(userId);
          console.log("OneSignal login successful");
        } catch (error) {
          console.error("OneSignal operation failed:", error);
        }
      } else {
        setIsSignedIn(false);
        console.log("User is signed out");
      }
    });

    return () => unsubscribe();
  }, []);
  function Signin() {
    const handleSignIn = async () => {
      try {
        await signInWithPopup(auth, authProvider);
        console.log("Sign-in popup successful");
      } catch (error) {
        console.error("Error signing in:", error);
      }
    };
    const handleSignOut = async () => {
      try {
        await signOut(auth);
        console.log("Signed out");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    };
    if (isSignedIn == false) {
      return <button onClick={handleSignIn}>Sign in with Google</button>;
    } else {
      return <button onClick={handleSignOut}>Sign out</button>;
    }
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Café Timer
      </h1>
      {Signin()}

      <button onClick={() => saveTapHistory("normal")}>Save Tap History</button>
      <button onClick={() => testNotification()}>Schedule Notification</button>
    </main>
  );
}
