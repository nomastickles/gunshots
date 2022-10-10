import * as libGeneral from "../../src/libs/general";

describe("libGeneral", () => {
  describe("createNewIncident", () => {
    it("temp", () => {
      expect(libGeneral.batchArray([1, 2, 3, 4], 2)).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });
});
