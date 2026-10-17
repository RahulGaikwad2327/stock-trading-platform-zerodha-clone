import React from "react";

const platforms = [
  { name: "smallcase", image: "smallcaseLogo.png", description: "Thematic investment platform" },
  { name: "Streak", image: "streakLogo.png", description: "Strategy builder for algo trading" },
  { name: "Sensibull", image: "sensibullLogo.svg", description: "Options trading platform" },
  { name: "Zerodha Fund House", image: "zerodhaFundhouse.png", description: "Mutual funds" },
  { name: "GoldenPi", image: "goldenpiLogo.png", description: "Bonds and fixed income" },
  { name: "Ditto", image: "dittoLogo.png", description: "Health insurance" },
];

function Universe() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center text-center">
        <div className="col-12">
          <h1>The Zerodha Universe</h1>
          <p>
            Extend your trading and investment experience even further with our
            partner platforms.
          </p>
        </div>

        {platforms.map(({ name, image, description }) => (
          <div className="col-6 col-md-4 p-3 mt-5" key={name}>
            <img
              src={`/media/images/${image}`}
              alt={name}
              className="img-fluid"
              style={{ maxHeight: "48px", maxWidth: "180px" }}
            />
            <p className="text-small text-muted mt-3">{description}</p>
          </div>
        ))}

        <div className="col-12">
          <button className="btn btn-primary fs-5 mb-5 px-4 py-2">
            Signup Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default Universe;
