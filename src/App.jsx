import React from "react";
import Navbar from "./components/Navbar";
import Herosection from "./section/Herosection";
import About from "./section/About";
import Stats from "./section/Stats";
import Dishes from "./section/Dishes";
import Features from "./section/Features";
import BookingProcess from "./section/BookingProcess";

const App = () => {
  return (
    <>
      <Navbar />
      <Herosection />
      <About />
      <Stats />
      <Dishes />
      <Features />
      <BookingProcess />
    </>
  );
};

export default App;
