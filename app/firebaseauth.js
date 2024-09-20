"use client";
import { useState } from "react";
import LoginForm from "./login";
import SignUpForm from "./signup";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl text-black font-bold mb-6 text-center">
        {isLogin
          ? "Please Login to Submit Appointment"
          : "Please Sign Up to Submit Appointment"}
      </h2>
      {isLogin ? <LoginForm /> : <SignUpForm />}
      <div className="mt-4 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-500 hover:underline"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};
export default Auth;
