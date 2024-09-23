"use client";
import { Link } from "lucide-react";
import { useState, useEffect } from "react";
import UserNav from "./UserNav";
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState("light"); // Default theme is light

  // Get the current theme from localStorage when the component mounts
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  // Toggle the theme between light and dark mode
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Toggle the menu in mobile view
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar fixed w-screen z-20 top-0 bg-white/0 backdrop-blur-lg p-2 dark:bg-white/30">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-xl font-semibold space-x-2">Logo</span>
        </div>

        {/* Navigation as */}
        <div
          className={`hidden md:flex  space-x-6 ${
            isOpen ? "block" : "hidden "
          } md:block`}
        >
          <a href="/" className="block NavTag">
            Home
          </a>
          <a href="/about" className="NavTag">
            About
          </a>
          <a href="/services" className="NavTag">
            Services
          </a>
          <a href="/news" className="NavTag">
            News
          </a>
          <a href="/career" className="NavTag">
            Career
          </a>
          <a href="/contact" className="NavTag">
            Contact Us
          </a>
        </div>

        {/* Make Appointment Button and Dark Mode Switch */}
        <div className="flex items-center justify-items-center justify-between space-x-4">
          <a href="/AppointmentForm.js">
            <button className="hidden md:block h-9 rounded-full hover:shadow-lg  text-white w-40 font-semibold dark:bg-black/40">
              Set Appointment
            </button>
          </a>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 m-0  dark:bg-white/50 rounded-full hover:shadow-lg relative"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          {/* Mobile menu toggle button */}
          <UserNav></UserNav>
          <button
            onClick={toggleMenu}
            className=" md:hidden focus:outline-none"
          >
            <svg
              className="w-6 h-6 m-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Dropdown menu for small screens */}
      <div
        className={`md:hidden  transition-all duration-500 ease-in-out ${
          isOpen
            ? "max-h-96 opacity-100 "
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="space-y-2 px-2 pb-0  pt-2">
          <a href="/" className="block NavTag">
            Home
          </a>
          <a href="/about" className="block NavTag">
            About
          </a>
          <a href="/make-appointment" className="block  NavTag">
            Make Appointment
          </a>
          <a href="/services" className="block NavTag">
            Services
          </a>
          <a href="/news" className="block NavTag">
            News
          </a>
          <a href="/career" className="block NavTag">
            Career
          </a>
          <a href="/contact" className="block NavTag">
            Contact Us
          </a>
        </div>
      </div>
    </nav>
  );
}
