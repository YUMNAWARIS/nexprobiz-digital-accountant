/** ARCH-007 as a test: dependency-cruiser must report zero violations. */
import { execFileSync } from "node:child_process";
import path from "node:path";

describe("architecture rules (dependency-cruiser)", () => {
  it("src/ has no forbidden dependencies", () => {
    const apiRoot = path.resolve(__dirname, "../..");
    const bin = path.join(apiRoot, "node_modules/.bin/depcruise");
    const out = execFileSync(
      bin,
      ["src", "--config", ".dependency-cruiser.cjs", "--output-type", "err"],
      {
        cwd: apiRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    expect(out).toMatch(/no dependency violations found/);
  });
});
