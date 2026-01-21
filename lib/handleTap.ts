import { arrayUnion, doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type TapKind = "normal" | "ticket1" | "ticket2";

export async function handleTap(TapKind: TapKind) {
  saveTapHistory(TapKind);
  await scheduleNotification(TapKind);
}

export async function saveTapHistory(tapKind: TapKind) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const userDocRef = doc(db, "users", user.uid);

  try {
    await setDoc(
      userDocRef,
      {
        history: {
          [tapKind]: arrayUnion(new Date(Date.now()).toISOString()),
        },
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error updating tap array:", error);
    throw error;
  }
}

export async function notification(tapKind: TapKind, time: string) {
  const response = await fetch("api/notif", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tapKind: tapKind,
      time: time,
      userId: auth.currentUser?.uid,
    }),
  });
  console.log(await response.json());
}

import { settedTime } from "@/lib/presets";

export async function scheduleNotification(tapKind: TapKind) {
  const response = await fetch("api/notif", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tapKind: tapKind,
      time: new Date(Date.now() + settedTime[tapKind]).toISOString(),
      userId: auth.currentUser?.uid,
    }),
  });
  console.log(await response.json());
}
