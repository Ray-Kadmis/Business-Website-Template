import React from "react";
import Contact from "./Contact";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faTwitter,
  faInstagram,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
const footer = () => {
  return (
    <div className="footer bg-[url('https://images.pexels.com/photos/2832432/pexels-photo-2832432.png')]">
      <div className="footerCon">
        <div className="block w-screen md:flex flex-wrap">
          <div className="flex-1">
            <h2 className="text-center mb-24">MENU</h2>
            <div className="grid grid-cols-2 text-2xl">
              <ul className="space-y-24">
                <li>
                  <a href="#" className="hover:underline">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Staff
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Portfolio
                  </a>
                </li>
              </ul>
              <ul className="space-y-24">
                <li>
                  <a href="#" className="hover:underline">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Testimonials
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex-1">
            <Contact />
          </div>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          <a href="#" className="text-2xl text-blue-600 hover:text-blue-800">
            <FontAwesomeIcon icon={faFacebook} />
          </a>
          <a href="#" className="text-2xl text-blue-400 hover:text-blue-600">
            <FontAwesomeIcon icon={faTwitter} />
          </a>
          <a href="#" className="text-2xl text-pink-600 hover:text-pink-800">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="#" className="text-2xl text-blue-700 hover:text-blue-900">
            <FontAwesomeIcon icon={faLinkedin} />
          </a>
          <a href="#" className="text-2xl text-red-600 hover:text-red-800">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
        </div>
        <p className="fText pb-2 w-full text-center mt-8">
          © 2024 Rehan Zaheer. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default footer;
