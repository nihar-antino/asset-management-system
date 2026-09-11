import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockClient } = vi.hoisted(() => ({
  mockClient: { query: vi.fn(), release: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  getClient: vi.fn(async () => mockClient),
}));

vi.mock("@/lib/employees", () => ({
  getEmployeeWithHistory: vi.fn(),
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

describe("PATCH /api/employees/:id", () => {
  it("rejects an empty body without starting a transaction", async () => {
    const res = await PATCH(makeRequest({}), makeParams("1"));

    expect(res.status).toBe(400);
    expect(mockClient.query).not.toHaveBeenCalled();
    expect(mockClient.release).toHaveBeenCalledOnce();
  });

  it("rejects an invalid employment_status without starting a transaction", async () => {
    const res = await PATCH(makeRequest({ employment_status: "ON_LEAVE" }), makeParams("1"));

    expect(res.status).toBe(400);
    expect(mockClient.query).not.toHaveBeenCalled();
  });

  it("updates plain fields without checking assignments", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, phone: "8888" }] }) // UPDATE employees
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PATCH(makeRequest({ phone: "8888" }), makeParams("1"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.employee.phone).toBe("8888");
    expect(mockClient.query).toHaveBeenCalledTimes(3);
  });

  it("normalizes an empty string to NULL", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, employee_code: null }] }) // UPDATE employees
      .mockResolvedValueOnce({}); // COMMIT

    await PATCH(makeRequest({ employee_code: "" }), makeParams("1"));

    const [, params] = mockClient.query.mock.calls[1];
    expect(params).toContain(null);
    expect(params).not.toContain("");
  });

  it("404s when the employee doesn't exist", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // UPDATE employees -> no match
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({ phone: "8888" }), makeParams("999"));

    expect(res.status).toBe(404);
    expect(mockClient.query.mock.calls.at(-1)[0]).toBe("ROLLBACK");
  });

  it("maps a duplicate employee code to a friendly 409", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "23505", constraint: "uniq_employees_employee_code" }))
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await PATCH(makeRequest({ employee_code: "EMP-0001" }), makeParams("1"));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/employee code/i);
  });

  it("marking INACTIVE with no active assignments just updates the employee", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT active assignments -> none
      .mockResolvedValueOnce({ rows: [{ id: 1, employment_status: "INACTIVE" }] }) // UPDATE employees
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PATCH(makeRequest({ employment_status: "INACTIVE" }), makeParams("1"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.employee.employment_status).toBe("INACTIVE");
    expect(mockClient.query.mock.calls.some((c) => String(c[0]).includes("UPDATE assets"))).toBe(false);
  });

  it("auto-returns every active assignment when marking an employee INACTIVE", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          { id: 10, asset_id: 100 },
          { id: 11, asset_id: 101 },
        ],
      }) // SELECT active assignments ... FOR UPDATE
      .mockResolvedValueOnce({}) // UPDATE assignments (10)
      .mockResolvedValueOnce({}) // UPDATE assets (100)
      .mockResolvedValueOnce({}) // UPDATE assignments (11)
      .mockResolvedValueOnce({}) // UPDATE assets (101)
      .mockResolvedValueOnce({ rows: [{ id: 1, employment_status: "INACTIVE" }] }) // UPDATE employees
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PATCH(makeRequest({ employment_status: "INACTIVE" }), makeParams("1"));

    expect(res.status).toBe(200);

    const assetUpdateCalls = mockClient.query.mock.calls.filter((c) => String(c[0]).includes("UPDATE assets"));
    expect(assetUpdateCalls).toHaveLength(2);
    expect(assetUpdateCalls[0][0]).toMatch(/status = 'IN_STOCK'/);
    expect(assetUpdateCalls[0][1]).toEqual([100]);
    expect(assetUpdateCalls[1][1]).toEqual([101]);

    const assignmentUpdateCalls = mockClient.query.mock.calls.filter((c) =>
      String(c[0]).includes("UPDATE assignments")
    );
    expect(assignmentUpdateCalls).toHaveLength(2);
    expect(assignmentUpdateCalls[0][0]).toMatch(/status = 'RETURNED'/);
  });
});
