import getDisplayDates from "../libs/getDisplayDates";
import getCityStateString from "../libs/getCityStateString";
import orderStatesByTotals from "../libs/orderStatesByTotals";
import { incidents } from "./__fixtures__/incidentData";

describe("libs", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  afterAll(() => {});

  describe("getDisplayDates", () => {
    test("displays dates correctly", () => {
      expect(getDisplayDates(incidents)).toMatchInlineSnapshot(
        `"October 9-10,  2022"`
      );
    });
  });
  describe("getCityStateString", () => {
    test("normal state", () => {
      expect(getCityStateString("city", "state")).toMatchInlineSnapshot(
        `"CITY, STATE"`
      );
    });
  });

  test("orderStatesByTotals", () => {
    expect(
      orderStatesByTotals({
        boom: {
          injured: 0,
          killed: 1,
        },
        boom1: {
          injured: 2,
          killed: 1,
        },
      })
    ).toMatchInlineSnapshot(`
      Array [
        "boom1",
        "boom",
      ]
    `);
  });
});
