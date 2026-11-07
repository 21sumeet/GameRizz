import { describe, expect, it } from "vitest";

import { cosineSimilarity, topN } from "./similarity";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("returns 1 for the same direction at a different length", () => {
    // THE property that makes cosine right for embeddings: scale is ignored.
    expect(cosineSimilarity([1, 2, 3], [10, 20, 30])).toBeCloseTo(1);
  });

  it("returns 0 for perpendicular vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("returns 0 (not NaN) when one vector is all zeros", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("throws on a dimension mismatch", () => {
    expect(() => cosineSimilarity([1, 2, 3], [1, 2])).toThrow(/dimension mismatch/);
  });

  it("throws on empty vectors", () => {
    expect(() => cosineSimilarity([], [])).toThrow(/empty/);
  });
});

describe("topN", () => {
  const items = [
    { id: "a", vector: [1, 0, 0] },
    { id: "b", vector: [0.9, 0.1, 0] },
    { id: "c", vector: [0, 1, 0] },
  ];
  const query = [1, 0, 0];

  it("returns the closest items first", () => {
    expect(topN(query, items, 2).map((hit) => hit.id)).toEqual(["a", "b"]);
  });

  it("returns everything when n exceeds the list", () => {
    expect(topN(query, items, 99)).toHaveLength(3);
  });

  it("returns [] for n <= 0", () => {
    expect(topN(query, items, 0)).toEqual([]);
  });
});