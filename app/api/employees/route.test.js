import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

vi.mock("@/lib/employees", () => ({
  listEmployees: vi.fn(),
}));

import { query } from "@/lib/db";
import { POST } from "./route";

function makeRequest(body) {
  return { json: async () => body };
}

beforeEach(() => {
  query.mockReset();
});

describe("POST /api/employees", () => {
  it("requires name and email before touching the DB", async () => {
    const res = await POST(makeRequest({ name: "Riya" }));

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("creates an employee with phone and employee code", async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Riya Sharma", email: "riya@acme.com", phone: "9999", employee_code: "EMP-0001" }],
    });

    const res = await POST(
      makeRequest({ name: "Riya Sharma", email: "riya@acme.com", phone: "9999", employeeCode: "EMP-0001" })
    );

    expect(res.status).toBe(201);
    const [, params] = query.mock.calls[0];
    expect(params).toEqual(["Riya Sharma", "riya@acme.com", null, null, "9999", "EMP-0001"]);
  });

  it("maps a duplicate employee code to a friendly 409", async () => {
    query.mockRejectedValueOnce(
      Object.assign(new Error("dup"), { code: "23505", constraint: "uniq_employees_employee_code" })
    );

    const res = await POST(makeRequest({ name: "Arjun", email: "arjun@acme.com", employeeCode: "EMP-0001" }));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/employee code/i);
  });

  it("maps any other unique violation to the email message", async () => {
    query.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "23505", constraint: "employees_email_key" }));

    const res = await POST(makeRequest({ name: "Arjun", email: "riya@acme.com" }));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });
});
