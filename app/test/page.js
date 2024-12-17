"use client";
import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalendarComponent = () => {
  const [date, setDate] = useState(new Date());

  const isDateDisabled = (date) => {
    const today = new Date();
    return date < today; // Disable dates before today
  };

  return (
    <Calendar
      onChange={setDate}
      value={date}
      tileDisabled={({ date }) => isDateDisabled(date)}
    />
  );
};

export default CalendarComponent;
