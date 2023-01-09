import { renderHook } from "@testing-library/react";
import hook from "../../hooks/useIncidentWatcher";
import * as useAppDispatch from "../../hooks/useAppDispatch";
import * as useAppState from "../../hooks/useAppState";
import { initialState } from "../../slice";
import { AppSteps } from "../../types";
jest.useFakeTimers();

describe("useIncidentWatcher", () => {
  const dispatchSpy = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(useAppDispatch, "useAppDispatch").mockReturnValue(dispatchSpy);
  });
  afterAll(() => {});

  test("does nothing if not INIT_NEXT_INCIDENT", () => {
    jest.spyOn(useAppState, "useAppState").mockReturnValue({
      currentIncidentInfo: {},
      ...initialState,
    });

    renderHook(() => hook());
    expect(dispatchSpy.mock.calls).toMatchInlineSnapshot(`Array []`);
  });
  test("dispatches correctly if INIT_NEXT_INCIDENT", () => {
    jest.spyOn(useAppState, "useAppState").mockReturnValue({
      currentIncidentInfo: {},
      ...initialState,
      stepMap: {
        [AppSteps.INIT_NEXT_INCIDENT]: 123,
      },
    });

    renderHook(() => hook());
    jest.runAllTimers(); // collapse all timeouts
    expect(dispatchSpy.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    Object {
      "payload": undefined,
      "type": "selectNextIncident",
    },
  ],
  Array [
    Object {
      "payload": Object {
        "step": "ISOLATE_US_TERRITORY",
      },
      "type": "setStepValue",
    },
  ],
  Array [
    Object {
      "payload": Object {
        "step": "SHOW_INCIDENT",
      },
      "type": "setStepValue",
    },
  ],
  Array [
    Object {
      "payload": Object {
        "clear": true,
        "step": "ISOLATE_US_TERRITORY",
      },
      "type": "setStepValue",
    },
  ],
  Array [
    Object {
      "payload": Object {
        "step": "HIDE_INCIDENT",
      },
      "type": "setStepValue",
    },
  ],
  Array [
    Object {
      "payload": Object {
        "step": "INIT_NEXT_INCIDENT",
      },
      "type": "setStepValue",
    },
  ],
]
`);
  });
});
