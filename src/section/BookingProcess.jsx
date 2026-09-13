import React from "react";
import Animated from "../components/Animated";
import { bookingTestimonial } from "../data/data";
import { Star } from "lucide-react";

const BookingProcess = () => {
  return (
    <section id="booking-process" className="px-auo mt-44">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 md:gap-25">
        {/* left-side */}
        <div className="flex flex-col text-center md:text-left">
          <Animated delay={0.2}>
            <h2 className="text-orange-500 font-medium up">
              Table Reservation Process
            </h2>
          </Animated>
          <Animated delay={0.2}>
            <h2 className="text-4xl md:text:5xl mb-16">
              Reserve your table in three simple steps
            </h2>
          </Animated>
          <Animated className="flex gap-0.5 mb-6 justify-center md:justify-start">
            {[...Array(bookingTestimonial.rating)].map((_, i) => (
              <Star
                key={i}
                className="size-4 fill-orange-500 text-orange-500"
              />
            ))}
          </Animated>
          <Animated delay={0.2}>
            <p className="text-zinc-600 max-w-xs max-md:mx-auto mb-4">
              "{bookingTestimonial.quote}"
            </p>
          </Animated>
        </div>
        {/* right-side */}
        <div></div>
      </div>
    </section>
  );
};

export default BookingProcess;
