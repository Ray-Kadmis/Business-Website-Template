"use client";
import React, { useState, useEffect } from "react";
import { db, auth } from "./firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  orderBy,
  increment,
} from "firebase/firestore";
import TimeSlotDropdown from "./timeSlotGen";

const Resform = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    date: "",
    time: "",
    service: "",
    age: "",
    message: "",
    gender: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(null);
  const COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutes in milliseconds
  const MAX_SUBMISSIONS_PER_DAY = 3;

  const services = ["Service 1", "Service 2", "Service 3"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhoneNumber = (phoneNumber) => {
    const re = /^\+[1-9]\d{1,14}$/;
    return re.test(phoneNumber);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      alert("Please wait while your previous submission is being processed.");
      return;
    }

    // Check cooldown period
    if (
      lastSubmissionTime &&
      Date.now() - lastSubmissionTime < COOLDOWN_PERIOD
    ) {
      const remainingTime = Math.ceil(
        (COOLDOWN_PERIOD - (Date.now() - lastSubmissionTime)) / 1000 / 60
      );
      alert(
        `Please wait ${remainingTime} minutes before submitting another appointment.`
      );
      return;
    }

    if (!validateEmail(formData.email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!validatePhoneNumber(formData.phoneNumber)) {
      alert(
        "Please enter a valid phone number in E.164 format (e.g., +14155552671)."
      );
      return;
    }

    if (!auth.currentUser) {
      alert("You must be logged in to submit an appointment.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check submission count for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pendingAppointmentsRef = collection(db, "Pending Appointments");

      // First, let's check if the index exists by making a simpler query
      try {
        // Simple query to check if the collection is accessible
        const basicQuery = query(
          pendingAppointmentsRef,
          where("userId", "==", auth.currentUser.uid)
        );
        await getDocs(basicQuery);

        // If that succeeds, try the full query
        const userAppointmentsQuery = query(
          pendingAppointmentsRef,
          where("userId", "==", auth.currentUser.uid),
          where("createdAt", ">=", today),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(userAppointmentsQuery);

        if (snapshot.size >= MAX_SUBMISSIONS_PER_DAY) {
          alert(
            `You have reached the maximum number of appointments (${MAX_SUBMISSIONS_PER_DAY}) for today. Please try again tomorrow.`
          );
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Query error details:", error);
        if (error.code === "failed-precondition") {
          // Log the full error for debugging
          console.error("Index error details:", {
            code: error.code,
            message: error.message,
            name: error.name,
            stack: error.stack,
          });

          // Try a fallback approach without the complex query
          const basicQuery = query(
            pendingAppointmentsRef,
            where("userId", "==", auth.currentUser.uid)
          );
          const basicSnapshot = await getDocs(basicQuery);

          // Filter the results in memory
          const todayAppointments = basicSnapshot.docs.filter((doc) => {
            const createdAt = doc.data().createdAt?.toDate();
            return createdAt && createdAt >= today;
          });

          if (todayAppointments.length >= MAX_SUBMISSIONS_PER_DAY) {
            alert(
              `You have reached the maximum number of appointments (${MAX_SUBMISSIONS_PER_DAY}) for today. Please try again tomorrow.`
            );
            setIsSubmitting(false);
            return;
          }
        } else {
          throw error; // Re-throw other errors
        }
      }

      // Reference to the user's appointment document
      const userAppointmentRef = doc(
        pendingAppointmentsRef,
        auth.currentUser.uid // Use just the user ID as the document ID for pending appointments
      );

      // Set the document data with merge option to update if exists
      await setDoc(
        userAppointmentRef,
        {
          ...formData,
          userId: auth.currentUser.uid,
          createdAt: new Date(),
          status: "pending",
          updatedAt: new Date(), // Add updatedAt field to track modifications
          submissionCount: increment(1), // Track number of submissions
        },
        { merge: true }
      ); // Use merge option to update existing document

      // Add to BookedSlots collection
      const bookedSlotsRef = collection(db, "BookedSlots");
      await setDoc(doc(bookedSlotsRef, `${formData.date}_${formData.time}`), {
        date: formData.date,
        time: formData.time,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      });

      setLastSubmissionTime(Date.now());
      console.log(
        "Appointment saved successfully for user: ",
        auth.currentUser.uid
      );
      alert("Your appointment has been submitted successfully!");
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        date: "",
        time: "",
        service: "",
        age: "",
        message: "",
        gender: "",
      });
    } catch (error) {
      console.error("Error saving appointment: ", error);
      alert(
        "There was an error submitting your appointment. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const minDate = `${year}-${month}-${day}`;

    const datePicker = document.getElementById("datePicker");
    if (datePicker) {
      datePicker.setAttribute("min", minDate);
    }
  }, []);

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto p-4 rounded-lg"
      >
        {/* First Name and Last Name */}
        <div className="mb-4 md:flex md:space-x-4">
          <div className="flex-1">
            <label className="block font-bold mb-2" htmlFor="firstName">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 border-2  text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex-1 mt-4 md:mt-0">
            <label className="block font-bold mb-2" htmlFor="lastName">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <label className="block font-bold mb-2" htmlFor="phoneNumber">
            Phone Number (E.164 format)
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="+14155552671"
            className="w-full px-3 py-2 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Date, Time, and Gender */}
        <div className="mb-4 md:flex md:space-x-4">
          <div className="flex-1">
            <label className="block font-bold mb-2" htmlFor="date">
              Select Date
            </label>
            <input
              type="date"
              id="datePicker"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex-1 mt-4 md:mt-0">
            <label className="block font-bold mb-2" htmlFor="time">
              Select Time
            </label>

            <TimeSlotDropdown formData={formData} setFormData={setFormData} />
          </div>

          <div className="flex-1 mt-4 md:mt-0">
            <label className="block font-bold mb-2">Gender</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={handleChange}
                  className="form-radio text-blue-500"
                  required
                />
                <span className="ml-2">Male</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={handleChange}
                  className="form-radio text-blue-500"
                />
                <span className="ml-2">Female</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={formData.gender === "other"}
                  onChange={handleChange}
                  className="form-radio text-blue-500"
                />
                <span className="ml-2">Other</span>
              </label>
            </div>
          </div>
        </div>

        {/* Age and Service */}
        <div className="mb-4 md:flex md:space-x-4">
          <div className="flex-1">
            <label className="block font-bold mb-2" htmlFor="age">
              Age
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-3 py-2 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex-1 mt-4 md:mt-0">
            <label className="block font-bold mb-2" htmlFor="service">
              Select Service
            </label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="w-full px-3 py-2 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select a service
              </option>
              {services.map((service, index) => (
                <option key={index} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <label className="block font-bold mb-2" htmlFor="message">
            Additional Information (optional, max 200 characters)
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full px-3 py-2 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            maxLength="200"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="mb-4">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Make Appointment
          </button>
        </div>
      </form>
    </div>
  );
};

export default Resform;
