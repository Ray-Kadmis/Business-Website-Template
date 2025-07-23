"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/app/firebaseConfig";
import { Calendar, CheckCircle, XCircle, UserCheck } from "lucide-react";

const statusIcons = {
  pending: Calendar,
  approved: CheckCircle,
  rejected: XCircle,
  attended: UserCheck,
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};

const UserAppointments = ({ isOpen, onClose, anchorRef }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const appointmentsRef = collection(db, "appointments");
      const q = query(appointmentsRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      
      const allAppointments = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        allAppointments.push({
          id: doc.id,
          ...data,
          status: data.status || 'pending', // Default to pending if status is not set
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        });
      });
      
      allAppointments.sort((a, b) => b.createdAt - a.createdAt);
      setAppointments(allAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchAppointments();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        (!anchorRef ||
          !anchorRef.current ||
          !anchorRef.current.contains(e.target))
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="flex-col right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-xl z-20 border border-gray-200 dark:border-gray-700 p-2"
      style={{ minWidth: "1 rem", maxHeight: "60vh", overflowY: "auto" }}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-16">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : appointments.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">
          No appointments found
        </p>
      ) : (
        <div className="space-y-2">
          {appointments.map((appointment) => {
            const StatusIcon = statusIcons[appointment.status];
            return (
              <div
                key={appointment.id}
                className="border border-gray-100 dark:border-gray-700 rounded p-2 text-xs flex flex-col gap-1 bg-gray-50 dark:bg-gray-900"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold truncate">
                    {appointment.firstName} {appointment.lastName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      statusColors[appointment.status]
                    } text-[10px]`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>
                    <b>Date:</b> {appointment.date}
                  </span>
                  <span>
                    <b>Time:</b> {appointment.time}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>
                    <b>Service:</b> {appointment.service}
                  </span>
                  <span>
                    <b>Phone:</b> {appointment.phoneNumber}
                  </span>
                </div>
                {appointment.message && (
                  <div className="truncate">
                    <b>Msg:</b> {appointment.message}
                  </div>
                )}
                <div className="text-right mt-1">
                  <span className="text-[10px] text-gray-400">
                    {appointment.createdAt.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserAppointments;
