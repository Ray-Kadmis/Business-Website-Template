"use client";
import React, { useState } from "react";
import { db, auth } from "./firebaseConfig";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
const resform = () => {
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

    try {
      // Reference to the 'pending appointments' collection
      const pendingAppointmentsRef = collection(db, "Pending Appointments");

      // Reference to the document with the user's UID
      const userAppointmentRef = doc(
        pendingAppointmentsRef,
        auth.currentUser.uid
      );

      // Set the document data
      await setDoc(userAppointmentRef, {
        ...formData,
        createdAt: new Date(),
      });

      console.log(
        "Appointment saved successfully for user: ",
        auth.currentUser.uid
      );
      alert("Your appointment has been submitted successfully!");
      // Reset form or redirect user here
    } catch (error) {
      console.error("Error saving appointment: ", error);
      alert(
        "There was an error submitting your appointment. Please try again."
      );
    }
  };

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
              id="date"
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
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2 border-2 text-black border-x-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default resform;
