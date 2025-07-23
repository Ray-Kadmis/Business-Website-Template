import { doc, setDoc, deleteDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import twilio from "twilio";
import { NextResponse } from "next/server";
import { db } from "@/app/firebaseConfig";
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function POST(request) {
  const { id, oldStatus, newStatus, appointmentData } = await request.json();

  try {
    // Update status in 'appointments' collection
    const appointmentRef = doc(db, "appointments", id);
    await updateDoc(appointmentRef, {
      status: newStatus,
      updatedAt: new Date(),
    });

    // If rejected, remove from BookedSlots
    if (newStatus === "rejected") {
      // Find the BookedSlot document for this date and time
      const bookedSlotsRef = collection(db, "BookedSlots");
      const q = query(
        bookedSlotsRef,
        where("date", "==", appointmentData.date),
        where("time", "==", appointmentData.time)
      );
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
    }

    // Prepare and send message
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

    try {
      // First try sending via WhatsApp
      await client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:${appointmentData.phoneNumber}`,
      });
      console.log("Message sent successfully via WhatsApp");
    } catch (whatsappError) {
      console.log(
        "WhatsApp message failed, falling back to SMS:",
        whatsappError.message
      );
      // If WhatsApp fails, fall back to SMS
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: appointmentData.phoneNumber,
      });
      console.log("Message sent successfully via SMS");
    }

    return NextResponse.json({
      message: "Appointment status updated and message sent successfully",
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return NextResponse.json(
      { message: "Error updating appointment status", error: error.message },
      { status: 500 }
    );
  }
}
