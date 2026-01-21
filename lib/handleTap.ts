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

  const tapEntry = {
    tappedAt: new Date().toISOString(),
    status: "scheduled",
  };

  try {
    await setDoc(
      userDocRef,
      {
        history: {
          [tapKind]: arrayUnion(tapEntry),
        },
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error updating tap array:", error);
    throw error;
  }
}

export async function testNotification() {
  const response = await fetch("api/notif", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tapKind: "normal",
      time: new Date(Date.now() + 30 * 1000).toISOString(),
      userId: auth.currentUser?.uid,
    }),
  });
  console.log(await response.json());
}

const settedTime: Record<TapKind, number> = {
  normal: 3 * 60 * 1000,
  ticket1: 22 * 60 * 60 * 1000,
  ticket2: 22 * 60 * 1000,
};

export async function scheduleNotification(tapKind: TapKind) {
  const response = await fetch("api/notif", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tapKind,
      time: new Date(Date.now() + settedTime[tapKind]).toISOString(),
      userId: auth.currentUser?.uid,
    }),
  });
  console.log(await response.json());
}
