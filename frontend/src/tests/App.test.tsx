import { render, screen } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { store } from "../index";
import App from "../App";

describe("App tests", () => {
  test("initial page load", () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByTestId(/loader/i)).toBeTruthy();
    expect(screen.getByText(/Gun Violence/i)).toBeTruthy();
  });
});
