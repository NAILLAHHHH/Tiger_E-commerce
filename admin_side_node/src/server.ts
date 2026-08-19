import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
  limits: { fileSize: 15 * 1024 * 1024 },
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
