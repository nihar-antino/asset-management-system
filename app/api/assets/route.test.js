import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

vi.mock("@/lib/assets", () => ({
  listAssets: vi.fn(),
}));

import { query } from "@/lib/db";
import { POST } from "./route";

function makeRequest(body) {
  return { json: async () => body };
}

beforeEach(() => {
  query.mockReset();
});

describe("POST /api/assets", () => {
  it("requires a type before touching the DB", async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("creates a single asset with the given tag and serial number", async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 1, asset_tag: "LAP-9999" }] });

    const res = await POST(
      makeRequest({ type: "LAPTOP", assetTag: "LAP-9999", serialNumber: "SN1", quantity: 1 })
    );

    expect(res.status).toBe(201);
    expect(query).toHaveBeenCalledTimes(1);
    const [, params] = query.mock.calls[0];
    expect(params[0]).toBe("LAP-9999"); // asset_tag
    expect(params[4]).toBe("SN1"); // serial_number
  });

  it("bulk-creates several assets with auto-suffixed tags and no serial number", async () => {
    query.mockResolvedValue({ rows: [{ id: 1 }] });

    const res = await POST(makeRequest({ type: "PHONE", quantity: 3 }));

    expect(res.status).toBe(201);
    expect(query).toHaveBeenCalledTimes(3);
    for (const [, params] of query.mock.calls) {
      expect(params[0]).toMatch(/^PHO-\d+-\d+$/); // asset_tag
      expect(params[4]).toBeNull(); // serial_number forced null for bulk entries
    }
  });

  it("maps a duplicate serial number to a friendly 409", async () => {
    query.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "23505", constraint: "uniq_assets_serial_number" }));

    const res = await POST(makeRequest({ type: "LAPTOP", serialNumber: "DUP1" }));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/serial number/i);
  });

  it("maps any other unique violation to the asset tag message", async () => {
    query.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "23505", constraint: "assets_asset_tag_key" }));

    const res = await POST(makeRequest({ type: "LAPTOP", assetTag: "LAP-0001" }));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/asset tag/i);
  });
});
