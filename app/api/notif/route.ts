import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { tapKind, time, userId } = await request.json();
    if (
      !tapKind ||
      !time ||
      !userId ||
      !process.env.ONESIGNAL_APIKEY ||
      !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.ONESIGNAL_APIKEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        include_external_user_ids: [userId],
        contents: {
          en: `You have a ${tapKind} scheduled for ${time}`,
        },
        send_after: time,
      }),
    });
    console.log(await response.text());
    if (response.ok) {
      return NextResponse.json({
        message: "Notification scheduled successfully",
      });
    } else {
      return NextResponse.json(
        { message: "Failed to schedule notification" },
        { status: response.status },
      );
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Failed to schedule notification" },
      { status: 500 },
    );
  }
}
