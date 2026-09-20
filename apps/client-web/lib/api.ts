const configuredApiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL;

export const API_BASE_URL =
    configuredApiBaseUrl ??
    (process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : (() => {
              throw new Error(
                  "NEXT_PUBLIC_API_URL is required outside development.",
              );
          })());
