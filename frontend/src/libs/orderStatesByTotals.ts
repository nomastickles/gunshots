import { Metrics } from "../types";

function orderStatesByTotals(info: Record<string, Metrics>) {
  return Object.keys(info)
    .map((USTerritory) => ({
      name: USTerritory,
      total: info[USTerritory].killed + info[USTerritory].injured,
    }))
    .sort((a, b) => (a.total > b.total ? -1 : 1))
    .map((item) => item.name);
}

export default orderStatesByTotals;
