import { NextResponse } from "next/server";

export function isAdminRequest(request) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get("x-admin-password");

  return Boolean(configuredPassword && providedPassword === configuredPassword);
}

export function requireAdmin(request) {
  if (isAdminRequest(request)) return null;

  return NextResponse.json(
    { error: "אין הרשאה לבצע פעולה זו." },
    { status: 401 }
  );
}
