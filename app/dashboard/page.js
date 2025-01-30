"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  UserCheck,
  Archive,
} from "lucide-react";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "@/app/firebaseConfig";

import { useRouter } from "next/navigation";

import ExportAppointments from "./ReportFunction";
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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !user.email) {
          throw new Error("No authenticated user found");
        }

        // Check user exists in 'users' collection
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("email", "==", user.email));
        const userSnapshot = await getDocs(userQuery);

        // Redirect if no matching user document
        if (userSnapshot.empty) {
          console.log("User not found in database:", user.email);
          router.push("/payment-reminder");
          return false;
        }

        // Verify email matches admin/user document
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        if (userData.email !== user.email) {
          console.log("Email mismatch with registered user");
          router.push("/payment-reminder");
          return false;
        }

        // Check creation date validity
        const createdAt = userData.createdAt.toDate();
        const expirationDate = new Date(createdAt);
        expirationDate.setDate(expirationDate.getDate() + 37); // 30 days + 7 days

        if (new Date() > expirationDate) {
          console.log("Account creation period expired (37 days)");
          router.push("/payment-reminder");
          return false;
        }
      } catch (error) {
        console.error("Payment check error:", error);

        return false;
      }
    };
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true);
        checkPaymentStatus(); // Check payment when admin logs in
        setIsLoading(true); // Add loading state
        await fetchAllAppointments(); // Fetch appointments when admin logs in
        setIsLoading(false);
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
  const handleArchive = async (id, appointmentData) => {
    try {
      // First, add the appointment to the archive collection
      const archiveRef = doc(db, "Archive", id);
      await setDoc(archiveRef, {
        ...appointmentData,
        archivedAt: new Date(),
      });

      // Then delete it from the attended appointments collection
      const attendedRef = doc(db, "Attended Appointments", id);
      await deleteDoc(attendedRef);

      // Refresh the appointments
      await fetchAllAppointments();
    } catch (error) {
      console.error("Error archiving appointment:", error);
    }
  };
  const handleStatusChange = async (id, oldStatus, newStatus) => {
    try {
      // Add confirmation dialog for attended status
      if (newStatus === "attended") {
        const isConfirmed = window.confirm(
          "Are you sure this appointment has been attended? This action will mark the appointment as completed."
        );
        if (!isConfirmed) {
          return; // Exit if user cancels
        }
      }

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
        {appointment.status === "attended" ? (
          <button
            onClick={() => handleArchive(appointment.id, appointment)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
        ) : (
          <>
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
          </>
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
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

          <ExportAppointments></ExportAppointments>
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
