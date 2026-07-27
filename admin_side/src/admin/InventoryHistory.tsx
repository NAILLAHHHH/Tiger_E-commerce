import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layouts,
  Page,
  useFetchClient,
  useNotification,
} from "@strapi/strapi/admin";
import {
  Box,
  Button,
  Flex,
  Grid,
  Loader,
  Main,
  SingleSelect,
  SingleSelectOption,
  TextInput,
  Typography,
} from "@strapi/design-system";
import { Calendar, Download, Plus } from "@strapi/icons";
import { styled } from "styled-components";

type Period = "day" | "month" | "year" | "custom";

type MovementRow = {
  id: number;
  movement_type: string;
  quantity_delta: number;
  quantity_before: number;
  quantity_after: number;
  item_code: string;
  product_name: string;
  size: string;
  color: string;
  order_reference: string;
  reason: string;
  source: string;
  createdAt: string | null;
};

type PriceRow = {
  id: number;
  price_field: string;
  price_before: number | null;
  price_after: number | null;
  item_code: string;
  product_name: string;
  size: string;
  color: string;
  reason: string;
  createdAt: string | null;
};

type HistoryData = {
  range: {
    period: string;
    from: string | null;
    to: string | null;
    label: string;
  };
  summary: {
    sales: number;
    restocked: number;
    restored: number;
    adjustedIn: number;
    adjustedOut: number;
    netChange: number;
    movementCount: number;
  };
  openingBalance: number;
  closingBalance: number;
  movements: MovementRow[];
  priceChanges: PriceRow[];
  monthlyBreakdown: Array<{
    key: string;
    label: string;
    sales: number;
    restocked: number;
    netChange: number;
    movementCount: number;
  }>;
};

const MOVEMENT_TYPES = [
  { value: "", label: "All types" },
  { value: "sale", label: "Sales" },
  { value: "cancel_restore", label: "Cancellations restored" },
  { value: "restock", label: "Restocks" },
  { value: "adjustment", label: "Adjustments" },
  { value: "import", label: "Imports" },
  { value: "initial", label: "Initial stock" },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom range" },
];

const Panel = styled(Box)`
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  border-radius: 8px;
  padding: 20px;
`;

const StatCard = styled(Box)`
  background: ${({ theme }) => theme.colors.neutral100};
  border-radius: 8px;
  padding: 16px;
`;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function movementLabel(type: string) {
  return MOVEMENT_TYPES.find((item) => item.value === type)?.label ?? type;
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return `RWF ${Math.round(value).toLocaleString("en-US")}`;
}

async function downloadExport(
  post: ReturnType<typeof useFetchClient>["post"],
  contentType: string,
  params: Record<string, string>,
  format: "csv" | "excel",
) {
  const response = await post(`/data-transfer/export/${contentType}`, {
    ...params,
    format,
  });
  const result = response.data?.data;
  if (!result?.content && !result?.csv) return;

  const content = result.content || result.csv;
  const blob =
    result.encoding === "base64"
      ? (() => {
          const binary = atob(content);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }
          return new Blob([bytes], {
            type: result.mimeType || "application/octet-stream",
          });
        })()
      : new Blob([content], {
          type: result.mimeType || "text/csv;charset=utf-8",
        });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename || `${contentType}.${format === "excel" ? "xlsx" : "csv"}`;
  link.click();
  URL.revokeObjectURL(url);
}

