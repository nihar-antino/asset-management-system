import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockClient } = vi.hoisted(() => ({
  mockClient: { query: vi.fn(), release: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  getClient: vi.fn(async () => mockClient),
}));

vi.mock("@/lib/maintenance", () => ({
  listMaintenance: vi.fn(),
}));

import { getClient } from "@/lib/db";
import { POST } from "./route";

function makeRequest(body) {
  return { json: async () => body };
}

beforeEach(() => {
  mockClient.query.mockReset();
  mockClient.release.mockReset();
  getClient.mockClear();
});

describe("POST /api/maintenance", () => {
  it("requires assetId and issue before touching the DB", async () => {
    const res = await POST(makeRequest({ assetId: 1 }));

    expect(res.status).toBe(400);
    expect(getClient).not.toHaveBeenCalled();
  });

  it("404s when the asset doesn't exist", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT asset ... FOR UPDATE
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await POST(makeRequest({ assetId: 1, issue: "Screen flicker" }));

    expect(res.status).toBe(404);
  });

  it("refuses to send an asset for maintenance unless it's IN_STOCK", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "ASSIGNED" }] })
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await POST(makeRequest({ assetId: 1, issue: "Screen flicker" }));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/ASSIGNED/);
  });

  it("creates the maintenance record and marks the asset UNDER_MAINTENANCE", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "IN_STOCK" }] }) // SELECT asset
      .mockResolvedValueOnce({ rows: [{ id: 10, asset_id: 1, issue: "Screen flicker" }] }) // INSERT log
      .mockResolvedValueOnce({}) // UPDATE assets status
      .mockResolvedValueOnce({}); // COMMIT

    const res = await POST(makeRequest({ assetId: 1, vendor: "Dell Service", issue: "Screen flicker" }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.maintenance.id).toBe(10);

    const updateCall = mockClient.query.mock.calls.find((c) => String(c[0]).includes("UPDATE assets"));
    expect(updateCall[0]).toMatch(/status = 'UNDER_MAINTENANCE'/);
    expect(updateCall[1]).toEqual([1]);
  });
});
