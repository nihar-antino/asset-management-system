import { NextResponse } from "next/server";

const UNAUTHORIZED = new NextResponse("Authentication required", {
  status: 401,
  headers: { "WWW-Authenticate": 'Basic realm="Asset Registry"' },
});

function parseUsers(raw) {
  return (raw || "")
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const separatorIndex = pair.indexOf(":");
      return [pair.slice(0, separatorIndex), pair.slice(separatorIndex + 1)];
    });
}

export function proxy(request) {
  const users = parseUsers(process.env.BASIC_AUTH_USERS);
  // Fail closed: if credentials aren't configured, nobody gets in rather
  // than everybody.
  if (users.length === 0) return UNAUTHORIZED;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);

    if (users.some(([u, p]) => u === user && p === pass)) {
      return NextResponse.next();
    }
  }

  return UNAUTHORIZED;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
