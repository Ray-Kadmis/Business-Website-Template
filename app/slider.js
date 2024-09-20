import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";

// import required modules
import { Pagination, Autoplay } from "swiper/modules";

const Slider = ({
  slides,
  delay = 3000,
  breakpoints = {
    640: { slidesPerView: 1, spaceBetween: 0 },
    768: { slidesPerView: 2, spaceBetween: 20 },
    1024: { slidesPerView: 3, spaceBetween: 20 },
  },
  additionalClass = "",
  additionalClassParent = "",
}) => {
  return (
    <div className={`reviews ${additionalClassParent} justify-center items-center`}>
      <Swiper
        slidesPerView={1}
        spaceBetween={2}
        pagination={{
          clickable: true,
        }}
        loop={true}
        autoplay={{
          delay: delay,
          disableOnInteraction: false,
        }}
        breakpoints={breakpoints}
        modules={[Pagination, Autoplay]}
        className="mySwiper"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className={`swiperitems ${slide.bgColor} ${additionalClass}`}>
              {slide.images.map((imageUrl, i) => (
                <img
                  key={i}
                  src={imageUrl}
                  alt={`slide-${index}-image-${i}`}
                  className={slide.imageClass || "default-image-class"}
                />
              ))}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Slider;
