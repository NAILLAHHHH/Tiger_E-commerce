import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useFetchClient,
  useNotification,
  useQueryParams,
} from "@strapi/strapi/admin";
import {
  Button,
  Flex,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from "@strapi/design-system";
import { Download, Upload } from "@strapi/icons";

import { useSelectedEntries } from "./order-selection-store";

const SLUG_TO_CONTENT_TYPE: Record<string, string> = {
  "api::category.category": "categories",
  "api::product.product": "products",
  "api::product-variant.product-variant": "product-variants",
  "api::order.order": "orders",
};

type Scope = "all" | "filtered" | "selected";
type ExportFormat = "csv" | "excel" | "pdf";

type OrderSummary = {
  count: number;
  totalSubtotal: number;
  totalAmount: number;
  currency: string;
  scope: Scope;
};

type ExportResult = {
  content: string;
  csv?: string;
  filename: string;
  mimeType: string;
  encoding: "utf8" | "base64";
  scope: Scope;
  format: ExportFormat;
};

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadExport(result: ExportResult) {
  if (result.encoding === "base64") {
    const binary = atob(result.content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    downloadBlob(result.filename, new Blob([bytes], { type: result.mimeType }));
    return;
  }

  downloadBlob(
    result.filename,
    new Blob([result.content || result.csv || ""], {
      type: result.mimeType || "text/csv;charset=utf-8",
    }),
  );
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read file"));
    reader.readAsText(file);
  });
}

function formatRwf(value: number, currency: string) {
  return `${value.toLocaleString("en-RW")} ${currency}`;
}

function scopeLabel(scope: Scope) {
  if (scope === "selected") return "Selected";
  if (scope === "filtered") return "Filtered";
  return "All";
}

function exportButtonLabel(scope: Scope) {
  if (scope === "selected") return "Export selected";
  if (scope === "filtered") return "Export results";
  return "Export all";
}

function hasActiveFilters(filters: unknown, searchTerm: string) {
  if (searchTerm) return true;
  if (!filters || typeof filters !== "object") return false;
  return Object.keys(filters as object).length > 0;
}

/**
 * Export / import buttons injected into Content Manager list views.
 * Export follows: selected → search/filter results → all.
 * Formats: CSV, Excel, PDF.
 */
