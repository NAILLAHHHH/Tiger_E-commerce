import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Layouts,
  Page,
  useFetchClient,
  useNotification,
} from "@strapi/strapi/admin";
import {
  Box,
  Button,
  Field,
  Flex,
  Grid,
  Loader,
  Main,
  TextInput,
  Typography,
} from "@strapi/design-system";
import {
  Archive,
  ArrowUp,
  Calendar,
  Download,
  Minus,
  Pencil,
  ShoppingCart,
  Stack,
} from "@strapi/icons";
import { styled } from "styled-components";

type Period = "day" | "month" | "year" | "custom";
type Tone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "alternative"
  | "neutral";
type Tab = "movements" | "prices";

type IconType = ComponentType<{
  fill?: string;
  width?: string | number;
  height?: string | number;
}>;

type MovementRow = {
  id: number;
  movement_type: string;
  quantity_delta: number;
  quantity_before: number | null;
  quantity_after: number | null;
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
    added: number;
    removed: number;
    netChange: number;
    movementCount: number;
  };
  openingBalance: number;
  closingBalance: number;
  currentStock?: number;
  movements: MovementRow[];
  priceChanges: PriceRow[];
  monthlyBreakdown: Array<{
    key: string;
    label: string;
    sales: number;
    restocked: number;
    added: number;
    removed: number;
    netChange: number;
    movementCount: number;
  }>;
};

const MOVEMENT_LABELS: Record<string, string> = {
  sale: "Sale",
  cancel_restore: "Cancellation restored",
  restock: "Restocks",
  adjustment: "Adjustments",
  count: "Stock counts",
  import: "Imports",
  initial: "Initial stock",
};

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
];

const LIST_PREVIEW = 15;

const MOVEMENT_COLUMN_WIDTHS = [
  "10%",
  "13%",
  "10%",
  "7%",
  "8%",
  "10%",
  "7%",
  "10%",
  "12%",
  "13%",
];

const PRICE_COLUMN_WIDTHS = [
  "11%",
  "14%",
  "11%",
  "7%",
  "8%",
  "11%",
  "10%",
  "10%",
  "18%",
];

const TONES: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: "primary100", fg: "primary600" },
  secondary: { bg: "secondary100", fg: "secondary600" },
  success: { bg: "success100", fg: "success600" },
  warning: { bg: "warning100", fg: "warning600" },
  danger: { bg: "danger100", fg: "danger600" },
  alternative: { bg: "alternative100", fg: "alternative600" },
  neutral: { bg: "neutral150", fg: "neutral600" },
};

const ListRow = styled(Flex)`
  border-radius: 6px;
  margin: 0 -8px;
  padding: 10px 8px;
  transition: background 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.neutral100};
  }
`;

const DataTable = styled.table`
  width: 100%;
  min-width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 1.2rem;
`;

const Th = styled.th`
  padding: 10px 12px;
  text-align: left;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral600};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 12px;
  vertical-align: top;
  color: ${({ theme }) => theme.colors.neutral800};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral100};
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TableWrap = styled(Box)`
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
`;

const FullWidthPanel = styled(Box)`
  width: 100%;
`;

const StretchColumn = styled(Box)`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const EmptyTableCell = styled(Td)`
  text-align: center;
  vertical-align: middle;
  padding: 32px 12px;
  border-bottom: none;
`;

