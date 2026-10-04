import React from "react";
import Animated from "../components/Animated";
import { Star } from "lucide-react";

const avatars = [
  "/assets/user-1.jpeg",
  "/assets/user-2.jpeg",
  "/assets/user-3.jpeg",
  "/assets/user-4.jpeg",
];

const Herosection = () => {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-[url('/assets/heroBanner.png')] bg-cover bg-no-repeat pt-20">
      <Animated y={-20} delay={0.2}>
        <p className="text-orange-600">Meets culinary excellence</p>
      </Animated>

      <Animated>
        <h1 className="text-5xl md:text-6xl font-medium max-w-3xl text-center mt-5 font-urbanist text-balance">
          Crafted for unforgettable dining moments
        </h1>
      </Animated>

      <Animated delay={0.2}>
        <p className="text-zinc-600 max-w-md text-center mt-3">
          Experience carefully curated menus, fresh local ingredients and
          impeccable service in a space made for every celebration.
        </p>
      </Animated>

      <Animated>
        <a
          href="#booking-process"
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 mt-8 rounded-full block transition"
        >
          Book a table
        </a>
      </Animated>

      <Animated className="flex items-center justify-center md:justify-start mt-9">
        {/* Avatars */}
        <div className="flex -space-x-3.5 pr-3">
          {avatars.map((src, i) => (
            <img
              src={src}
              key={i}
              alt="guest"
              className="size-10 border-2 border-slate-50 rounded-full hover:-translate-y-px transition"
            />
          ))}
        </div>

        {/* Rating */}
        <div>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="size-3.5 fill-orange-500 text-orange-500"
              />
            ))}
          </div>

          <p className="text-zinc-800">4.8/5 Rating - 10,000 reviews</p>
        </div>
      </Animated>
    </section>
  );
};

export default Herosection;
