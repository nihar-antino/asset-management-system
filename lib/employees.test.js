import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

import { query } from "@/lib/db";
import { listEmployees, getEmployee } from "./employees";

beforeEach(() => {
  query.mockReset();
});

describe("listEmployees", () => {
  it("builds an unfiltered query when no filters are given", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await listEmployees({});

    const [sql, params] = query.mock.calls[0];
    expect(sql).not.toMatch(/WHERE e\./);
    expect(params).toEqual([]);
  });

  it("combines status and search into one WHERE clause", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await listEmployees({ status: "ACTIVE", search: "riya" });

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/e\.employment_status = \$1/);
    expect(sql).toMatch(/ILIKE \$2/);
    expect(params).toEqual(["ACTIVE", "%riya%"]);
  });
});

describe("getEmployee", () => {
  it("returns null when no row is found", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const result = await getEmployee(999);

    expect(result).toBeNull();
  });
});
