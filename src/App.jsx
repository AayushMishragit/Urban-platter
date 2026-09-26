import React from "react";
import Navbar from "./components/Navbar";
import Herosection from "./section/Herosection";
import About from "./section/About";
import Stats from "./section/Stats";
import Dishes from "./section/Dishes";
import Features from "./section/Features";
import BookingProcess from "./section/BookingProcess";
import Timing from "./section/Timing";
import TestimonialSection from "./section/TestimonialSection";
import Faq from "./section/Faq";
import Cta from "./section/Cta";
import Footer from "./components/Footer";
import LenisScroll from "./components/LenisScroll";

const App = () => {
  return (
    <>
      <LenisScroll />
      <Navbar />
      <Herosection />
      <About />
      <Stats />
      <Dishes />
      <Features />
      <BookingProcess />
      <Timing />
      <TestimonialSection />
      <Faq />
      <Cta />
      <Footer />
    </>
  );
};

export default App;
