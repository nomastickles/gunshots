import { renderHook } from "@testing-library/react";
import hook from "../../hooks/useDataWatcher";
import * as useAppDispatch from "../../hooks/useAppDispatch";

describe("useDataWatcher", () => {
  const dispatchSpy = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(useAppDispatch, "useAppDispatch").mockReturnValue(dispatchSpy);
  });
  afterAll(() => {});

  test("does nothing if no websocket", () => {
    renderHook(() => hook());
    expect(dispatchSpy.mock.calls).toMatchInlineSnapshot(`Array []`);
  });
});
