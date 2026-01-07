import { arrayUnion, doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type TapKind = "normal" | "ticket1" | "ticket2";

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

export async function handleTap() {}
