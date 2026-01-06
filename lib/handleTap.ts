import { arrayUnion, doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

type TapKind = "normal" | "ticket1" | "ticket2";

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

export async function handleTap() {}
