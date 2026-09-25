
import { parseAmountFromImport } from "./src/utils/parseDecimal.ts";
const cases = ["ZK1:xG9kLm2nPq:8fJ2kL9mQ3vX", "ZK1:a:b", "ZK1:gslwrxCHfhXCPL57:Ftz", "not-a-number", ""];
for (const c of cases) {
  const r = parseAmountFromImport(c);
  console.log(JSON.stringify(c).padEnd(34), "=>", r, Number.isFinite(r) ? "FINITE" : "NaN");
}
