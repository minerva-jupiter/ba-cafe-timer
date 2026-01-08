import { arrayUnion, doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type TapKind = "normal" | "ticket1" | "ticket2";

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

export async function handleTap(tapKind: TapKind) {
  await saveTapHistory(tapKind);
  // check whether notification is needed
  // limit time 4:00 or 16:00
  if (
    tapKind === "normal" &&
    ![1, 2, 3, 13, 14, 15].includes(new Date().getHours())
  ) {
    await notification(
      tapKind,
      new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    );
  }
  if (tapKind === "ticket1") {
    await notification(
      tapKind,
      new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    );
  }
  if (tapKind === "ticket2") {
    await notification(
      tapKind,
      new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    );
  }
}
