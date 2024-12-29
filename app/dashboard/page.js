"use client";
import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle, XCircle, UserCheck } from "lucide-react";
import {
  getFirestore,
  collection,
  getDoc,
  getDocs,
  doc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: "website-template-31afe",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

const statusIcons = {
  pending: Calendar,
  approved: CheckCircle,
  rejected: XCircle,
  attended: UserCheck,
};

const Dashboard = () => {
  const [appointments, setAppointments] = useState({
    pending: [],
    approved: [],
    rejected: [],
    attended: [],
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    // const checkPaymentStatus = async () => {
    //   try {
    //     const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL; // Get admin email from env
    //     const paymentRef = doc(db, "payments", adminEmail);
    //     const paymentSnap = await getDoc(paymentRef);

    //     if (!paymentSnap.exists()) {
    //       console.log("No document found for email:", adminEmail);
    //       alert("Your subscription is inactive. Please renew to continue.");
    //       router.push("/payment-reminder");
    //       return;
    //     }

    //     const { paymentStatus, expiryDate } = paymentSnap.data();
    //     const now = new Date().getTime();

    //     if (paymentStatus === "active" && now < expiryDate) {
    //       console.log("Subscription is active.");
    //       fetchAllAppointments(); // Load appointments if payment is active
    //     } else {
    //       console.log("Subscription is inactive or expired.");
    //       alert("Your subscription is inactive. Please renew to continue.");
    //       router.push("/payment-reminder");
    //     }
    //   } catch (error) {
    //     console.error("Error checking payment status:", error);
    //     router.push("/payment-reminder");
    //   }
    // };
    const checkPaymentStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !user.email) {
          throw new Error("No authenticated user found");
        }

        const paymentRef = doc(db, "payments", user.email);
        const paymentSnap = await getDoc(paymentRef);

        if (!paymentSnap.exists()) {
          console.log("No payment document found for email:", user.email);
          router.push("/payment-reminder");
          return false;
        }

        const { paymentStatus, expiryDate } = paymentSnap.data();
        const now = new Date();

        // Convert Firestore Timestamp to Date
        const expiryDateTime = expiryDate.toDate();

        if (paymentStatus === "active" && now < expiryDateTime) {
          console.log(
            "Subscription is active until:",
            expiryDateTime.toLocaleString()
          );
          return true;
        } else {
          console.log(
            "Subscription status:",
            paymentStatus,
            "Expiry:",
            expiryDateTime.toLocaleString(),
            "Current time:",
            now.toLocaleString()
          );
          router.push("/payment-reminder");
          return false;
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        router.push("/payment-reminder");
        return false;
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true);
        checkPaymentStatus(); // Check payment when admin logs in
      } else {
        setIsAdmin(false);
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchAppointmentsByStatus = async (status) => {
    try {
      const collectionName =
        status === "pending"
          ? "Pending Appointments"
          : `${status.charAt(0).toUpperCase() + status.slice(1)} Appointments`;
      console.log(`Fetching from collection: ${collectionName}`);
      const appointmentsRef = collection(db, collectionName);
      const appointmentsSnapshot = await getDocs(appointmentsRef);
      if (appointmentsSnapshot.empty) {
        console.log(`No ${status} appointments found`);
        return [];
      }
      return appointmentsSnapshot.docs.map((doc) => {
        const data = doc.data();
        // Handle createdAt field: check if it's a Firestore Timestamp and convert it
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === "function") {
          createdAt = createdAt.toDate(); // Firestore Timestamp to Date
        } else if (createdAt && typeof createdAt === "string") {
          createdAt = new Date(createdAt); // Handle string dates
        }
        return {
          id: doc.id,
          ...data,
          status: status,
          createdAt: createdAt || new Date(), // Default to current date if missing
        };
      });
    } catch (error) {
      console.error(`Error fetching ${status} appointments:`, error);
      return [];
    }
  };
  // Fetch all appointments
  const fetchAllAppointments = async () => {
    const statuses = ["pending", "approved", "rejected", "attended"];
    const fetchedAppointments = {};
    try {
      for (const status of statuses) {
        fetchedAppointments[status] = await fetchAppointmentsByStatus(status);
      }
      setAppointments(fetchedAppointments);
    } catch (error) {
      console.error("Error fetching all appointments:", error);
    }
  };
  // Check and update expired appointments
  const checkAndUpdateAppointments = async () => {
    const updateExpiredAppointments = httpsCallable(
      functions,
      "updateExpiredAppointments"
    );
    try {
      const result = await updateExpiredAppointments();
      console.log("Appointments updated:", result.data);
      await fetchAllAppointments(); // Refresh appointments after update
    } catch (error) {
      console.error("Error updating expired appointments:", error);
    }
  };
  const handleStatusChange = async (id, oldStatus, newStatus) => {
    try {
      const appointmentToUpdate = appointments[oldStatus].find(
        (app) => app.id === id
      );
      if (!appointmentToUpdate) {
        console.error("Appointment not found");
        return;
      }
      const response = await fetch("/dashboard/api/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          oldStatus,
          newStatus,
          appointmentData: appointmentToUpdate,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update appointment status"
        );
      }
      const result = await response.json();
      console.log(result.message);
      // Refresh appointments
      await fetchAllAppointments();
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };
  const AppointmentCard = ({ appointment, onStatusChange }) => (
    <div className="shadow-md border rounded-lg p-4 mb-4">
      <div className="mb-4">
        <h3 className="font-bold">{`${appointment.firstName} ${appointment.lastName}`}</h3>
        <p>Email: {appointment.email}</p>
        <p>Phone: {appointment.phoneNumber}</p>
        <p>Date: {appointment.date}</p>
        <p>Time: {appointment.time}</p>
        <p>Service: {appointment.service}</p>
        <p>Age: {appointment.age}</p>
        <p>Gender: {appointment.gender}</p>
        <p>Message: {appointment.message}</p>
        <p>Created At: {appointment.createdAt.toLocaleString()}</p>
      </div>
      <div className="flex justify-between">
        {appointment.status !== "rejected" && (
          <button
            onClick={() =>
              onStatusChange(appointment.id, appointment.status, "rejected")
            }
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reject
          </button>
        )}
        {appointment.status !== "approved" && (
          <button
            onClick={() =>
              onStatusChange(appointment.id, appointment.status, "approved")
            }
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Approve
          </button>
        )}
        {appointment.status !== "attended" && (
          <button
            onClick={() =>
              onStatusChange(appointment.id, appointment.status, "attended")
            }
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Attended
          </button>
        )}
      </div>
    </div>
  );
  const StatusColumn = ({ status, appointments }) => (
    <div className="flex-1 p-4">
      <h2 className="text-lg font-bold mb-4">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </h2>
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
  if (isLoading) {
    return <div className="p-96">Loading...</div>;
  }
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Admin Access Only</h1>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  return (
    <div className="space-y-6 pt-24 px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 mx-4 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
          <button
            onClick={checkAndUpdateAppointments}
            className="px-4 py-2 bg-purple-500  text-white rounded hover:bg-purple-600"
          >
            Check for Expired Appointments
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(statusIcons).map(([status, Icon]) => (
          <div key={status} className="rounded-lg shadow-md p-4 border">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">
                {status.charAt(0).toUpperCase() + status.slice(1)} Appointments
              </h3>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{appointments[status].length}</p>
          </div>
        ))}
      </div>
      <div className="flex space-x-4 overflow-x-auto">
        {Object.entries(appointments).map(([status, appointmentList]) => (
          <StatusColumn
            key={status}
            status={status}
            appointments={appointmentList}
          />
        ))}
      </div>
    </div>
  );
};
export default Dashboard;
