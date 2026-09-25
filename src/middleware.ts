import type { NextRequest } from "next/server";
import { updateSession } from "@server/auth";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/partner/:path*"],
};
