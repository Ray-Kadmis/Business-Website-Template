import React from "react";
import Cards from "./cards";
const Services = () => {
  return (
    <div className="services items-center">
      <h1 className="text-center">SERVICES</h1>
      <div className="cardContainer">
        <Cards
          imageSrc="https://images.pexels.com/photos/2832432/pexels-photo-2832432.png"
          description="This is a description for the second card."
          newClass="CardStyling"
        ></Cards>
        <Cards
          imageSrc="https://images.pexels.com/photos/2832432/pexels-photo-2832432.png"
          description="This is a description for the second card."
          newClass="CardStyling"
        ></Cards>
        <Cards
          imageSrc="https://images.pexels.com/photos/2832432/pexels-photo-2832432.png"
          description="This is a description for the second card."
          newClass="CardStyling"
        ></Cards>
        <Cards
          imageSrc="https://images.pexels.com/photos/2832432/pexels-photo-2832432.png"
          description="This is a description for the second card."
          newClass="CardStyling"
        ></Cards>
        <Cards
          imageSrc="https://images.pexels.com/photos/2832432/pexels-photo-2832432.png"
          description="This is a description for the second card."
          newClass="CardStyling"
        ></Cards>
        <Cards
          imageSrc="https://images.pexels.com/photos/2832432/pexels-photo-2832432.png"
          description="This is a description for the second card."
          newClass="CardStyling"
        ></Cards>
      </div>
    </div>
  );
};

export default Services;
