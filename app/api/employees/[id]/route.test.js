import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

vi.mock("@/lib/employees", () => ({
  getEmployeeWithHistory: vi.fn(),
}));

import { query } from "@/lib/db";
import { PATCH } from "./route";

function makeRequest(body) {
  return { json: async () => body };
}
function makeParams(id) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  query.mockReset();
});

describe("PATCH /api/employees/:id", () => {
  it("rejects an empty body without touching the DB", async () => {
    const res = await PATCH(makeRequest({}), makeParams("1"));

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("updates the given fields", async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 1, phone: "8888" }] });

    const res = await PATCH(makeRequest({ phone: "8888" }), makeParams("1"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.employee.phone).toBe("8888");
  });

  it("normalizes an empty string to NULL", async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 1, employee_code: null }] });

    await PATCH(makeRequest({ employee_code: "" }), makeParams("1"));

    const [, params] = query.mock.calls[0];
    expect(params).toContain(null);
    expect(params).not.toContain("");
  });

  it("404s when the employee doesn't exist", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const res = await PATCH(makeRequest({ phone: "8888" }), makeParams("999"));

    expect(res.status).toBe(404);
  });

  it("maps a duplicate employee code to a friendly 409", async () => {
    query.mockRejectedValueOnce(
      Object.assign(new Error("dup"), { code: "23505", constraint: "uniq_employees_employee_code" })
    );

    const res = await PATCH(makeRequest({ employee_code: "EMP-0001" }), makeParams("1"));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/employee code/i);
  });
});
