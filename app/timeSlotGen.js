import React from "react";

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
        <option key={slot.value} value={slot.value}>
          {slot.display}
        </option>
      ))}
    </select>
  );
};

export default TimeSlotDropdown;
