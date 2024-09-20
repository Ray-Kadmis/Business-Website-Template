"use client";
import React, { useState } from "react";
import Resform from "./resform";

const FormComponent = () => {

  return (
    <div class="flex w-screen flex-wrap my-20 border-2  border-blue-500">
      <div class="flex-1  px-6 bg-blue-500">
        <h1 className="apptext md:text-8xl my-10">SET UP AN APPOINTMENT?</h1>
        <p className="reviewspara">
          At [Your Company Name], our customers’ trust speaks through their
          reviews. We're proud to deliver quality service that consistently
          earns positive feedback. Join the many satisfied clients who have made
          us their trusted choice—read our reviews and see why!
        </p>
      </div>
      <div class="flex-1">
        <Resform></Resform>
      </div>
    </div>
  );
};

export default FormComponent;

// ok now make a sign up and login form that asks you to login or sign up if you dont already have an account if you do then login if ou dont then forward them to a sign up page, make sure that the email they enter to sign up is a valid email also take their phone number and make sure the number they  enter is a valid e164 format number,
