import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";


const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// A böngésző soha ne tartsa meg a régi oldaldokumentumot: minden navigáció
// a legújabb kiadást kapja meg (a hír-adatok a buildbe vannak égetve).
const htmlNoStore = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const response: Response | undefined =
    result instanceof Response ? result : (result as { response?: Response })?.response;
  if (response && (response.headers.get("content-type") ?? "").includes("text/html")) {
    try {
      response.headers.set("cache-control", "no-store, max-age=0");
    } catch {
      // A válasz fejléce nem írható át: a tartalom így is kiszolgálódik.
    }
  }
  return result;
});


export const startInstance = createStart(() => ({
  requestMiddleware: [htmlNoStore, errorMiddleware, csrfMiddleware],
}));
