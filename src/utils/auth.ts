import { Request } from "elysia";

export function extractBearerToken(request: Request): string | null {
  const auth = (request.headers.get("authorization") || "").toString();
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.split(" ")[1].trim();
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}
