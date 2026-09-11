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

describe("PATCH /api/assignments/:id (return an asset)", () => {
  it("404s when the assignment doesn't exist", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT ... FOR UPDATE
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({ returnCondition: "GOOD" }), makeParams("1"));
    expect(res.status).toBe(404);
  });

  it("409s when the assignment is already closed", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "RETURNED", asset_id: 5 }] })
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({ returnCondition: "GOOD" }), makeParams("1"));
    expect(res.status).toBe(409);
  });

  it("returns a GOOD asset to IN_STOCK", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "ACTIVE", asset_id: 5 }] }) // SELECT assignment
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "RETURNED" }] }) // UPDATE assignments
      .mockResolvedValueOnce({}) // UPDATE assets
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PATCH(makeRequest({ returnCondition: "GOOD" }), makeParams("1"));

    expect(res.status).toBe(200);
    const [, params] = assetUpdateCall();
    expect(params).toEqual(["IN_STOCK", "GOOD", 5]);
  });

  it("retires a DAMAGED asset instead of returning it to stock", async () => {
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "ACTIVE", asset_id: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "RETURNED" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await PATCH(makeRequest({ returnCondition: "DAMAGED" }), makeParams("1"));

    const [, params] = assetUpdateCall();
    expect(params).toEqual(["RETIRED", "DAMAGED", 5]);
  });

  it("retires a LOST asset and records condition as RETIRED", async () => {
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "ACTIVE", asset_id: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "RETURNED" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await PATCH(makeRequest({ returnCondition: "LOST" }), makeParams("1"));

    const [, params] = assetUpdateCall();
    expect(params).toEqual(["RETIRED", "RETIRED", 5]);
  });
});
