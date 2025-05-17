"use client";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Auth from "./Authformtoggler";
import Resform from "./resform";

const FormComponent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex w-screen flex-wrap my-20 border-y-2  border-blue-500">
      <div className="flex-1  px-6 bg-blue-500">
        <h1 className="apptext md:text-8xl my-10">NEED AN APPOINTMENT?</h1>
        <p className="reviewspara">
          At [Your Company Name], our customers’ trust speaks through their
          reviews. We're proud to deliver quality service that consistently
          earns positive feedback. Join the many satisfied clients who have made
          us their trusted choice—read our reviews and see why!
        </p>
      </div>
      <div className="flex-1">{user ? <Resform /> : <Auth />}</div>
    </div>
  );
};

export default FormComponent;

// ok now make a sign up and login form that asks you to login or sign up if you dont already have an account if you do then login if ou dont then forward them to a sign up page, make sure that the email they enter to sign up is a valid email also take their phone number and make sure the number they  enter is a valid e164 format number,
