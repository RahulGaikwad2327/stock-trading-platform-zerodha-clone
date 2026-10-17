
import React from "react";

const Stats = () => {
  return (
    <div className="container py-5">
      <div className="row align-items-center">

        {/* Left Content */}
        <div className="col-lg-6 col-md-12 px-5">
          <h1 className="fs-2 mb-5">Trust with confidence</h1>

          <h2 className="fs-4">Customer-first approach</h2>
          <p className="text-muted fs-5 mb-4">
            That's why 1.3+ crore customers trust Zerodha with 3.5+ lakh
            trading orders every month.
          </p>

          <h2 className="fs-4">No spam or gimmicks</h2>
          <p className="text-muted fs-5 mb-4">
            No gimmicks, spam, "gamification", or annoying push notifications.
            High quality apps that you use at your pace, the way you like.
          </p>

          <h2 className="fs-4">The Zerodha universe</h2>
          <p className="text-muted fs-5 mb-4">
            Not just an app, but a whole ecosystem. Our investments in the
            financial markets are backed by decades of experience and a
            commitment to transparency.
          </p>

          <h2 className="fs-4">Do better with money</h2>
          <p className="text-muted fs-5">
            Maximize your returns and minimize your risks with our expert
            financial advice and tools.
          </p>
        </div>

        {/* Right Content */}
        <div className="col-lg-6 col-md-12 text-center px-5">
          <img
            src="/media/images/ecosystem.png"
            alt="Zerodha Ecosystem"
            className="img-fluid"
            style={{ width: "90%" }}
          />

          <div className="d-flex justify-content-center gap-4 mt-4">
            <a
              href="#"
              className="text-decoration-none"
            >
              Explore our products{" "}
              <i className="fa fa-long-arrow-right ms-2"></i>
            </a>

            <a
              href="#"
              className="text-decoration-none"
            >
              Try Kite{" "}
              <i className="fa fa-long-arrow-right ms-2"></i>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Stats;
