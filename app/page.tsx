"use client";

import { signInWithPopup, signOut } from "firebase/auth";
import { auth, authProvider } from "@/lib/firebase";
import { useState } from "react";
import { saveTapHistory } from "@/lib/handleTap";

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  function Signin() {
    const handleSignIn = async () => {
      try {
        await signInWithPopup(auth, authProvider);
      } catch (error) {
        console.error("Error signing in:", error);
        return;
      }
      setIsSignedIn(true);
      console.log("Signed in");
    };
    const handleSignOut = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out:", error);
        return;
      }
      setIsSignedIn(false);
      console.log("Signed out");
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
    </main>
  );
}
