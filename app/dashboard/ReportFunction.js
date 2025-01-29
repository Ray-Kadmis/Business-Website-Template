import React, { useState } from "react";
import * as XLSX from "xlsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig.js"; // Adjust this import based on your Firebase config location

const ExportAppointments = () => {
  const [downloading, setDownloading] = useState(false);

  const exportToExcel = async () => {
    try {
      setDownloading(true);

      // Get all appointments from Firestore
      const appointmentsRef = collection(db, "Archive"); // Replace 'appointments' with your collection name
      const appointmentsSnapshot = await getDocs(appointmentsRef);

      // Transform the data into the desired format
      const data = appointmentsSnapshot.docs.map((doc) => {
        const appointment = doc.data();
        return {
          "Document ID": doc.id,
          "First Name": appointment.firstName,
          "Last Name": appointment.lastName,
          Email: appointment.email,
          Phone: appointment.phoneNumber,
          Date: appointment.date,
          Time: appointment.time,
          Service: appointment.service,
          Age: appointment.age,
          Gender: appointment.gender,
          Message: appointment.message,
          "Created At": appointment.createdAt.toDate().toLocaleString(), // Assuming createdAt is a Firestore timestamp
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Appointments");

      // Generate Excel file
      XLSX.writeFile(wb, "attendedAppointments.xlsx");

      setDownloading(false);
    } catch (error) {
      console.error("Error exporting data:", error);
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 justify-end">
      <button
        onClick={exportToExcel}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={downloading}
      >
        Get Archived Attended Appointments
      </button>

      {downloading && (
        <p className="mt-2 text-gray-600">
          Your download will begin shortly...
        </p>
      )}
    </div>
  );
};

export default ExportAppointments;
