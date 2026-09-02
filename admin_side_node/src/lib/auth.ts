import type { FastifyReply, FastifyRequest } from "fastify";

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Please sign in to continue." });
  }
}
