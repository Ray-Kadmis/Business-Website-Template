"use client"
const Cards = ({ icon: Icon, iconClass, imageSrc, description , newClass }) => {
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const percentX = deltaX / centerX;
    const percentY = deltaY / centerY;
    const rotateX = percentY * 15; // Tilt angle for X-axis
    const rotateY = percentX * -15; // Tilt angle for Y-axis

    card.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${-rotateY}deg)`;
    card.style.boxShadow = `${-percentX * 50}px ${
      -percentY * 50
    }px 60px #5da9ff`;
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    card.style.boxShadow = `0 10px 20px rgba(0, 0, 0, 0.2)`;
  };

  return (
    <div
    className={`cards ${newClass}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {Icon && <Icon className={iconClass} />}
      {imageSrc && <img src={imageSrc} alt="Card" className="card-image"></img>}
      <div className="card-description">{description}</div>
      
      </div>
  );
};

export default Cards;