import { incidents } from "./__fixtures__/incidentData";
import { AppState, AppSteps } from "../types";
import * as actions from "../actions";
import { initialState, AppSlice } from "../slice";

describe("app slice", () => {
  let testingState: AppState;
  beforeEach(() => {
    testingState = { ...initialState };
    jest.resetAllMocks();
  });
  afterAll(() => {});

  test("setUSTerritoryData", () => {
    testingState = AppSlice.reducer(
      initialState,
      actions.setUSTerritoryData(incidents)
    );

    expect(testingState.incidents).toHaveLength(3);

    expect(testingState.metricsAll).toMatchInlineSnapshot(`
Object {
  "injured": 4,
  "killed": 0,
}
`);
    expect(testingState.metricsStateInfo).toMatchInlineSnapshot(`
Object {
  "Indiana": Object {
    "injured": 2,
    "killed": 0,
  },
  "Minnesota": Object {
    "injured": 1,
    "killed": 0,
  },
  "North Carolina": Object {
    "injured": 1,
    "killed": 0,
  },
}
`);
    expect(testingState.orderedStateNames).toMatchInlineSnapshot(`
Array [
  "Indiana",
  "North Carolina",
  "Minnesota",
]
`);
    expect(testingState.textDateRange).toMatchInlineSnapshot(
      `"October 9-10,  2022"`
    );
    expect(testingState.stepMap[AppSteps.INIT_NEXT_INCIDENT]).toBeTruthy();
  });

  describe("selectNextIncident", () => {
    test("without focused state", () => {
      testingState = AppSlice.reducer(
        initialState,
        actions.setUSTerritoryData(incidents)
      );
      testingState = AppSlice.reducer(
        testingState,
        actions.selectNextIncident()
      );
      expect(testingState.focusedState).toBeFalsy();
      expect(testingState.currentIncidentIndex).toMatchInlineSnapshot(`0`);
    });

    test("selecting focused state", () => {
      testingState = AppSlice.reducer(
        initialState,
        actions.setUSTerritoryData(incidents)
      );
      testingState = AppSlice.reducer(
        testingState,
        actions.focusState("Minnesota")
      );
      testingState = AppSlice.reducer(
        testingState,
        actions.selectNextIncident()
      );
      const id =
        testingState.orderedIncidentIds[
          testingState.currentIncidentIndex as number
        ];
      expect(testingState.incidents.find((item) => item.id === id)?.state).toBe(
        "Minnesota"
      );
    });

    test("selecting focused staten again", () => {
      testingState = AppSlice.reducer(
        initialState,
        actions.setUSTerritoryData(incidents)
      );
      testingState = AppSlice.reducer(
        testingState,
        actions.focusState("Minnesota")
      );
      testingState = AppSlice.reducer(
        testingState,
        actions.focusState("Anything")
      );
      testingState = AppSlice.reducer(
        testingState,
        actions.selectNextIncident()
      );

      expect(testingState.focusedState).toBeFalsy();
    });
  });
});
