import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { registerStoreRoutes } from "./routes/store.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerDataTransferRoutes } from "./routes/data-transfer.js";
import { ensureBootstrapAdmin } from "./lib/bootstrap-admin.js";
import {
  isGenericHttpLabel,
  prismaPublicError,
  zodIssues,
} from "./lib/errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (_request, body, done) => {
    try {
      const text = typeof body === "string" ? body.trim() : "";
      done(null, text ? JSON.parse(text) : {});
    } catch (err) {
      done(err as Error);
    }
  },
);

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
    return reply.code(404).send({ error: "That endpoint was not found." });
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

app.setErrorHandler((error, request, reply) => {
  const issues = zodIssues(error);
  if (error instanceof ZodError || (issues && issues.length > 0)) {
    const issue = error instanceof ZodError ? error.issues[0] : issues?.[0];
    const rawPath = issue?.path;
    const path = Array.isArray(rawPath) ? rawPath.map(String).join(".") : "";
    const detail = issue?.message || "Invalid value";
    const message = path ? `${fieldLabel(path)}: ${detail}` : detail;
    return reply.code(400).send({ error: message });
  }

  const prismaErr = prismaPublicError(error);
  if (prismaErr) {
    return reply.code(prismaErr.status).send({ error: prismaErr.message });
  }

  const statusCode =
    typeof (error as { statusCode?: number }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;
  const rawMessage =
    error instanceof Error && error.message ? error.message : "";

  if (statusCode >= 400 && statusCode < 500) {
    const safe =
      rawMessage && !isGenericHttpLabel(rawMessage)
        ? rawMessage
        : "That request was not valid. Check the form and try again.";
    return reply.code(statusCode).send({ error: safe });
  }

  request.log.error(error);
  return reply.code(500).send({
    error: "Something went wrong while saving. Check the values and try again.",
  });
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
