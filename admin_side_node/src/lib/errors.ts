const HTTP_STATUS_NAMES = new Set([
  "Internal Server Error",
  "Bad Request",
  "Unauthorized",
  "Forbidden",
  "Not Found",
  "Conflict",
  "Payload Too Large",
]);

const UNIQUE_MESSAGES: Record<string, string> = {
  email: "A staff user with this email already exists.",
  itemCode: "This item code is already used by another variant.",
  linkName: "Something with this name already exists. Choose a different name.",
  code: "This code is already in use. Choose a different name.",
  orderReference: "An order with this reference already exists.",
  attributeId_code: "This option already has that value.",
};

const UNIQUE_BY_MODEL: Record<string, string> = {
  Product: "A product with this name already exists.",
  Category: "A category with this name already exists.",
  ProductVariant: "This item code is already used by another variant.",
  Attribute: "An option with this name already exists.",
  AttributeSet: "A product kind with this name already exists.",
  AttributeValue: "This option already has that value.",
  AdminUser: "A staff user with this email already exists.",
  Order: "An order with this reference already exists.",
  AttributeSetMember: "That option is already on this product kind.",
  ProductVariantOptionValue: "That option value is already on this variant.",
};

function walkErrors(error: unknown, max = 6): object[] {
  const out: object[] = [];
  let current: unknown = error;
  for (let i = 0; i < max && current; i += 1) {
    if (typeof current !== "object" || current === null) break;
    out.push(current);
    current = "cause" in current ? (current as { cause: unknown }).cause : null;
  }
  return out;
}

export function prismaErrorCode(error: unknown): string | null {
  for (const candidate of walkErrors(error)) {
    const code = (candidate as { code?: unknown }).code;
    if (typeof code === "string" && /^P\d{4}$/.test(code)) return code;
    // Postgres unique_violation when Prisma wrapping is missing
    if (code === "23505") return "P2002";
  }
  return null;
}

function prismaErrorMeta(error: unknown): { modelName?: string; target?: unknown } | undefined {
  for (const candidate of walkErrors(error)) {
    const meta = (candidate as { meta?: { modelName?: string; target?: unknown } }).meta;
    if (meta && (meta.modelName || meta.target)) return meta;
  }
  return undefined;
}

function isPrismaValidationError(error: unknown): boolean {
  return walkErrors(error).some(
    (candidate) => (candidate as { name?: string }).name === "PrismaClientValidationError",
  );
}

export function isPrismaNotFound(error: unknown): boolean {
  return prismaErrorCode(error) === "P2025";
}

function uniqueTargets(error: unknown): string[] {
  const target = prismaErrorMeta(error)?.target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === "string" && target.trim()) {
    return target.replace(/_key$/, "").split("_").filter(Boolean);
  }
  return [];
}

export function uniqueConstraintMessage(error: unknown): string {
  const meta = prismaErrorMeta(error);
  const model = meta?.modelName ? String(meta.modelName) : "";
  if (model && UNIQUE_BY_MODEL[model]) return UNIQUE_BY_MODEL[model];

  const fields = uniqueTargets(error);
  const joined = fields.join("_");
  if (UNIQUE_MESSAGES[joined]) return UNIQUE_MESSAGES[joined];
  for (const field of fields) {
    if (UNIQUE_MESSAGES[field]) return UNIQUE_MESSAGES[field];
  }
  if (fields.includes("linkName")) {
    return "Something with this name already exists. Choose a different name.";
  }
  return "That value is already in use. Change it and try again.";
}

export function prismaPublicError(error: unknown): {
  status: number;
  message: string;
} | null {
  if (isPrismaValidationError(error)) {
    return {
      status: 400,
      message: "That change could not be saved. Check the values and try again.",
    };
  }
  const code = prismaErrorCode(error);
  if (!code) return null;
  if (code === "P2002") return { status: 409, message: uniqueConstraintMessage(error) };
  if (code === "P2003") {
    return {
      status: 400,
      message: "This record is linked to other data, so that change is not allowed.",
    };
  }
  if (code === "P2025") {
    return { status: 404, message: "That record was not found." };
  }
  if (code === "P2000") {
    return { status: 400, message: "One of the values is too long." };
  }
  if (code === "P2014" || code === "P2011") {
    return {
      status: 400,
      message: "This change would break a required link between records.",
    };
  }
  return {
    status: 400,
    message: "That change could not be saved. Check the values and try again.",
  };
}

export function isGenericHttpLabel(value: string): boolean {
  return HTTP_STATUS_NAMES.has(value);
}

export function zodIssues(
  error: unknown,
): Array<{ path?: unknown; message?: string }> | null {
  for (const candidate of walkErrors(error)) {
    const issues = (candidate as { issues?: unknown }).issues;
    if (Array.isArray(issues) && issues[0] && typeof issues[0] === "object") {
      return issues as Array<{ path?: unknown; message?: string }>;
    }
    const message = (candidate as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(message);
        if (Array.isArray(parsed) && parsed[0]?.message) return parsed;
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}
