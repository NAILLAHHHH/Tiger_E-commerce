import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { registerStoreRoutes } from "./routes/store.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerDataTransferRoutes } from "./routes/data-transfer.js";
import { ensureBootstrapAdmin } from "./lib/bootstrap-admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(",") ?? true,
  credentials: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || "dev-tiger-jwt-secret",
});

await app.register(multipart, {
  limits: { fileSize: 80 * 1024 * 1024 },
});

const owner = await ensureBootstrapAdmin();
console.log(`Permanent owner ready: ${owner.email}`);

await registerStoreRoutes(app);
await registerAdminRoutes(app);
await registerDataTransferRoutes(app);

await app.register(fastifyStatic, {
  root: path.join(__dirname, "../public"),
  prefix: "/",
});

app.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith("/api/")) {
    return reply.code(404).send({ error: "Not found" });
  }
  return reply.sendFile("index.html");
});

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  password: "Password",
  itemCode: "Item code",
  productId: "Product",
  priceForOne: "Price for one",
  priceForBulk: "Bulk price",
  howManyLeft: "Stock",
  minQuantityForBulk: "Bulk minimum",
  displayType: "Display type",
  listPosition: "List position",
  label: "Value",
  values: "Values",
  attributeIds: "Options",
  attributeValueIds: "Option values",
  attributeSetId: "Product kind",
  categoryId: "Category",
  linkName: "Link name",
  code: "Code",
};

function fieldLabel(path: string) {
  const key = path.split(".").pop() || path;
  return FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function isZodError(error: unknown): error is ZodError {
  if (error instanceof ZodError) return true;
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { name?: string; issues?: unknown };
  return candidate.name === "ZodError" && Array.isArray(candidate.issues);
}

app.setErrorHandler((error, request, reply) => {
  if (isZodError(error)) {
    const issue = error.issues[0];
    const path = issue?.path?.length ? String(issue.path.join(".")) : "";
    const detail = issue?.message || "Invalid value";
    const message = path ? `${fieldLabel(path)}: ${detail}` : detail;
    return reply.code(400).send({ error: message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target : target ? [String(target)] : [];
      const label = fields.map((f) => fieldLabel(String(f))).join(", ") || "This value";
      return reply.code(400).send({ error: `${label} is already in use.` });
    }
    if (error.code === "P2003") {
      return reply.code(400).send({
        error: "This record is linked to other data, so that change is not allowed.",
      });
    }
    if (error.code === "P2025") {
      return reply.code(404).send({ error: "That record was not found." });
    }
  }

  request.log.error(error);
  const message =
    error instanceof Error && error.message ? error.message : "Something went wrong.";
  const status = typeof (error as { statusCode?: number }).statusCode === "number"
    ? (error as { statusCode: number }).statusCode
    : 500;
  return reply.code(status >= 400 ? status : 500).send({ error: message });
});

const port = Number(process.env.PORT || 1338);
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
  console.log(`Tiger Node admin API listening on http://${host}:${port}`);
  console.log(`Staff UI: http://localhost:${port}/`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
