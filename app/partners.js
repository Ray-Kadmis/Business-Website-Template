"use client";
import React from "react";
import Slider from "./slider";
 const customBreakpoints = {
   640: { slidesPerView: 1, spaceBetween: 10 },
   900: { slidesPerView: 4, spaceBetween: 15 },
   1200: { slidesPerView:6, spaceBetween: 20 },
 };
const slides = [
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://images.pexels.com/photos/8834489/pexels-photo-8834489.jpeg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://plus.unsplash.com/premium_photo-1676299910876-747eeb0c11dc?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://images.pexels.com/photos/8834489/pexels-photo-8834489.jpeg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://plus.unsplash.com/premium_photo-1676299910876-747eeb0c11dc?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://images.pexels.com/photos/8834489/pexels-photo-8834489.jpeg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://plus.unsplash.com/premium_photo-1676299910876-747eeb0c11dc?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://images.pexels.com/photos/8834489/pexels-photo-8834489.jpeg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://plus.unsplash.com/premium_photo-1676299910876-747eeb0c11dc?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://images.pexels.com/photos/8834489/pexels-photo-8834489.jpeg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://plus.unsplash.com/premium_photo-1676299910876-747eeb0c11dc?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://images.pexels.com/photos/8834489/pexels-photo-8834489.jpeg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://plus.unsplash.com/premium_photo-1676299910876-747eeb0c11dc?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://images.pexels.com/photos/8834489/pexels-photo-8834489.jpeg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://plus.unsplash.com/premium_photo-1676299910876-747eeb0c11dc?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  {
    bgColor: "bg-green-500",
    imageClass: "",
    images: [
      "https://images.pexels.com/photos/8834489/pexels-photo-8834489.jpeg",
    ],
  },
  {
    bgColor: "bg-violet-500",
    imageClass: "",
    images: [
      "https://plus.unsplash.com/premium_photo-1676299910876-747eeb0c11dc?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  {
    bgColor: "bg-orange-500",
    imageClass: "",
    images: [
      "https://images.pexels.com/photos/8834489/pexels-photo-8834489.jpeg",
    ],
  },
  {
    bgColor: "bg-pink-500",
    imageClass: "",
    images: [
      "https://plus.unsplash.com/premium_photo-1676299910876-747eeb0c11dc?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
  },
  // Add more slides...
];
const partners = () => {
  return (
    <div className="flex justify-center w-full items-center ">
      <Slider
        slides={slides}
        delay={200}
        breakpoints={customBreakpoints}
        additionalClass="partnerSlides"
        additionalClassParent="slideCon"
      />
    </div>
  );
};

export default partners;
