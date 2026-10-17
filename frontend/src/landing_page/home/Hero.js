import React from "react";

const Hero = () => {
  return (
    <div className="container py-5">
      <div className="row text-center justify-content-center">

        {/* Hero Image */}
        <div className="col-12">
          <img
            src="/media/images/homeHero.png"
            alt="Hero"
            className="img-fluid mb-5"
            style={{
              width: "100%",
              maxWidth: "1100px",
              height: "auto",
            }}
          />
        </div>

        {/* Heading */}
        <div className="col-12">
          <h1 className="mt-3">Invest in everything</h1>

          <p className="mt-3">
            Online platform to invest in stocks, mutual funds, and more
          </p>

          <button
            className="btn btn-primary fs-5 mb-5 mt-3"
            style={{
              width: "200px",
            }}
          >
            Sign Up
          </button>
        </div>

      </div>
    </div>
  );
};

export default Hero;
