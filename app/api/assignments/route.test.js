import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockClient } = vi.hoisted(() => ({
  mockClient: { query: vi.fn(), release: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  getClient: vi.fn(async () => mockClient),
}));

vi.mock("@/lib/assignments", () => ({
  listAssignments: vi.fn(),
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

describe("POST /api/assignments", () => {
  it("requires assetId and employeeId before touching the DB", async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect(getClient).not.toHaveBeenCalled();
  });

  it("404s when the asset doesn't exist", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT asset ... FOR UPDATE
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await POST(makeRequest({ assetId: 1, employeeId: 2 }));

    expect(res.status).toBe(404);
  });

  it("refuses to assign an asset that isn't IN_STOCK", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "ASSIGNED" }] })
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await POST(makeRequest({ assetId: 1, employeeId: 2 }));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/ASSIGNED/);
  });

  it("404s when the employee doesn't exist", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "IN_STOCK" }] }) // SELECT asset
      .mockResolvedValueOnce({ rows: [] }) // SELECT employee
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await POST(makeRequest({ assetId: 1, employeeId: 999 }));

    expect(res.status).toBe(404);
  });

  it("refuses to assign to an inactive employee", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "IN_STOCK" }] }) // SELECT asset
      .mockResolvedValueOnce({ rows: [{ id: 2, employment_status: "INACTIVE" }] }) // SELECT employee
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await POST(makeRequest({ assetId: 1, employeeId: 2 }));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/inactive/i);
  });

  it("creates the assignment and marks the asset ASSIGNED", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "IN_STOCK" }] }) // SELECT asset
      .mockResolvedValueOnce({ rows: [{ id: 2, employment_status: "ACTIVE" }] }) // SELECT employee
      .mockResolvedValueOnce({ rows: [{ id: 10, asset_id: 1, employee_id: 2 }] }) // INSERT assignment
      .mockResolvedValueOnce({}) // UPDATE assets status
      .mockResolvedValueOnce({}); // COMMIT

    const res = await POST(makeRequest({ assetId: 1, employeeId: 2, notes: "onboarding" }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.assignment.id).toBe(10);

    const updateCall = mockClient.query.mock.calls.find((c) => String(c[0]).includes("UPDATE assets"));
    expect(updateCall[0]).toMatch(/status = 'ASSIGNED'/);
    expect(updateCall[1]).toEqual([1]);
  });
});
