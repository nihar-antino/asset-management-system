import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

import { query } from "@/lib/db";
import { listAssets, getAsset } from "./assets";

beforeEach(() => {
  query.mockReset();
});

describe("listAssets", () => {
  it("builds an unfiltered query when no filters are given", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await listAssets({});

    const [sql, params] = query.mock.calls[0];
    expect(sql).not.toMatch(/WHERE/);
    expect(params).toEqual([]);
  });

  it("combines type, status and search into one WHERE clause", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await listAssets({ type: "LAPTOP", status: "IN_STOCK", search: "dell" });

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/a\.type = \$1/);
    expect(sql).toMatch(/a\.status = \$2/);
    expect(sql).toMatch(/ILIKE \$3/);
    expect(params).toEqual(["LAPTOP", "IN_STOCK", "%dell%"]);
  });
});

describe("getAsset", () => {
  it("returns null when no row is found", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const result = await getAsset(999);

    expect(result).toBeNull();
  });

  it("returns the row when found", async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 1, asset_tag: "LAP-0001" }] });

    const result = await getAsset(1);

    expect(result.asset_tag).toBe("LAP-0001");
  });
});
