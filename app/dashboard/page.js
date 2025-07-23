"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  UserCheck,
  Archive,
  BarChart2,
} from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "@/app/firebaseConfig";

import { useRouter } from "next/navigation";

import ExportAppointments from "./ReportFunction";
import Analytics from "./Analytics";

// Generate 30-minute time slots from 9am to 5pm (same as customer form)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    // Add morning slots (on the hour)
    const hourStr = hour.toString().padStart(2, "0");
    slots.push({
      value: `${hourStr}:00`,
      display: `${hour % 12 || 12}:00 ${hour >= 12 ? "PM" : "AM"}`,
    });
    // Add afternoon slots (half-hour)
    slots.push({
      value: `${hourStr}:30`,
      display: `${hour % 12 || 12}:30 ${hour >= 12 ? "PM" : "AM"}`,
    });
  }
  return slots;
};

const statusIcons = {
  pending: Calendar,
  approved: CheckCircle,
  rejected: XCircle,
  attended: UserCheck,
};
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("datePicker").setAttribute("min", today);
 
const Dashboard = () => {
  const [appointments, setAppointments] = useState({
    pending: [],
    approved: [],
    rejected: [],
    attended: [],
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState(null);
  const router = useRouter();
  // Blocked slots state
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [blockDate, setBlockDate] = useState("");
  const [blockTime, setBlockTime] = useState("");
  const [blockWeekend, setBlockWeekend] = useState(false);
  const [blockDayOfWeek, setBlockDayOfWeek] = useState("");

  // Get today's date in YYYY-MM-DD format

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !user.email) {
          throw new Error("No authenticated user found");
        }

        // Call the check-subscription endpoint
        const res = await fetch("/dashboard/api/stripe/check-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });

        const data = await res.json();

        if (!data.access) {
          console.log("Subscription check failed:", data.error);
          // If there's a specific redirect path in the response, use it
          router.push(data.redirect || "/payment-reminder");
          return false;
        }

        // If we have subscription data, we can use it to show trial status, etc.
        if (data.subscription) {
          const { is_trial, days_remaining, cancel_at_period_end } =
            data.subscription;

          // You can use this data to show appropriate UI messages
          if (is_trial) {
            console.log(`Trial active, ${days_remaining} days remaining`);
          }
          if (cancel_at_period_end) {
            console.log("Subscription will end at period end");
          }
        }

        return true;
      } catch (error) {
        console.error("Payment check error:", error);
        router.push("/payment-reminder");
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

  // Fetch blocked slots
  useEffect(() => {
    const fetchBlockedSlots = async () => {
      const blockedRef = collection(db, "BlockedSlots");
      const snapshot = await getDocs(blockedRef);
      setBlockedSlots(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchBlockedSlots();
  }, []);

  // Add block
  const handleBlockSlot = async () => {
    if (blockWeekend) {
      await addDoc(collection(db, "BlockedSlots"), { type: "weekend" });
    } else if (blockDayOfWeek) {
      await addDoc(collection(db, "BlockedSlots"), {
        type: "dayOfWeek",
        day: blockDayOfWeek,
      });
    } else if (blockDate && blockTime) {
      await addDoc(collection(db, "BlockedSlots"), {
        type: "dateTime",
        date: blockDate,
        time: blockTime,
      });
    } else if (blockDate) {
      await addDoc(collection(db, "BlockedSlots"), {
        type: "date",
        date: blockDate,
      });
    }
    setBlockWeekend(false);
    setBlockDayOfWeek("");
    setBlockDate("");
    setBlockTime("");
    // Refresh
    const blockedRef = collection(db, "BlockedSlots");
    const snapshot = await getDocs(blockedRef);
    setBlockedSlots(
      snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  // Unblock
  const handleUnblockSlot = async (id) => {
    await deleteDoc(doc(db, "BlockedSlots", id));
    setBlockedSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  // Replace fetchAppointmentsByStatus and fetchAllAppointments with a single fetchAllAppointments that fetches from 'appointments' and groups by status
  const fetchAllAppointments = async () => {
    try {
      const appointmentsRef = collection(db, "appointments");
      const appointmentsSnapshot = await getDocs(appointmentsRef);
      const grouped = { pending: [], approved: [], rejected: [], attended: [] };
      appointmentsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === "function") {
          createdAt = createdAt.toDate();
        } else if (createdAt && typeof createdAt === "string") {
          createdAt = new Date(createdAt);
        }
        const status = data.status || "pending";
        if (grouped[status]) {
          grouped[status].push({ id: doc.id, ...data, createdAt });
        }
      });
      setAppointments(grouped);
    } catch (error) {
      console.error("Error fetching all appointments:", error);
    }
  };

  // Update handleStatusChange to only update the status field in the same document in 'appointments'
  const handleStatusChange = async (id, oldStatus, newStatus) => {
    try {
      if (newStatus === "attended") {
        const isConfirmed = window.confirm(
          "Are you sure this appointment has been attended? This action will mark the appointment as completed."
        );
        if (!isConfirmed) {
          return;
        }
      }
      const appointmentToUpdate = appointments[oldStatus].find(
        (app) => app.id === id
      );
      if (!appointmentToUpdate) {
        console.error("Appointment not found");
        return;
      }
      // Call API route to update status and send Twilio message
      await fetch("/dashboard/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          oldStatus,
          newStatus,
          appointmentData: appointmentToUpdate,
        }),
      });
      await fetchAllAppointments();
    } catch (error) {
      console.error("Error updating appointment status:", error);
      alert("Failed to update appointment status. Please try again.");
    }
  };
  const AppointmentCard = ({ appointment, onStatusChange }) => (
    <div className="shadow-md border border-black dark:border-white rounded-lg p-4 mb-4">
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
  const StatusCard = ({ status, count, Icon, isActive }) => (
    <div
      className={`rounded-lg shadow-md p-4 transition-all duration-200 
        ${
          isActive
            ? "border-2 border-blue-500"
            : "border border-black dark:border-white"
        } 
        sm:cursor-default  sm:pointer-events-none
        cursor-pointer hover:bg-gray-700`}
      onClick={() => {
        if (window.innerWidth < 640) {
          setActiveStatus(isActive ? null : status);
        }
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">
          {status.charAt(0).toUpperCase() + status.slice(1)} Appointments
        </h3>
        <Icon className={`h-4 w-4 ${isActive ? "text-blue-500" : ""}`} />
      </div>
      <p className="text-2xl font-bold">{count}</p>
    </div>
  );
  const StatusAppointments = ({ status, appointments }) => {
    if (!appointments.length) {
      return (
        <div className="p-4 text-center text-gray-500 border border-black dark:border-white rounded-lg">
          No {status} appointments
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    );
  };
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
          <ExportAppointments />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(statusIcons).map(([status, Icon]) => (
          <StatusCard
            key={status}
            status={status}
            count={appointments[status].length}
            Icon={Icon}
            isActive={activeStatus === status}
          />
        ))}
      </div>
      <div className="block sm:hidden mb-4">
        {activeStatus && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <StatusAppointments
              status={activeStatus}
              appointments={appointments[activeStatus]}
            />
          </div>
        )}
      </div>
      <div className="hidden sm:flex space-x-4 overflow-x-auto">
        {Object.entries(appointments).map(([status, appointmentList]) => (
          <StatusColumn
            key={status}
            status={status}
            appointments={appointmentList}
          />
        ))}
      </div>

      {/* Blocked Slots Admin Section */}
      <div className="mt-8 border-t pt-8 dark:border-white">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
          Block/Unblock Slots
        </h2>
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label className="flex items-center gap-2 dark:text-white">
              <input
                type="checkbox"
                checked={blockWeekend}
                onChange={() => setBlockWeekend((v) => !v)}
                className="rounded dark:bg-gray-700"
              />
              Block all weekends
            </label>
            <label className="flex items-center gap-2 dark:text-white">
              Block specific day of week:
              <select
                value={blockDayOfWeek}
                onChange={(e) => setBlockDayOfWeek(e.target.value)}
                className="rounded dark:bg-gray-700"
              >
                <option value="">Select day</option>
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label className="flex items-center gap-2 dark:text-white">
              Block specific date:
              <input
                type="date"
                id="datePicker"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="rounded dark:bg-gray-700"
              />
            </label>
            <label className="flex items-center gap-2 dark:text-white">
              Block specific time on selected date:
              <select
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                className="rounded dark:bg-gray-700"
              >
                <option value="">Select time slot</option>
                {generateTimeSlots().map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.display}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="bg-blue-500 text-white w-max px-4 py-2 rounded dark:bg-blue-600"
              onClick={handleBlockSlot}
            >
              Block
            </button>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="font-bold mb-2 dark:text-white">
            Currently Blocked Slots:
          </h3>
          <ul className="list-disc pl-4">
            {blockedSlots.map((slot) => (
              <li
                key={slot.id}
                className="mb-1 flex items-center gap-2 dark:text-white"
              >
                {slot.type === "weekend" && <span>All weekends</span>}
                {slot.type === "dayOfWeek" && (
                  <span>
                    Every {slot.day.charAt(0).toUpperCase() + slot.day.slice(1)}
                  </span>
                )}
                {slot.type === "date" && <span>Date: {slot.date}</span>}
                {slot.type === "dateTime" && (
                  <span>
                    Date: {slot.date}, Time: {slot.time}
                  </span>
                )}
                <button
                  className="ml-2 px-2 py-1 bg-red-500 text-white rounded dark:bg-red-600"
                  onClick={() => handleUnblockSlot(slot.id)}
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Analytics Section */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart2 className="h-6 w-6" />
          Analytics
        </h2>
        <Analytics />
      </div>
    </div>
  );
};
export default Dashboard;