function TableColGroup({ widths }: { widths: string[] }) {
  return (
    <colgroup>
      {widths.map((width, index) => (
        <col key={index} style={{ width }} />
      ))}
    </colgroup>
  );
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function movementLabel(type: string, delta?: number) {
  if (type === "adjustment" && typeof delta === "number") {
    if (delta > 0) return "Added";
    if (delta < 0) return "Removed";
  }
  return MOVEMENT_LABELS[type] ?? type;
}

function movementTone(type: string): Tone {
  switch (type) {
    case "sale":
      return "secondary";
    case "cancel_restore":
      return "success";
    case "restock":
      return "success";
    case "adjustment":
    case "count":
      return "warning";
    case "import":
      return "primary";
    case "initial":
      return "alternative";
    default:
      return "neutral";
  }
}

function formatStockLevel(before: number | null, after: number | null) {
  if (before == null || after == null) return "—";
  return `${before} → ${after}`;
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return `RWF ${Math.round(value).toLocaleString("en-US")}`;
}

function formatDelta(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function buildReconciliation(data: HistoryData) {
  const { summary, openingBalance, closingBalance } = data;
  const parts = [String(openingBalance)];

  if (summary.added > 0) parts.push(`+${summary.added} added`);
  if (summary.removed > 0) parts.push(`−${summary.removed} removed`);
  if (summary.sales > 0) parts.push(`−${summary.sales} sold`);
  if (summary.restored > 0) parts.push(`+${summary.restored} restored`);

  parts.push(`= ${closingBalance}`);
  return parts.join(" · ");
}

function IconTile({
  icon: Icon,
  tone,
  size = 36,
}: {
  icon: IconType;
  tone: Tone;
  size?: number;
}) {
  const t = TONES[tone];
  const glyph = Math.round(size * 0.5);
  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      background={t.bg}
      shrink={0}
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
    >
      <Icon fill={t.fg} width={`${glyph}px`} height={`${glyph}px`} />
    </Flex>
  );
}

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <Box
      background={t.bg}
      shrink={0}
      paddingLeft={2}
      paddingRight={2}
      style={{ paddingTop: 2, paddingBottom: 2, borderRadius: 999 }}
    >
      <Typography variant="pi" fontWeight="bold" textColor={t.fg}>
        {children}
      </Typography>
    </Box>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  tone = "neutral",
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: IconType;
  tone?: Tone;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Flex
      direction="column"
      alignItems="stretch"
      gap={4}
      hasRadius
      background="neutral0"
      borderColor="neutral150"
      shadow="tableShadow"
      paddingTop={5}
      paddingBottom={5}
      paddingLeft={5}
      paddingRight={5}
      style={{ height: "100%", width: "100%" }}
    >
      <Flex justifyContent="space-between" alignItems="flex-start" gap={3}>
        <Flex gap={3} alignItems="center" style={{ minWidth: 0 }}>
          <IconTile icon={icon} tone={tone} />
          <Box style={{ minWidth: 0 }}>
            <Typography variant="delta" textColor="neutral800">
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                variant="pi"
                textColor="neutral600"
                style={{ marginTop: 2, display: "block" }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Flex>
        {action}
      </Flex>
      <Box background="neutral150" style={{ height: 1 }} />
      <Box
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </Flex>
  );
}

function StatChip({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconType;
  tone?: Tone;
}) {
  return (
    <Box
      hasRadius
      background="neutral0"
      borderColor="neutral150"
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
      style={{ height: "100%" }}
    >
      <Flex gap={3} alignItems="center">
        <IconTile icon={icon} tone={tone} size={32} />
        <Box style={{ minWidth: 0 }}>
          <Typography variant="pi" textColor="neutral600">
            {label}
          </Typography>
          <Flex gap={2} alignItems="baseline" wrap="wrap">
            <Typography variant="delta" fontWeight="bold" textColor="neutral800">
              {value}
            </Typography>
            {hint ? (
              <Typography variant="pi" textColor="neutral500">
                {hint}
              </Typography>
            ) : null}
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Flex justifyContent="center" paddingTop={6} paddingBottom={6}>
      <Typography variant="pi" textColor="neutral500">
        {message}
      </Typography>
    </Flex>
  );
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
  link.download =
    result.filename || `${contentType}.${format === "excel" ? "xlsx" : "csv"}`;
  link.click();
  URL.revokeObjectURL(url);
}

