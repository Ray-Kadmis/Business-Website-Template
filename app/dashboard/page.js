"use client";
import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle, XCircle, UserCheck } from "lucide-react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { initializeApp } from "firebase/app";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PRJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const ADMIN_EMAIL = "rehanworks200@gmail.com";

const statusIcons = {
  pending: Calendar,
  approved: CheckCircle,
  rejected: XCircle,
  attended: UserCheck,
};

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        fetchAppointments();
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchAppointments = async () => {
    try {
      const appointmentsRef = collection(db, "pendingAppointments");
      const appointmentsSnapshot = await getDocs(appointmentsRef);

      const fetchedAppointments = appointmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: "pending", // Set initial status to pending
        createdAt: doc.data().createdAt
          ? doc.data().createdAt.toDate()
          : new Date(), // Convert Firestore Timestamp to Date
      }));

      setAppointments(fetchedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const appointmentRef = doc(db, "pendingAppointments", id);

      // Remove from pending appointments
      await deleteDoc(appointmentRef);

      // Add to new status collection
      const newAppointmentRef = doc(db, `${newStatus}Appointments`, id);
      const appointmentToUpdate = appointments.find((app) => app.id === id);
      await setDoc(newAppointmentRef, {
        ...appointmentToUpdate,
        status: newStatus,
        updatedAt: new Date(),
      });

      // Update local state
      setAppointments(
        appointments.map((app) =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  const getAppointmentsByStatus = (status) => {
    return appointments.filter((appointment) => appointment.status === status);
  };

  const AppointmentCard = ({ appointment, onStatusChange }) => (
    <div className="shadow-md rounded-lg p-4 mb-4">
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
        <button
          onClick={() => onStatusChange(appointment.id, "rejected")}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Reject
        </button>
        <button
          onClick={() => onStatusChange(appointment.id, "approved")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Approve
        </button>
        <button
          onClick={() => onStatusChange(appointment.id, "attended")}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Attended
        </button>
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

  const handleSignIn = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Admin Access Only</h1>
        <button
          onClick={() => handleSignIn(ADMIN_EMAIL, "your-admin-password")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-24 px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(statusIcons).map(([status, Icon]) => (
          <div
            key={status}
            className=" rounded-lg shadow-md p-4 border"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">
                {status.charAt(0).toUpperCase() + status.slice(1)} Appointments
              </h3>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">
              {getAppointmentsByStatus(status).length}
            </p>
          </div>
        ))}
      </div>

      <div className="flex space-x-4 overflow-x-auto">
        <StatusColumn
          status="pending"
          appointments={getAppointmentsByStatus("pending")}
        />
        <StatusColumn
          status="approved"
          appointments={getAppointmentsByStatus("approved")}
        />
        <StatusColumn
          status="rejected"
          appointments={getAppointmentsByStatus("rejected")}
        />
        <StatusColumn
          status="attended"
          appointments={getAppointmentsByStatus("attended")}
        />
      </div>
    </div>
  );
};

export default Dashboard;
