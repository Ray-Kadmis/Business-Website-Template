"use client";
import Slider from "./slider";
const slidesData = [
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://example.com/image3.jpg",
      "https://example.com/image4.jpg",
      "https://example.com/image5.jpg",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://example.com/image3.jpg",
      "https://example.com/image4.jpg",
      "https://example.com/image5.jpg",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://example.com/image3.jpg",
      "https://example.com/image4.jpg",
      "https://example.com/image5.jpg",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://example.com/image3.jpg",
      "https://example.com/image4.jpg",
      "https://example.com/image5.jpg",
    ],
  },
  {
    bgColor: "bg-red-500", // Custom background color for this slide
    imageClass: "", // Custom class for all images in this slide
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
  },
  {
    bgColor: "bg-blue-500",
    imageClass: "",
    images: [
      "https://example.com/image3.jpg",
      "https://example.com/image4.jpg",
      "https://example.com/image5.jpg",
    ],
  },
  // Add more slides...
];
const testimonials = () => {
  return (
    <div className="flex w-screen flex-wrap">
      <div className="flex-1 px-6  bg-blue-500">
        <h1 className="text-6xl apptext my-10 lg:text-8xl">
          TRUSTED BY CUSTOMERS
        </h1>
        <p className="reviewspara">
          At [Your Company Name], our customers’ trust speaks through their
          reviews. We're proud to deliver quality service that consistently
          earns positive feedback. Join the many satisfied clients who have made
          us their trusted choice—read our reviews and see why!
        </p>
      </div>
      <div className="flex-1 bg-red-500">
        <Slider slides={slidesData} />
      </div>
    </div>
  );
};

export default testimonials;
