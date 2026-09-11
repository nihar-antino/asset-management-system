import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockClient } = vi.hoisted(() => ({
  mockClient: { query: vi.fn(), release: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  getClient: vi.fn(async () => mockClient),
}));

vi.mock("@/lib/assets", () => ({
  getAssetWithHistory: vi.fn(),
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

describe("PATCH /api/assets/:id", () => {
  it("rejects a status value other than IN_STOCK/RETIRED without touching the DB", async () => {
    const res = await PATCH(makeRequest({ status: "ASSIGNED" }), makeParams("1"));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/IN_STOCK, RETIRED/);
    expect(mockClient.query).not.toHaveBeenCalled();
    expect(mockClient.release).toHaveBeenCalledOnce();
  });

  it("rejects an empty body without starting a transaction", async () => {
    const res = await PATCH(makeRequest({}), makeParams("1"));

    expect(res.status).toBe(400);
    expect(mockClient.query).not.toHaveBeenCalled();
    expect(mockClient.release).toHaveBeenCalledOnce();
  });

  it("updates plain fields without checking assignments", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, brand: "Dell" }] }) // UPDATE
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PATCH(makeRequest({ brand: "Dell" }), makeParams("1"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.asset.brand).toBe("Dell");
    expect(mockClient.query).toHaveBeenCalledTimes(3);
    expect(mockClient.query.mock.calls[0][0]).toBe("BEGIN");
    expect(mockClient.query.mock.calls[2][0]).toBe("COMMIT");
  });

  it("normalizes an empty string to NULL instead of writing an empty value", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, serial_number: null }] }) // UPDATE
      .mockResolvedValueOnce({}); // COMMIT

    await PATCH(makeRequest({ serial_number: "" }), makeParams("1"));

    const [, params] = mockClient.query.mock.calls[1];
    expect(params).toContain(null);
    expect(params).not.toContain("");
  });

  it("404s when the asset doesn't exist", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT ... FOR UPDATE
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({ status: "RETIRED" }), makeParams("999"));

    expect(res.status).toBe(404);
    expect(mockClient.query.mock.calls.at(-1)[0]).toBe("ROLLBACK");
  });

  it("refuses to change status while an active assignment exists", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // SELECT asset ... FOR UPDATE
      .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // SELECT active assignment
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({ status: "IN_STOCK" }), makeParams("1"));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/currently assigned/i);
    // the UPDATE must never run
    expect(mockClient.query.mock.calls.some((c) => String(c[0]).startsWith("UPDATE assets SET"))).toBe(false);
  });

  it("allows retiring an asset with no active assignment", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // SELECT asset ... FOR UPDATE
      .mockResolvedValueOnce({ rows: [] }) // SELECT active assignment -> none
      .mockResolvedValueOnce({ rows: [{ id: 2, status: "RETIRED" }] }) // UPDATE
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PATCH(makeRequest({ status: "RETIRED" }), makeParams("2"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.asset.status).toBe("RETIRED");
  });

  it("maps a duplicate serial number to a friendly 409", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "23505", constraint: "uniq_assets_serial_number" }))
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({ serial_number: "DUP123" }), makeParams("1"));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/serial number/i);
  });

  it("maps any other unique violation to the asset tag message", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "23505", constraint: "assets_asset_tag_key" }))
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({ brand: "Dell" }), makeParams("1"));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/asset tag/i);
  });
});
