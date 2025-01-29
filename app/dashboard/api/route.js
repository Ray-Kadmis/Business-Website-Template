
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import twilio from "twilio";
import { NextResponse } from "next/server";
import { db } from "@/app/firebaseConfig";
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function POST(request) {
  const { id, oldStatus, newStatus, appointmentData } = await request.json();

  try {
    const oldCollectionName =
      oldStatus === "pending"
        ? "Pending Appointments"
        : `${
            oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)
          } Appointments`;
    const newCollectionName = `${
      newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
    } Appointments`;

    // Remove from old collection
    await deleteDoc(doc(db, oldCollectionName, id));

    // Add to new status collection
    await setDoc(doc(db, newCollectionName, id), {
      ...appointmentData,
      status: newStatus,
      updatedAt: new Date(),
    });

    console.log(
      `Appointment moved from ${oldCollectionName} to ${newCollectionName}`
    );
    // Prepare and send SMS
    let message = "";
    switch (newStatus) {
      case "rejected":
        message = `Dear ${appointmentData.firstName}, we regret to inform you that your appointment has been rejected. Please contact us for more information.`;
        break;
      case "approved":
        message = `Dear ${appointmentData.firstName}, your appointment has been approved. We look forward to seeing you!`;
        break;
      case "attended":
        message = `Dear ${appointmentData.firstName}, thank you for attending your appointment. We hope you had a great experience!`;
        break;
      default:
        message = `Dear ${appointmentData.firstName}, the status of your appointment has been updated to ${newStatus}.`;
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: appointmentData.phoneNumber,
    });

    return NextResponse.json({
      message: "Appointment status updated and SMS sent successfully",
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return NextResponse.json(
      { message: "Error updating appointment status", error: error.message },
      { status: 500 }
    );
  }
}
