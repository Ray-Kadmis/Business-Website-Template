import React from "react";

const Contact = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <h2 className=" text-white">ANY QUESTIONS?</h2>
      <h4 className="px-8 text-white">
        We'd love to hear from you! Feel free to reach out to us via email at
        your-email@example.com or give us a call at (phone number)
      </h4>
      <form className="max-w-lg  text-white m-8 p-4 bg-transparent border-2 bor rounded-xl">
        <div className="mb-4">
          <label className="block  text-sm font-bold mb-2" htmlFor="name">
            Full name
          </label>
          <input
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="name"
            type="text"
            placeholder="Enter your name"
          />
        </div>

        <div className="mb-4">
          <label className="block  text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="email"
            type="email"
            placeholder="Enter your email"
          />
        </div>

        <div className="mb-4">
          <label className="block  text-sm font-bold mb-2" htmlFor="phone">
            Phone Number
          </label>
          <input
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
          />
        </div>

        <div className="mb-4">
          <label className="block  text-sm font-bold mb-2" htmlFor="message">
            Message
          </label>
          <textarea
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="message"
            rows="4"
            placeholder="Enter your message"
          ></textarea>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
};

export default Contact;
