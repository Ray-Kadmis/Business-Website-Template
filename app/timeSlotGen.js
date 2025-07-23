import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

// Generate 30-minute time slots from 9am to 5pm
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

const TimeSlotDropdown = ({ formData, setFormData }) => {
  const timeSlots = generateTimeSlots();
  const [bookedTimes, setBookedTimes] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!formData.date) {
        setBookedTimes([]);
        setBlockedSlots([]);
        return;
      }
      // Fetch booked slots
      const bookedSlotsRef = collection(db, "BookedSlots");
      const q = query(bookedSlotsRef, where("date", "==", formData.date));
      const snapshot = await getDocs(q);
      const times = snapshot.docs.map((doc) => doc.data().time);
      setBookedTimes(times);

      // Fetch blocked slots
      const blockedRef = collection(db, "BlockedSlots");
      const blockedSnap = await getDocs(blockedRef);
      setBlockedSlots(blockedSnap.docs.map((doc) => doc.data()));
    };
    fetchBookedSlots();
  }, [formData.date]);

  // Helper to check if a slot is blocked
  const isSlotBlocked = (date, time) => {
    // Block all weekends
    const dayOfWeek = new Date(date).getDay(); // 0=Sun, 6=Sat
    if (blockedSlots.some((slot) => slot.type === "weekend") && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return true;
    }
    // Block specific day of week
    if (blockedSlots.some((slot) => slot.type === "dayOfWeek" && slot.day && slot.day.toLowerCase() === ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][dayOfWeek])) {
      return true;
    }
    // Block specific date
    if (blockedSlots.some((slot) => slot.type === "date" && slot.date === date)) {
      return true;
    }
    // Block specific time on date
    if (blockedSlots.some((slot) => slot.type === "dateTime" && slot.date === date && slot.time === time)) {
      return true;
    }
    return false;
  };

  const handleTimeChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      time: event.target.value,
    }));
  };

  return (
    <select
      value={formData.time}
      onChange={handleTimeChange}
      className="px-3 py-2.5 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select a time slot</option>
      {timeSlots.map((slot) => (
        <option
          key={slot.value}
          value={slot.value}
          disabled={bookedTimes.includes(slot.value) || isSlotBlocked(formData.date, slot.value)}
        >
          {slot.display}
          {bookedTimes.includes(slot.value) ? " (Booked)" : ""}
          {isSlotBlocked(formData.date, slot.value) ? " (Blocked)" : ""}
        </option>
      ))}
    </select>
  );
};

export default TimeSlotDropdown;
