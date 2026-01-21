import { TapKind } from "./handleTap";

export const notifMessages: Record<TapKind, string> = {
  normal: "Your students are waiting in cafe.",
  ticket1: "Invcention tiket of first cafe is available.",
  ticket2: "Invcention tiket of first cafe is available.",
};

export const settedTime: Record<TapKind, number> = {
  normal: 3 * 60 * 1000,
  ticket1: 22 * 60 * 60 * 1000,
  ticket2: 22 * 60 * 1000,
};
