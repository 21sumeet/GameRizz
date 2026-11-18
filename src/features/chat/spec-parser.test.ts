import { describe, expect, it } from "vitest";

import { parseQuery } from "./spec-parser";

describe("parseQuery RAM vs storage", () => {
  it("does not read an SSD size as RAM", () => {
    const { specs } = parseQuery("i5 12400, 500GB SSD");
    expect(specs.storageGB).toBe(500);
    expect(specs.ramGB).toBeUndefined();
  });

  it("reads 'free space' as storage, not RAM", () => {
    const { specs } = parseQuery("is 100GB of free space enough for Elden Ring?");
    expect(specs.storageGB).toBe(100);
    expect(specs.ramGB).toBeUndefined();
  });

  it("keeps both apart when the user gives both", () => {
    const { specs } = parseQuery("RTX 3060, i5 12400, 16GB RAM, 1TB NVMe");
    expect(specs.ramGB).toBe(16);
    expect(specs.storageGB).toBe(1024);
  });

  it("still treats a lone GB figure as RAM", () => {
    const { specs } = parseQuery("will Elden Ring run with 16GB?");
    expect(specs.ramGB).toBe(16);
    expect(specs.storageGB).toBeUndefined();
  });
});