function ActivityLogTable({
  activeTab,
  rows,
}: {
  activeTab: Tab;
  rows: Array<MovementRow | PriceRow>;
}) {
  const emptyMessage =
    activeTab === "movements"
      ? "No stock movements in this period."
      : "No price changes in this period.";

  if (activeTab === "movements") {
    return (
      <TableWrap>
        <DataTable>
          <TableColGroup widths={MOVEMENT_COLUMN_WIDTHS} />
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Product</Th>
              <Th>Code</Th>
              <Th>Size</Th>
              <Th>Color</Th>
              <Th>Type</Th>
              <Th>Change</Th>
              <Th>Stock</Th>
              <Th>Order ref</Th>
              <Th>Note</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <>
                <tr aria-hidden="true" style={{ height: 0, lineHeight: 0 }}>
                  {MOVEMENT_COLUMN_WIDTHS.map((_, index) => (
                    <Td key={index} style={{ padding: 0, border: "none", fontSize: 0 }}>
                      &nbsp;
                    </Td>
                  ))}
                </tr>
                <tr>
                  <EmptyTableCell colSpan={10}>
                    <Typography variant="pi" textColor="neutral500">
                      {emptyMessage}
                    </Typography>
                  </EmptyTableCell>
                </tr>
              </>
            ) : (
              (rows as MovementRow[]).map((row) => {
                const tone = movementTone(row.movement_type);
                const deltaTone =
                  row.quantity_delta > 0
                    ? "success600"
                    : row.quantity_delta < 0
                      ? "danger600"
                      : "neutral600";

                return (
                  <tr key={row.id}>
                    <Td>
                      <Typography variant="pi" textColor="neutral600">
                        {formatWhen(row.createdAt)}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography variant="pi" fontWeight="semiBold">
                        {row.product_name || "—"}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography variant="pi" textColor="neutral600">
                        {row.item_code || "—"}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography variant="pi" textColor="neutral600">
                        {row.size || "—"}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography variant="pi" textColor="neutral600">
                        {row.color || "—"}
                      </Typography>
                    </Td>
                    <Td>
                      <Pill tone={tone}>
                        {movementLabel(row.movement_type, row.quantity_delta)}
                      </Pill>
                    </Td>
                    <Td>
                      <Typography variant="pi" fontWeight="bold" textColor={deltaTone}>
                        {formatDelta(row.quantity_delta)}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography variant="pi" textColor="neutral600">
                        {formatStockLevel(row.quantity_before, row.quantity_after)}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography variant="pi" textColor="neutral600">
                        {row.order_reference || "—"}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography variant="pi" textColor="neutral500">
                        {row.reason || "—"}
                      </Typography>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DataTable>
      </TableWrap>
    );
  }

  return (
    <TableWrap>
      <DataTable>
        <TableColGroup widths={PRICE_COLUMN_WIDTHS} />
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Product</Th>
            <Th>Code</Th>
            <Th>Size</Th>
            <Th>Color</Th>
            <Th>Price type</Th>
            <Th>Before</Th>
            <Th>After</Th>
            <Th>Note</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <>
              <tr aria-hidden="true" style={{ height: 0, lineHeight: 0 }}>
                {PRICE_COLUMN_WIDTHS.map((_, index) => (
                  <Td key={index} style={{ padding: 0, border: "none", fontSize: 0 }}>
                    &nbsp;
                  </Td>
                ))}
              </tr>
              <tr>
                <EmptyTableCell colSpan={9}>
                  <Typography variant="pi" textColor="neutral500">
                    {emptyMessage}
                  </Typography>
                </EmptyTableCell>
              </tr>
            </>
          ) : (
            (rows as PriceRow[]).map((row) => (
              <tr key={row.id}>
                <Td>
                  <Typography variant="pi" textColor="neutral600">
                    {formatWhen(row.createdAt)}
                  </Typography>
                </Td>
                <Td>
                  <Typography variant="pi" fontWeight="semiBold">
                    {row.product_name || "—"}
                  </Typography>
                </Td>
                <Td>
                  <Typography variant="pi" textColor="neutral600">
                    {row.item_code || "—"}
                  </Typography>
                </Td>
                <Td>
                  <Typography variant="pi" textColor="neutral600">
                    {row.size || "—"}
                  </Typography>
                </Td>
                <Td>
                  <Typography variant="pi" textColor="neutral600">
                    {row.color || "—"}
                  </Typography>
                </Td>
                <Td>
                  <Pill tone="primary">
                    {row.price_field === "price_for_bulk" ? "Bulk" : "Retail"}
                  </Pill>
                </Td>
                <Td>
                  <Typography variant="pi" textColor="neutral600">
                    {formatMoney(row.price_before)}
                  </Typography>
                </Td>
                <Td>
                  <Typography variant="pi" fontWeight="semiBold">
                    {formatMoney(row.price_after)}
                  </Typography>
                </Td>
                <Td>
                  <Typography variant="pi" textColor="neutral500">
                    {row.reason || "—"}
                  </Typography>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>
    </TableWrap>
  );
}

export function InventoryHistory() {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [period, setPeriod] = useState<Period>("day");
  const [anchorDate, setAnchorDate] = useState(todayInputValue());
  const [fromDate, setFromDate] = useState(todayInputValue());
  const [toDate, setToDate] = useState(todayInputValue());
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("movements");
  const [listExpanded, setListExpanded] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = { period };
    if (period === "custom") {
      params.from = fromDate;
      params.to = toDate;
    } else {
      params.date = anchorDate;
    }
    return params;
  }, [period, anchorDate, fromDate, toDate]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setListExpanded(false);
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

  const activeRows =
    activeTab === "movements" ? (data?.movements ?? []) : (data?.priceChanges ?? []);
  const visibleRows = listExpanded
    ? activeRows
    : activeRows.slice(0, LIST_PREVIEW);

  return (
    <Main>
      <Page.Title>Stock history</Page.Title>

      <Layouts.Content>
        <Flex direction="column" gap={5} alignItems="stretch" style={{ width: "100%" }}>
          <Flex justifyContent="space-between" alignItems="flex-start" gap={4} wrap="wrap">
            <Box>
              <Typography variant="alpha" textColor="neutral800">
                Inventory history
              </Typography>
              <Typography variant="pi" textColor="neutral600" style={{ marginTop: 4 }}>
                Track stock movements and price changes. Sales appear here from Orders.
              </Typography>
            </Box>
            <Flex gap={2} wrap="wrap">
              <Button
                variant="secondary"
                startIcon={<Download />}
                loading={exporting}
                onClick={() => void handleExport("inventory-movements", "csv")}
              >
                Export movements
              </Button>
              <Button
                variant="tertiary"
                loading={exporting}
                onClick={() => void handleExport("price-histories", "csv")}
              >
                Export prices
              </Button>
            </Flex>
          </Flex>

          <Grid.Root gap={4} style={{ alignItems: "stretch", width: "100%" }}>
            <Grid.Item col={5} xs={12} style={{ display: "flex" }}>
              <StretchColumn>
              <Panel
                title="Period"
                subtitle="Choose the day, month, year, or custom range to review"
                icon={Calendar}
                tone="secondary"
              >
                <Flex direction="column" gap={4}>
                  <Flex gap={2} wrap="wrap">
                    {PERIODS.map((item) => (
                      <Button
                        key={item.value}
                        size="S"
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
                        <Grid.Item col={12}>
                          <Field.Root name="from">
                            <Field.Label>From</Field.Label>
                            <TextInput
                              type="date"
                              value={fromDate}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                setFromDate(event.target.value)
                              }
                            />
                          </Field.Root>
                        </Grid.Item>
                        <Grid.Item col={12}>
                          <Field.Root name="to">
                            <Field.Label>To</Field.Label>
                            <TextInput
                              type="date"
                              value={toDate}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                setToDate(event.target.value)
                              }
                            />
                          </Field.Root>
                        </Grid.Item>
                      </>
                    ) : (
                      <Grid.Item col={12}>
                        <Field.Root name="date">
                          <Field.Label>{period === "year" ? "Year" : "Date"}</Field.Label>
                          <TextInput
                            type="date"
                            value={anchorDate}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                              setAnchorDate(event.target.value)
                            }
                          />
                        </Field.Root>
                      </Grid.Item>
                    )}
                  </Grid.Root>
                </Flex>
              </Panel>
              </StretchColumn>
            </Grid.Item>

            <Grid.Item col={7} xs={12} style={{ display: "flex" }}>
              <StretchColumn>
              {loading ? (
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  hasRadius
                  background="neutral0"
                  borderColor="neutral150"
                  shadow="tableShadow"
                  style={{ flex: 1, minHeight: 360 }}
                >
                  <Loader>Loading history…</Loader>
                </Flex>
              ) : !data ? (
                <Panel
                  title="Summary"
                  subtitle="Could not load data for this period"
                  icon={Calendar}
                  tone="neutral"
                >
                  <EmptyState message="Try choosing a different period." />
                </Panel>
              ) : (
                <Panel
                  title={data.range.label}
                  subtitle={buildReconciliation(data)}
                  icon={Calendar}
                  tone="alternative"
                >
                  <Grid.Root gap={3}>
                    <Grid.Item col={6} xs={12}>
                      <StatChip
                        label="Opening balance"
                        value={data.openingBalance.toLocaleString()}
                        hint="units at period start"
                        icon={Stack}
                        tone="neutral"
                      />
                    </Grid.Item>
                    <Grid.Item col={6} xs={12}>
                      <StatChip
                        label="Closing balance"
                        value={data.closingBalance.toLocaleString()}
                        hint="units at period end"
                        icon={Stack}
                        tone="primary"
                      />
                    </Grid.Item>
                    <Grid.Item col={6} xs={12}>
                      <StatChip
                        label="Added"
                        value={String(data.summary.added ?? 0)}
                        hint="restocks and manual increases"
                        icon={ArrowUp}
                        tone="success"
                      />
                    </Grid.Item>
                    <Grid.Item col={6} xs={12}>
                      <StatChip
                        label="Removed"
                        value={String(data.summary.removed ?? 0)}
                        hint="manual decreases (not sales)"
                        icon={Minus}
                        tone="warning"
                      />
                    </Grid.Item>
                    <Grid.Item col={6} xs={12}>
                      <StatChip
                        label="Sold"
                        value={String(data.summary.sales)}
                        hint="units shipped on orders"
                        icon={ShoppingCart}
                        tone="secondary"
                      />
                    </Grid.Item>
                    <Grid.Item col={6} xs={12}>
                      <StatChip
                        label="Restored"
                        value={String(data.summary.restored)}
                        hint="returned from cancelled orders"
                        icon={Archive}
                        tone="alternative"
                      />
                    </Grid.Item>
                  </Grid.Root>
                </Panel>
              )}
              </StretchColumn>
            </Grid.Item>

            {!loading && data ? (
              <>
                {data.monthlyBreakdown.length > 0 ? (
                  <Grid.Item col={12} style={{ display: "flex", width: "100%" }}>
                    <FullWidthPanel>
                      <Panel
                        title="Monthly breakdown"
                        subtitle="Totals grouped by month for the selected year"
                        icon={Calendar}
                        tone="secondary"
                      >
                        <Flex direction="column" gap={1}>
                          {data.monthlyBreakdown.map((month) => (
                            <ListRow
                              key={month.key}
                              justifyContent="space-between"
                              alignItems="center"
                              gap={3}
                            >
                              <Typography fontWeight="semiBold">{month.label}</Typography>
                              <Typography variant="pi" textColor="neutral600">
                                {month.movementCount} events · +{month.added ?? 0} added · −
                                {month.removed ?? 0} removed · sold {month.sales}
                              </Typography>
                            </ListRow>
                          ))}
                        </Flex>
                      </Panel>
                    </FullWidthPanel>
                  </Grid.Item>
                ) : null}

                <Grid.Item col={12} style={{ display: "flex", width: "100%" }}>
                  <FullWidthPanel>
                    <Panel
                      title="Activity log"
                      subtitle="Newest events first"
                      icon={Pencil}
                      tone="neutral"
                      action={
                        <Flex gap={2}>
                          <Button
                            size="S"
                            variant={activeTab === "movements" ? "default" : "tertiary"}
                            onClick={() => {
                              setActiveTab("movements");
                              setListExpanded(false);
                            }}
                          >
                            Movements ({data.movements.length})
                          </Button>
                          <Button
                            size="S"
                            variant={activeTab === "prices" ? "default" : "tertiary"}
                            onClick={() => {
                              setActiveTab("prices");
                              setListExpanded(false);
                            }}
                          >
                            Prices ({data.priceChanges.length})
                          </Button>
                        </Flex>
                      }
                    >
                      <ActivityLogTable activeTab={activeTab} rows={visibleRows} />

                      {activeRows.length > LIST_PREVIEW ? (
                        <Box paddingTop={2}>
                          <Button
                            size="S"
                            variant="tertiary"
                            onClick={() => setListExpanded((expanded) => !expanded)}
                          >
                            {listExpanded
                              ? "See less"
                              : `See more (${activeRows.length - LIST_PREVIEW} more)`}
                          </Button>
                        </Box>
                      ) : null}
                    </Panel>
                  </FullWidthPanel>
                </Grid.Item>
              </>
            ) : null}
          </Grid.Root>
        </Flex>
      </Layouts.Content>
    </Main>
  );
}
