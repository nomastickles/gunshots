import React from "react";
import { render, screen } from "@testing-library/react";
import App from "../App";

test("initial page load", () => {
  render(<App />);

  expect(screen.getByTestId(/loader/i)).toBeTruthy();
  expect(screen.getByTestId(/USAMap/i)).toBeTruthy();
  expect(screen.getByTestId(/incident/i)).toBeTruthy();
  expect(screen.getByText(/Gun Violence/i)).toBeTruthy();
});
