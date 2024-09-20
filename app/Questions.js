"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        className="flex justify-between items-center w-full py-4 px-6 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

const Questions = () => {
  const faqs = [
    {
      question: "?",
      answer:
        "React is a JavaScript library for building user interfaces, particularly single-page applications.",
    },
    {
      question: "?",
      answer:
        "Tailwind CSS is a utility-first CSS framework that allows you to build custom designs without ever leaving your HTML.",
    },
    {
      question: "?",
      answer:
        "Next.js is a React framework that enables functionality such as server-side rendering and generating static websites for React based web applications.",
    },
    {
      question: "?",
      answer:
        "React Hooks are functions that let you 'hook into' React state and lifecycle features from function components.",
    },
    {
      question: "?",
      answer:
        "React Hooks are functions that let you 'hook into' React state and lifecycle features from function components.",
    },
    {
      question: "?",
      answer:
        "React Hooks are functions that let you 'hook into' React state and lifecycle features from function components.",
    },
    {
      question: "?",
      answer:
        "React Hooks are functions that let you 'hook into' React state and lifecycle features from function components.",
    },
  ];

  return (
    <div className="flex justify-center items-center my-20 h-max">
      <div className="w-full max-w-6xl rounded-lg border-2 shadow-md">
      <h1 className=" text-center py-6">Frequently Asked Questions</h1>
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
};

export default Questions;