export function InventoryHistory() {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [period, setPeriod] = useState<Period>("day");
  const [anchorDate, setAnchorDate] = useState(todayInputValue());
  const [fromDate, setFromDate] = useState(todayInputValue());
  const [toDate, setToDate] = useState(todayInputValue());
  const [itemCode, setItemCode] = useState("");
  const [movementType, setMovementType] = useState("");
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [restockCode, setRestockCode] = useState("");
  const [restockQty, setRestockQty] = useState("5");
  const [restockNote, setRestockNote] = useState("");
  const [restocking, setRestocking] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = { period };
    if (period === "custom") {
      params.from = fromDate;
      params.to = toDate;
    } else {
      params.date = anchorDate;
    }
    if (itemCode.trim()) params.item_code = itemCode.trim();
    if (movementType) params.movement_type = movementType;
    return params;
  }, [period, anchorDate, fromDate, toDate, itemCode, movementType]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const search = new URLSearchParams(queryParams).toString();
      const response = await get(`/data-transfer/history/inventory?${search}`);
      setData(response.data?.data ?? null);
    } catch {
      toggleNotification({
        type: "danger",
        message: "Could not load stock history.",
      });
    } finally {
      setLoading(false);
    }
  }, [get, queryParams, toggleNotification]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleExport = async (contentType: string, format: "csv" | "excel") => {
    setExporting(true);
    try {
      await downloadExport(post, contentType, queryParams, format);
    } catch {
      toggleNotification({
        type: "danger",
        message: "Export failed.",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleRestock = async () => {
    const code = restockCode.trim();
    const quantity = Math.round(Number(restockQty));
    if (!code) {
      toggleNotification({ type: "warning", message: "Enter a product code." });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toggleNotification({ type: "warning", message: "Enter a positive quantity." });
      return;
    }

    setRestocking(true);
    try {
      await post("/data-transfer/inventory/restock", {
        item_code: code,
        quantity,
        note: restockNote.trim() || undefined,
      });

      toggleNotification({
        type: "success",
        message: `Added ${quantity} to ${code}.`,
      });
      setRestockNote("");
      await loadHistory();
    } catch {
      toggleNotification({
        type: "danger",
        message: "Could not receive stock.",
      });
    } finally {
      setRestocking(false);
    }
  };

  return (
    <Main>
      <Page.Title>
        <Flex gap={2} alignItems="center">
          <Calendar />
          Stock history
        </Flex>
      </Page.Title>

      <Layouts.Content>
        <Flex direction="column" gap={5}>
          <Panel>
            <Flex direction="column" gap={4}>
              <Typography variant="beta">Filters</Typography>
              <Flex gap={2} wrap="wrap">
                {PERIODS.map((item) => (
                  <Button
                    key={item.value}
                    variant={period === item.value ? "default" : "tertiary"}
                    onClick={() => setPeriod(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Flex>

              <Grid.Root gap={4}>
                {period === "custom" ? (
                  <>
                    <Grid.Item col={3} xs={12}>
                      <TextInput
                        label="From"
                        name="from"
                        type="date"
                        value={fromDate}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setFromDate(event.target.value)
                        }
                      />
                    </Grid.Item>
                    <Grid.Item col={3} xs={12}>
                      <TextInput
                        label="To"
                        name="to"
                        type="date"
                        value={toDate}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setToDate(event.target.value)
                        }
                      />
                    </Grid.Item>
                  </>
                ) : (
                  <Grid.Item col={3} xs={12}>
                    <TextInput
                      label={period === "year" ? "Year anchor" : "Date"}
                      name="date"
                      type="date"
                      value={anchorDate}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setAnchorDate(event.target.value)
                      }
                    />
                  </Grid.Item>
                )}
                <Grid.Item col={3} xs={12}>
                  <TextInput
                    label="Product code"
                    name="item_code"
                    placeholder="e.g. Grey-Hoodie-M"
                    value={itemCode}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setItemCode(event.target.value)
                    }
                  />
                </Grid.Item>
                <Grid.Item col={3} xs={12}>
                  <SingleSelect
                    label="Movement type"
                    placeholder="All types"
                    value={movementType}
                    onChange={(value: string) => setMovementType(value)}
                  >
                    {MOVEMENT_TYPES.map((item) => (
                      <SingleSelectOption key={item.value || "all"} value={item.value}>
                        {item.label}
                      </SingleSelectOption>
                    ))}
                  </SingleSelect>
                </Grid.Item>
              </Grid.Root>

              <Flex gap={2} wrap="wrap">
                <Button onClick={() => void loadHistory()}>Apply</Button>
                <Button
                  variant="secondary"
                  startIcon={<Download />}
                  loading={exporting}
                  onClick={() => void handleExport("inventory-movements", "csv")}
                >
                  Export movements (CSV)
                </Button>
                <Button
                  variant="secondary"
                  startIcon={<Download />}
                  loading={exporting}
                  onClick={() => void handleExport("inventory-movements", "excel")}
                >
                  Export movements (Excel)
                </Button>
                <Button
                  variant="tertiary"
                  loading={exporting}
                  onClick={() => void handleExport("price-histories", "csv")}
                >
                  Export price changes
                </Button>
              </Flex>
            </Flex>
          </Panel>

          <Panel>
            <Typography variant="beta">Receive stock</Typography>
            <Typography variant="pi" textColor="neutral600">
              Add units when a shipment arrives. This is logged automatically as a restock.
            </Typography>
            <Box paddingTop={4}>
              <Grid.Root gap={4}>
                <Grid.Item col={3} xs={12}>
                  <TextInput
                    label="Product code"
                    name="restock_code"
                    placeholder="Grey-Hoodie-M"
                    value={restockCode}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setRestockCode(event.target.value)
                    }
                  />
                </Grid.Item>
                <Grid.Item col={2} xs={12}>
                  <TextInput
                    label="Quantity to add"
                    name="restock_qty"
                    type="number"
                    min={1}
                    value={restockQty}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setRestockQty(event.target.value)
                    }
                  />
                </Grid.Item>
                <Grid.Item col={4} xs={12}>
                  <TextInput
                    label="Note (optional)"
                    name="restock_note"
                    placeholder="Delivery #42"
                    value={restockNote}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setRestockNote(event.target.value)
                    }
                  />
                </Grid.Item>
                <Grid.Item col={3} xs={12}>
                  <Box paddingTop={6}>
                    <Button
                      startIcon={<Plus />}
                      loading={restocking}
                      onClick={() => void handleRestock()}
                    >
                      Receive stock
                    </Button>
                  </Box>
                </Grid.Item>
              </Grid.Root>
            </Box>
          </Panel>

          {loading ? (
            <Flex justifyContent="center" padding={8}>
              <Loader>Loading history…</Loader>
            </Flex>
          ) : !data ? (
            <Typography textColor="neutral600">No data.</Typography>
          ) : (
            <>
              <Panel>
                <Typography variant="beta">{data.range.label}</Typography>
                <Box paddingTop={4}>
                  <Grid.Root gap={4}>
                    <Grid.Item col={3} xs={6}>
                      <StatCard>
                        <Typography variant="pi" textColor="neutral600">
                          Opening balance
                        </Typography>
                        <Typography variant="alpha">
                          {data.openingBalance.toLocaleString()}
                        </Typography>
                      </StatCard>
                    </Grid.Item>
                    <Grid.Item col={3} xs={6}>
                      <StatCard>
                        <Typography variant="pi" textColor="neutral600">
                          Closing balance
                        </Typography>
                        <Typography variant="alpha">
                          {data.closingBalance.toLocaleString()}
                        </Typography>
                      </StatCard>
                    </Grid.Item>
                    <Grid.Item col={2} xs={6}>
                      <StatCard>
                        <Typography variant="pi" textColor="neutral600">
                          Sold
                        </Typography>
                        <Typography variant="alpha">{data.summary.sales}</Typography>
                      </StatCard>
                    </Grid.Item>
                    <Grid.Item col={2} xs={6}>
                      <StatCard>
                        <Typography variant="pi" textColor="neutral600">
                          Restocked
                        </Typography>
                        <Typography variant="alpha">
                          {data.summary.restocked}
                        </Typography>
                      </StatCard>
                    </Grid.Item>
                    <Grid.Item col={2} xs={6}>
                      <StatCard>
                        <Typography variant="pi" textColor="neutral600">
                          Net change
                        </Typography>
                        <Typography variant="alpha">
                          {data.summary.netChange > 0 ? "+" : ""}
                          {data.summary.netChange}
                        </Typography>
                      </StatCard>
                    </Grid.Item>
                  </Grid.Root>
                </Box>
              </Panel>

              {data.monthlyBreakdown.length > 0 ? (
                <Panel>
                  <Typography variant="beta">Monthly breakdown</Typography>
                  <Box paddingTop={3}>
                    <Flex direction="column" gap={2}>
                      {data.monthlyBreakdown.map((month) => (
                        <Flex
                          key={month.key}
                          justifyContent="space-between"
                          gap={3}
                          wrap="wrap"
                        >
                          <Typography fontWeight="semiBold">{month.label}</Typography>
                          <Typography textColor="neutral600">
                            {month.movementCount} events · sold {month.sales} · restocked{" "}
                            {month.restocked} · net {month.netChange > 0 ? "+" : ""}
                            {month.netChange}
                          </Typography>
                        </Flex>
                      ))}
                    </Flex>
                  </Box>
                </Panel>
              ) : null}

              <Panel>
                <Typography variant="beta">
                  Movements ({data.movements.length})
                </Typography>
                <Box paddingTop={3}>
                  {data.movements.length === 0 ? (
                    <Typography textColor="neutral600">
                      No stock movements in this period.
                    </Typography>
                  ) : (
                    <Flex direction="column" gap={2}>
                      {data.movements.map((row) => (
                        <Flex
                          key={row.id}
                          justifyContent="space-between"
                          gap={3}
                          wrap="wrap"
                          padding={2}
                          background="neutral100"
                          hasRadius
                        >
                          <Box style={{ minWidth: 0 }}>
                            <Typography fontWeight="semiBold">
                              {row.product_name || row.item_code || "Item"}
                            </Typography>
                            <Typography variant="pi" textColor="neutral600">
                              {[
                                formatWhen(row.createdAt),
                                movementLabel(row.movement_type),
                                row.size,
                                row.color,
                                row.item_code,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </Typography>
                            {row.order_reference || row.reason ? (
                              <Typography variant="pi" textColor="neutral500">
                                {[row.order_reference, row.reason]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </Typography>
                            ) : null}
                          </Box>
                          <Typography fontWeight="bold">
                            {row.quantity_delta > 0 ? "+" : ""}
                            {row.quantity_delta} → {row.quantity_after}
                          </Typography>
                        </Flex>
                      ))}
                    </Flex>
                  )}
                </Box>
              </Panel>

              <Panel>
                <Typography variant="beta">
                  Price changes ({data.priceChanges.length})
                </Typography>
                <Box paddingTop={3}>
                  {data.priceChanges.length === 0 ? (
                    <Typography textColor="neutral600">
                      No price changes in this period.
                    </Typography>
                  ) : (
                    <Flex direction="column" gap={2}>
                      {data.priceChanges.map((row) => (
                        <Flex
                          key={row.id}
                          justifyContent="space-between"
                          gap={3}
                          wrap="wrap"
                          padding={2}
                          background="neutral100"
                          hasRadius
                        >
                          <Box>
                            <Typography fontWeight="semiBold">
                              {row.product_name || row.item_code}
                            </Typography>
                            <Typography variant="pi" textColor="neutral600">
                              {[formatWhen(row.createdAt), row.item_code, row.size, row.color]
                                .filter(Boolean)
                                .join(" · ")}
                            </Typography>
                          </Box>
                          <Typography>
                            {row.price_field === "price_for_bulk"
                              ? "Bulk price"
                              : "Retail price"}
                            : {formatMoney(row.price_before)} →{" "}
                            {formatMoney(row.price_after)}
                          </Typography>
                        </Flex>
                      ))}
                    </Flex>
                  )}
                </Box>
              </Panel>
            </>
          )}
        </Flex>
      </Layouts.Content>
    </Main>
  );
}
