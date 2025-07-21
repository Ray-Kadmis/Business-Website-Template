import { useState, useEffect, useRef } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import UserAppointments from "./components/UserAppointments";
import { ChevronDown, X } from "lucide-react";

const UserNav = () => {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const appointmentsBtnRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    signOut(auth).catch((error) => {
      console.error("Error signing out: ", error);
    });
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (!user) {
    return null; // Don't render anything if user is not logged in
  }

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center focus:outline-none"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center">
            {user.displayName?.charAt(0) || user.email?.charAt(0)}
          </div>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-max bg-white dark:bg-gray-600 rounded-md overflow-hidden shadow-xl z-10">
          <div className="flex-col ">
            <button
              ref={appointmentsBtnRef}
              onClick={() => setIsAppointmentsOpen((v) => !v)}
              className="flex items-center justify-between px-4 py-2 ease-in-out duration-200 text-sm text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 w-full text-left"
            >
              Appointments
              {isAppointmentsOpen ? (
                <X className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </button>
            {isAppointmentsOpen && (
              <UserAppointments
                isOpen={isAppointmentsOpen}
                onClose={() => setIsAppointmentsOpen(false)}
                anchorRef={appointmentsBtnRef}
              />
            )}
            <button
              onClick={handleSignOut}
              className="block px-4 py-2 ease-in-out duration-200 text-sm text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 w-full text-left"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNav;
