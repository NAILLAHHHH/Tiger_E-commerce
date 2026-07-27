import { useEffect, useState } from "react";
import {
  Layouts,
  Page,
  useFetchClient,
} from "@strapi/strapi/admin";
import {
  Box,
  Button,
  Flex,
  Loader,
  Main,
  Typography,
} from "@strapi/design-system";
import { ArrowLeft } from "@strapi/icons";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { styled } from "styled-components";

const SLUG_BY_SHORT = {
  "inventory-movement": "api::inventory-movement.inventory-movement",
  "price-history": "api::price-history.price-history",
} as const;

const LABEL_BY_SHORT: Record<string, string> = {
  "inventory-movement": "Stock movement",
  "price-history": "Price change",
};

const Panel = styled(Box)`
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  border-radius: 8px;
  padding: 20px;
`;

const FieldRow = styled(Flex)`
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral100};

  &:last-child {
    border-bottom: none;
  }
`;

function formatValue(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-US");
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.length ? JSON.stringify(value) : "—";
    const record = value as Record<string, unknown>;
    if (typeof record.name === "string") return record.name;
    return JSON.stringify(value);
  }
  return String(value);
}

function formatLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function movementLabel(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AuditRecordView() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") ?? "";
  const documentId = searchParams.get("documentId") ?? "";
  const navigate = useNavigate();
  const { get } = useFetchClient();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const slug = SLUG_BY_SHORT[type as keyof typeof SLUG_BY_SHORT];
  const listPath = slug
    ? `/content-manager/collection-types/${slug}`
    : "/";

  useEffect(() => {
    if (!slug || !documentId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const response = await get(
          `/content-manager/collection-types/${slug}/${documentId}`,
        );
        if (!cancelled) {
          setRecord((response.data?.data ?? response.data ?? null) as Record<
            string,
            unknown
          > | null);
        }
      } catch {
        if (!cancelled) setRecord(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [documentId, get, slug]);

  if (!slug) {
    return (
      <Main>
        <Typography>Unknown record type.</Typography>
      </Main>
    );
  }

  const hiddenKeys = new Set([
    "id",
    "documentId",
    "createdBy",
    "updatedBy",
    "locale",
    "localizations",
    "publishedAt",
  ]);

  const fields = record
    ? Object.entries(record).filter(([key]) => !hiddenKeys.has(key))
    : [];

  return (
    <Main>
      <Page.Title>
        View {LABEL_BY_SHORT[type] ?? "record"}
      </Page.Title>

      <Layouts.Content>
        <Flex direction="column" gap={4}>
          <Flex justifyContent="space-between" alignItems="center" gap={3}>
            <Button
              variant="tertiary"
              startIcon={<ArrowLeft />}
              onClick={() => navigate(listPath)}
            >
              Back to list
            </Button>
            <Typography variant="pi" textColor="neutral500">
              Read-only audit record
            </Typography>
          </Flex>

          {loading ? (
            <Flex justifyContent="center" padding={8}>
              <Loader>Loading record…</Loader>
            </Flex>
          ) : !record ? (
            <Panel>
              <Typography textColor="neutral600">
                Record not found.{" "}
                <RouterLink to={listPath}>Return to the list</RouterLink>.
              </Typography>
            </Panel>
          ) : (
            <Panel>
              <Typography variant="beta" tag="h2">
                {String(
                  record.product_name ||
                    record.item_code ||
                    record.order_reference ||
                    LABEL_BY_SHORT[type] ||
                    "Details",
                )}
              </Typography>
              <Typography variant="pi" textColor="neutral500">
                {type === "inventory-movement" && record.movement_type
                  ? movementLabel(String(record.movement_type))
                  : "View only — this log cannot be edited"}
              </Typography>

              <Box paddingTop={4}>
                {fields.map(([key, value]) => (
                  <FieldRow
                    key={key}
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={4}
                  >
                    <Typography fontWeight="semiBold">{formatLabel(key)}</Typography>
                    <Typography textColor="neutral700" style={{ textAlign: "right" }}>
                      {key === "movement_type"
                        ? movementLabel(String(value))
                        : formatValue(value)}
                    </Typography>
                  </FieldRow>
                ))}
              </Box>
            </Panel>
          )}
        </Flex>
      </Layouts.Content>
    </Main>
  );
}
