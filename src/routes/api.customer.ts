import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const CLEAR_CUSTOMER_COOKIE =
  "wfm_customer_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";

function retired() {
  return Response.json(
    { error: "The wFileManager customer service has been retired." },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": CLEAR_CUSTOMER_COOKIE,
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export const Route = createFileRoute("/api/customer")({
  server: {
    handlers: {
      GET: retired,
      POST: retired,
      PUT: retired,
      PATCH: retired,
      DELETE: retired,
    },
  },
});
