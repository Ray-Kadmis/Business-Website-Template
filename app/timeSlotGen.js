"use client";
import React from "react";

// Generate 30-minute time slots from 9am to 5pm
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    // Add morning slots (on the hour)
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    // Add afternoon slots (1/4 after hour)
    // slots.push(`${hour.toString().padStart(2, "0")}:15`);
    // Add afternoon slots (half-hour)
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
    // Add afternoon slots (3/4 of the hour)
    // slots.push(`${hour.toString().padStart(2, "0")}:45`);
  }
  // Add final 5:00 PM slot
  return slots;
};

const TimeSlotDropdown = ({ formData, setFormData }) => {
  const timeSlots = generateTimeSlots();

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
      className=" px-3 py-2.5 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select a time slot</option>
      {timeSlots.map((slot) => (
        <option key={slot} value={slot}>
          {(() => {
            const [hours, minutes] = slot.split(":");
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? "PM" : "AM";
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
          })()}
        </option>
      ))}
    </select>
  );
};

export default TimeSlotDropdown;