export function DataTransferListActions() {
  const { slug = "" } = useParams<{ slug?: string }>();
  const contentType = SLUG_TO_CONTENT_TYPE[slug];
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [{ query }] = useQueryParams();
  const selectedEntries = useSelectedEntries();

  const [busy, setBusy] = useState<"export" | "template" | "import" | null>(
    null,
  );
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  const searchTerm = typeof query?._q === "string" ? query._q.trim() : "";
  const filters = query?.filters;

  const scope: Scope = useMemo(() => {
    if (selectedEntries.length > 0) return "selected";
    if (hasActiveFilters(filters, searchTerm)) return "filtered";
    return "all";
  }, [selectedEntries, filters, searchTerm]);

  const scopePayload = useMemo(() => {
    if (selectedEntries.length > 0) {
      return {
        documentIds: selectedEntries.map((entry) => entry.documentId),
      };
    }

    return {
      filters: filters ?? undefined,
      _q: searchTerm || undefined,
    };
  }, [selectedEntries, filters, searchTerm]);

  const scopeKey = JSON.stringify(scopePayload);

  useEffect(() => {
    if (contentType !== "orders") {
      setOrderSummary(null);
      return;
    }

    let cancelled = false;
    const payload = JSON.parse(scopeKey) as {
      documentIds?: string[];
      filters?: unknown;
      _q?: string;
    };

    async function loadSummary() {
      try {
        const response = await post("/data-transfer/summary/orders", payload);
        if (!cancelled) {
          setOrderSummary((response.data?.data ?? null) as OrderSummary | null);
        }
      } catch {
        if (!cancelled) setOrderSummary(null);
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [contentType, post, scopeKey]);

  if (!contentType) return null;

  const handleTemplate = async () => {
    setBusy("template");
    try {
      const response = await get(`/data-transfer/template/${contentType}`, {
        responseType: "text",
      });
      downloadBlob(
        `${contentType}-template.csv`,
        new Blob([String(response.data ?? "")], {
          type: "text/csv;charset=utf-8",
        }),
      );
    } catch {
      toggleNotification({
        type: "danger",
        message: "Could not download the import template.",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async () => {
    setBusy("export");
    try {
      const payload = {
        ...(JSON.parse(scopeKey) as {
          documentIds?: string[];
          filters?: unknown;
          _q?: string;
        }),
        format: exportFormat,
      };

      const response = await post(`/data-transfer/export/${contentType}`, payload);
      const data = response.data?.data as ExportResult | undefined;

      if (!data?.content && !data?.csv) {
        throw new Error("Missing export data");
      }

      downloadExport({
        ...data,
        content: data.content || data.csv || "",
        encoding: data.encoding || "utf8",
        mimeType: data.mimeType || "text/csv;charset=utf-8",
        filename: data.filename || `${contentType}-export.csv`,
        scope: data.scope || scope,
        format: data.format || exportFormat,
      });

      toggleNotification({
        type: "success",
        message: `${exportButtonLabel(data.scope ?? scope)} (${exportFormat.toUpperCase()}) downloaded.`,
      });
    } catch {
      toggleNotification({
        type: "danger",
        message: "Export failed. Please try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy("import");
    try {
      const csv = await readFileAsText(file);
      const response = await post(`/data-transfer/import/${contentType}`, {
        csv,
      });
      const result = response.data?.data as
        | {
            created: number;
            updated: number;
            skipped: number;
            errors: string[];
          }
        | undefined;

      if (!result) throw new Error("Missing import result");

      if (result.errors?.length) {
        toggleNotification({
          type: "warning",
          message: `Import finished with ${result.errors.length} issue(s). Created ${result.created}, updated ${result.updated}.`,
        });
      } else {
        toggleNotification({
          type: "success",
          message: `Import complete: ${result.created} created, ${result.updated} updated.`,
        });
      }

      window.location.reload();
    } catch {
      toggleNotification({
        type: "danger",
        message: "Import failed. Check your CSV and try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Flex gap={2} alignItems="center" wrap="wrap">
      {contentType === "orders" && orderSummary && (
        <Typography variant="pi" textColor="neutral700" fontWeight="semiBold">
          {scopeLabel(orderSummary.scope)} · {orderSummary.count} · Total{" "}
          {formatRwf(orderSummary.totalAmount, orderSummary.currency)}
        </Typography>
      )}

      <Button
        size="S"
        variant="tertiary"
        startIcon={<Download />}
        onClick={handleTemplate}
        loading={busy === "template"}
        disabled={busy !== null && busy !== "template"}
      >
        Template
      </Button>

      <SingleSelect
        size="S"
        value={exportFormat}
        onChange={(value: string) => setExportFormat(value as ExportFormat)}
        disabled={busy !== null}
        aria-label="Export format"
      >
        <SingleSelectOption value="csv">CSV</SingleSelectOption>
        <SingleSelectOption value="excel">Excel</SingleSelectOption>
        <SingleSelectOption value="pdf">PDF</SingleSelectOption>
      </SingleSelect>

      <Button
        size="S"
        variant="secondary"
        startIcon={<Upload />}
        onClick={handleExport}
        loading={busy === "export"}
        disabled={busy !== null && busy !== "export"}
      >
        {exportButtonLabel(scope)}
      </Button>
      <Button
        size="S"
        variant="secondary"
        startIcon={<Download />}
        onClick={handleImportClick}
        loading={busy === "import"}
        disabled={busy !== null && busy !== "import"}
      >
        Import
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleImportFile}
      />
    </Flex>
  );
}
