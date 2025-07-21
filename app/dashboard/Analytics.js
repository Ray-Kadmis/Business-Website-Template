"use client";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/firebaseConfig";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const Analytics = () => {
  const [revenueData, setRevenueData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [timeRange, setTimeRange] = useState("month"); // month, week, year
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch all attended appointments
      const attendedRef = collection(db, "Attended Appointments");
      const attendedSnapshot = await getDocs(attendedRef);
      const appointments = attendedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      // Process data based on time range
      const now = new Date();
      const filteredAppointments = appointments.filter((app) => {
        const appDate = new Date(app.createdAt);
        switch (timeRange) {
          case "week":
            return appDate >= new Date(now.setDate(now.getDate() - 7));
          case "month":
            return appDate >= new Date(now.setMonth(now.getMonth() - 1));
          case "year":
            return appDate >= new Date(now.setFullYear(now.getFullYear() - 1));
          default:
            return true;
        }
      });

      // Prepare revenue over time data
      const revenueByDate = {};
      filteredAppointments.forEach((app) => {
        const date = new Date(app.createdAt).toLocaleDateString();
        if (!revenueByDate[date]) {
          revenueByDate[date] = 0;
        }
        revenueByDate[date] += parseFloat(app.price || 0);
      });

      const revenueData = Object.entries(revenueByDate).map(
        ([date, amount]) => ({
          date,
          amount,
        })
      );

      // Prepare service breakdown data
      const serviceRevenue = {};
      filteredAppointments.forEach((app) => {
        if (!serviceRevenue[app.service]) {
          serviceRevenue[app.service] = 0;
        }
        serviceRevenue[app.service] += parseFloat(app.price || 0);
      });

      const serviceData = Object.entries(serviceRevenue).map(
        ([service, amount]) => ({
          service,
          amount,
        })
      );

      setRevenueData(revenueData);
      setServiceData(serviceData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="p-6 ">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-4 py-2 rounded ${
              timeRange === "week" ? "bg-blue-500 text-white" : "bg-gray-500"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded ${
              timeRange === "month" ? "bg-blue-500 text-white" : "bg-gray-500"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange("year")}
            className={`px-4 py-2 rounded ${
              timeRange === "year" ? "bg-blue-500 text-white" : "bg-gray-500"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Over Time Chart */}
        <div className="bg-white p-4 dark:text-white dark:bg-black rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Revenue Breakdown */}
        <div className="bg-white p-4 dark:text-white dark:bg-black rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Service Revenue Breakdown
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="service" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Distribution Pie Chart */}
        <div className="bg-white p-4 dark:text-white dark:bg-black rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Service Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  dataKey="amount"
                  nameKey="service"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {serviceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-white dark:text-white dark:bg-black p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="space-y-4 ">
            <div>
              <p className="text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">
                $
                {revenueData
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600  ">Total Appointments</p>
              <p className="text-2xl font-bold">{revenueData.length}</p>
            </div>
            <div>
              <p className="text-gray-600 ">Average Revenue per Appointment</p>
              <p className="text-2xl font-bold">
                $
                {(
                  revenueData.reduce((sum, item) => sum + item.amount, 0) /
                  revenueData.length
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
