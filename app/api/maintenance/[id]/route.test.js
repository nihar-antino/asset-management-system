import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockClient } = vi.hoisted(() => ({
  mockClient: { query: vi.fn(), release: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  getClient: vi.fn(async () => mockClient),
}));

import { PATCH } from "./route";

function makeRequest(body) {
  return { json: async () => body };
}
function makeParams(id) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  mockClient.query.mockReset();
  mockClient.release.mockReset();
});

function assetUpdateCall() {
  return mockClient.query.mock.calls.find((c) => String(c[0]).includes("UPDATE assets"));
}

describe("PATCH /api/maintenance/:id (mark returned)", () => {
  it("404s when the maintenance record doesn't exist", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT ... FOR UPDATE
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({}), makeParams("1"));
    expect(res.status).toBe(404);
  });

  it("409s when the maintenance record is already closed", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "RETURNED", asset_id: 5 }] })
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({}), makeParams("1"));
    expect(res.status).toBe(409);
  });

  it("returns the asset to IN_STOCK and records cost/notes", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "ACTIVE", asset_id: 5 }] }) // SELECT log
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "RETURNED" }] }) // UPDATE maintenance_logs
      .mockResolvedValueOnce({}) // UPDATE assets
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PATCH(makeRequest({ cost: 1500, notes: "Replaced screen" }), makeParams("1"));

    expect(res.status).toBe(200);
    const [, params] = assetUpdateCall();
    expect(params).toEqual([5]);

    const logUpdateCall = mockClient.query.mock.calls[2];
    expect(logUpdateCall[0]).toMatch(/status = 'RETURNED'/);
    expect(logUpdateCall[1]).toEqual([null, 1500, "Replaced screen", "1"]);
  });
});
