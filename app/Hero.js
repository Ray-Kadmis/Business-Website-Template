import React from "react";

const Hero = () => {
  return (
    <div
      id="hero"
      className="hero bg-[url('https://images.pexels.com/photos/2832432/pexels-photo-2832432.png')] bg-cover bg-center offset-0"
    >
      <h1 className="text-center herotext1">
        Relieve Pain, Restore Health, Renew Life
      </h1>
      <h2 className="text-center p-4 herotext2">
        Experience expert chiropractic care that gets you back to living
        pain-free. Your wellness is our priority.
      </h2>
      <a href="#">
        <h3 className="text-center herotext3 underline hover:text-blue-400">
          Book Your Appointment Now!
        </h3>
      </a>
    </div>
  );
};

export default Hero;
