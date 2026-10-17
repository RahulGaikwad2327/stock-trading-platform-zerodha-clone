
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Hero from "../landing_page/home/Hero";

describe("Hero Component", () => {
  test("renders hero image and signup button", () => {
    render(<Hero />);

    // Check signup button
    const signupButton = screen.getByRole("button", {
      name: /sign up/i,
    });

    expect(signupButton).toBeInTheDocument();

    // Check hero image
    const heroImage = screen.getByRole("img", {
      name: "Hero",
    });

    expect(heroImage).toBeInTheDocument();
    expect(heroImage).toHaveAttribute(
      "src",
      "/media/images/homeHero.png"
    );
  });
});
