import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  ContentBox,
  Layouts,
  Page,
  useAuth,
  useFetchClient,
  useGetCountDocumentsQuery,
} from "@strapi/strapi/admin";
import {
  Box,
  Button,
  Flex,
  Grid,
  Link,
  Loader,
  Main,
  Typography,
} from "@strapi/design-system";
import {
  Archive,
  BulletList,
  Calendar,
  ChartPie,
  ChevronRight,
  Clock,
  Crown,
  ExternalLink,
  GridFour,
  Layout,
  Pencil,
  Shirt,
  ShoppingCart,
  Sparkle,
  Stack,
  Store,
  WarningCircle,
} from "@strapi/icons";
import { useIntl } from "react-intl";
import { Link as RouterLink } from "react-router-dom";
import { styled } from "styled-components";

const STOREFRONT_URL = "http://localhost:3000";
const HOMEPAGE_EDIT_PATH =
  "/content-manager/single-types/api::homepage.homepage";
const PRODUCTS_PATH =
  "/content-manager/collection-types/api::product.product";
const VARIANTS_PATH =
  "/content-manager/collection-types/api::product-variant.product-variant";
const ORDERS_PATH =
  "/content-manager/collection-types/api::order.order";

type HeroSlidePreview = {
  tag?: string;
  title?: string;
  subtitle?: string;
  image?: { url?: string } | string | null;
};

type HomepagePreview = {
  hero_slides?: HeroSlidePreview[];
  features?: unknown[];
  promo_banners?: unknown[];
  new_arrivals_title?: string;
  featured_title?: string;
  categories_title?: string;
};

type PeriodReport = {
  key: string;
  label: string;
  rangeLabel: string;
  orders: number;
  unitsSold: number;
  revenue: number;
  cancelled: number;
  productsCreated: number;
  variantsCreated: number;
  stockUpdated: number;
  priceUpdated: number;
};

type TodayActivity = {
  type: string;
  at: string | null;
  title: string;
  detail?: string;
  amount?: number;
  documentId?: string;
};

type InventoryDashboard = {
  inventory: {
    skuCount: number;
    productCount: number;
    unitsInStock: number;
    outOfStock: number;
    lowStock: number;
    lowStockThreshold: number;
    unitsHandled: number;
    lowStockItems: Array<{
      documentId: string;
      item_code: string;
      product_name: string;
      size: string;
      color: string;
      how_many_left: number;
    }>;
  };
  sales: {
    ordersTotal: number;
    ordersActive: number;
    ordersCancelled: number;
    unitsSold: number;
    revenue: number;
    currency: string;
    last7Days: { orders: number; unitsSold: number; revenue: number };
    last30Days: { orders: number; unitsSold: number; revenue: number };
    topSold: Array<{
      product_name: string;
      item_code: string;
      size: string;
      color: string;
      units: number;
    }>;
  };
  today: PeriodReport & {
    label: string;
    date: string;
    activity: TodayActivity[];
  };
  reports: {
    today: PeriodReport;
    week: PeriodReport;
    month: PeriodReport;
    all: PeriodReport;
  };
  recent: {
    orders: Array<{
      documentId: string;
      order_reference: string;
      customer_name: string;
      order_status: string;
      total: number;
      createdAt: string | null;
    }>;
    stockUpdates: Array<{
      documentId: string;
      item_code: string;
      product_name: string;
      size: string;
      color: string;
      how_many_left: number;
      updatedAt: string | null;
    }>;
    newProducts: Array<{
      documentId: string;
      name: string;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
  };
};

type ReportKey = keyof InventoryDashboard["reports"];

const REPORT_KEYS: ReportKey[] = ["today", "week", "month", "all"];

const shortcuts = [
  {
    title: "Storefront homepage",
    subtitle: "Hero, features, promos, and section titles",
    to: HOMEPAGE_EDIT_PATH,
    icon: Layout,
  },
  {
    title: "Products",
    subtitle: "Catalog names, photos, and homepage flags",
    to: PRODUCTS_PATH,
    icon: Shirt,
  },
  {
    title: "Size & color",
    subtitle: "Prices, stock, and link each row to a product",
    to: VARIANTS_PATH,
    icon: Pencil,
  },
  {
    title: "Categories",
    subtitle: "Shop sections and display order",
    to: "/content-manager/collection-types/api::category.category",
    icon: GridFour,
  },
  {
    title: "Stock history",
    subtitle: "Movements, restocks, price changes, and exports",
    to: "/inventory-history",
    icon: Calendar,
  },
  {
    title: "Orders",
    subtitle: "Customer orders and fulfilment",
    to: ORDERS_PATH,
    icon: ShoppingCart,
  },
] as const;

function slideImageUrl(image: HeroSlidePreview["image"]): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  return image.url ?? null;
}

function formatMoney(amount: number, currency = "RWF") {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
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

function statusLabel(status: string) {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusTone(status: string): Tone {
  switch (status) {
    case "paid":
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "cancelled":
      return "danger";
    case "placed":
      return "secondary";
    default:
      return "neutral";
  }
}

type Tone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "alternative"
  | "neutral";

type IconType = ComponentType<{ fill?: string; width?: string; height?: string }>;

function activityTone(type: string): Tone {
  switch (type) {
    case "order":
      return "secondary";
    case "order_cancelled":
      return "danger";
    case "product_created":
      return "primary";
    case "variant_created":
      return "alternative";
    case "stock_updated":
      return "warning";
    case "price_updated":
      return "primary";
    default:
      return "neutral";
  }
}

function activityIcon(type: string): IconType {
  switch (type) {
    case "order":
      return ShoppingCart;
    case "order_cancelled":
      return Archive;
    case "product_created":
      return Shirt;
    case "variant_created":
      return Stack;
    case "stock_updated":
      return Pencil;
    case "price_updated":
      return Crown;
    default:
      return BulletList;
  }
}

function activityLabel(type: string) {
  switch (type) {
    case "order":
      return "Order";
    case "order_cancelled":
      return "Cancelled";
    case "product_created":
      return "Product";
    case "variant_created":
      return "Size/color";
    case "stock_updated":
      return "Stock";
    case "price_updated":
      return "Price";
    default:
      return "Change";
  }
}

const TONES: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: "primary100", fg: "primary600" },
  secondary: { bg: "secondary100", fg: "secondary600" },
  success: { bg: "success100", fg: "success600" },
  warning: { bg: "warning100", fg: "warning600" },
  danger: { bg: "danger100", fg: "danger600" },
  alternative: { bg: "alternative100", fg: "alternative600" },
  neutral: { bg: "neutral150", fg: "neutral600" },
};

const HoverCard = styled(Box)`
  height: 100%;
  transition:
    box-shadow 150ms ease,
    transform 150ms ease,
    border-color 150ms ease;

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.primary200};
    box-shadow: 0 6px 20px rgba(15, 15, 40, 0.08);
  }
`;

const ListRow = styled(Flex)`
  border-radius: 6px;
  margin: 0 -8px;
  padding: 8px;
  transition: background 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.neutral100};
  }
`;

function IconTile({
  icon: Icon,
  tone,
  size = 40,
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

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconType;
  tone?: Tone;
  to?: string;
}) {
  const body = (
    <HoverCard
      hasRadius
      background="neutral0"
      borderColor="neutral150"
      paddingTop={4}
      paddingBottom={4}
      paddingLeft={5}
      paddingRight={5}
    >
      <Flex justifyContent="space-between" alignItems="flex-start" gap={3}>
        <Box style={{ minWidth: 0 }}>
          <Typography variant="sigma" textColor="neutral500">
            {label}
          </Typography>
          <Typography
            variant="alpha"
            fontWeight="bold"
            textColor="neutral800"
            style={{ display: "block", marginTop: 8, lineHeight: 1.1 }}
          >
            {value}
          </Typography>
        </Box>
        <IconTile icon={icon} tone={tone} />
      </Flex>
      {hint ? (
        <Typography
          variant="pi"
          textColor="neutral500"
          style={{ display: "block", marginTop: 10 }}
        >
          {hint}
        </Typography>
      ) : null}
    </HoverCard>
  );

  if (!to) return body;

  return (
    <Box
      tag={RouterLink}
      to={to}
      style={{ display: "block", textDecoration: "none", color: "inherit", height: "100%" }}
    >
      {body}
    </Box>
  );
}

function StatChip({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconType;
  tone?: Tone;
  to?: string;
}) {
  const body = (
    <HoverCard
      hasRadius
      background="neutral0"
      borderColor="neutral150"
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
    >
      <Flex gap={3} alignItems="center">
        <IconTile icon={icon} tone={tone} size={36} />
        <Box style={{ minWidth: 0 }}>
          <Typography variant="pi" textColor="neutral600">
            {label}
          </Typography>
          <Flex gap={2} alignItems="baseline">
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
    </HoverCard>
  );

  if (!to) return body;

  return (
    <Box
      tag={RouterLink}
      to={to}
      style={{ display: "block", textDecoration: "none", color: "inherit", height: "100%" }}
    >
      {body}
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
      style={{ height: "100%" }}
    >
      <Flex justifyContent="space-between" alignItems="flex-start" gap={3}>
        <Flex gap={3} alignItems="center">
          <IconTile icon={icon} tone={tone} size={36} />
          <Box>
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
      {children}
    </Flex>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <Flex justifyContent="center" paddingTop={4} paddingBottom={4}>
      <Typography variant="pi" textColor="neutral500">
        {message}
      </Typography>
    </Flex>
  );
}

function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Box
      tag={RouterLink}
      to={to}
      style={{ textDecoration: "none", whiteSpace: "nowrap" }}
    >
      <Typography variant="pi" fontWeight="semiBold" textColor="primary600">
        {children}
      </Typography>
    </Box>
  );
}

function ShortcutCard({
  title,
  subtitle,
  to,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  to: string;
  icon: typeof Layout;
}) {
  return (
    <Box
      tag={RouterLink}
      to={to}
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <ContentBox
        title={title}
        subtitle={subtitle}
        icon={<Icon fill="primary600" />}
        iconBackground="primary100"
        endAction={
          <Box paddingLeft={2}>
            <ChevronRight fill="neutral500" />
          </Box>
        }
      />
    </Box>
  );
}

function InventoryDashboardSection() {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const [data, setData] = useState<InventoryDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportKey, setReportKey] = useState<ReportKey>("today");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await get("/data-transfer/dashboard/inventory");
        if (!cancelled) {
          setData((response.data?.data ?? null) as InventoryDashboard | null);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [get]);

  if (loading) {
    return (
      <Flex justifyContent="center" padding={8}>
        <Loader small>
          {formatMessage({
            id: "tigerwear.home.dashboard.loading",
            defaultMessage: "Loading store overview…",
          })}
        </Loader>
      </Flex>
    );
  }

  if (error || !data) {
    return (
      <Typography variant="pi" textColor="danger600">
        {formatMessage({
          id: "tigerwear.home.dashboard.error",
          defaultMessage:
            "Could not load the inventory dashboard. Refresh the page or check that Strapi is running.",
        })}
      </Typography>
    );
  }

  const { inventory, sales, recent } = data;
  const reports = data.reports ?? {
    today: {
      key: "today",
      label: "Today",
      rangeLabel: "Today",
      orders: 0,
      unitsSold: 0,
      revenue: 0,
      cancelled: 0,
      productsCreated: 0,
      variantsCreated: 0,
      stockUpdated: 0,
      priceUpdated: 0,
    },
    week: {
      key: "week",
      label: "This week",
      rangeLabel: "This week",
      orders: sales.last7Days?.orders ?? 0,
      unitsSold: sales.last7Days?.unitsSold ?? 0,
      revenue: sales.last7Days?.revenue ?? 0,
      cancelled: 0,
      productsCreated: 0,
      variantsCreated: 0,
      stockUpdated: 0,
      priceUpdated: 0,
    },
    month: {
      key: "month",
      label: "This month",
      rangeLabel: "This month",
      orders: sales.last30Days?.orders ?? 0,
      unitsSold: sales.last30Days?.unitsSold ?? 0,
      revenue: sales.last30Days?.revenue ?? 0,
      cancelled: 0,
      productsCreated: 0,
      variantsCreated: 0,
      stockUpdated: 0,
      priceUpdated: 0,
    },
    all: {
      key: "all",
      label: "All time",
      rangeLabel: "All time",
      orders: sales.ordersActive ?? 0,
      unitsSold: sales.unitsSold ?? 0,
      revenue: sales.revenue ?? 0,
      cancelled: sales.ordersCancelled ?? 0,
      productsCreated: 0,
      variantsCreated: 0,
      stockUpdated: 0,
      priceUpdated: 0,
    },
  };
  const today = data.today ?? {
    ...reports.today,
    label: new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    date: new Date().toISOString(),
    activity: [],
  };
  const report = reports[reportKey] ?? reports.today;

  return (
    <Flex direction="column" alignItems="stretch" gap={6}>
      <Flex gap={3} alignItems="center">
        <IconTile icon={Store} tone="primary" size={44} />
        <Box>
          <Typography variant="beta" textColor="neutral800">
            {formatMessage({
              id: "tigerwear.home.dashboard.title",
              defaultMessage: "Store overview",
            })}
          </Typography>
          <Typography
            variant="pi"
            textColor="neutral600"
            style={{ marginTop: 2, display: "block" }}
          >
            {formatMessage({
              id: "tigerwear.home.dashboard.subtitle",
              defaultMessage:
                "Daily activity, sales reports, stock levels, and recent changes",
            })}
          </Typography>
        </Box>
      </Flex>

      {/* Snapshot KPIs */}
      <Grid.Root gap={4}>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            label="Units in store"
            value={inventory.unitsInStock.toLocaleString()}
            hint={`${inventory.skuCount} size/color rows`}
            icon={Store}
            tone="primary"
            to={VARIANTS_PATH}
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            label="Units sold"
            value={sales.unitsSold.toLocaleString()}
            hint={`${sales.ordersActive} active orders`}
            icon={ShoppingCart}
            tone="secondary"
            to={ORDERS_PATH}
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            label="Store + sold"
            value={inventory.unitsHandled.toLocaleString()}
            hint="Current stock plus units sold"
            icon={Stack}
            tone="alternative"
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            label="All-time revenue"
            value={formatMoney(sales.revenue, sales.currency)}
            hint={`This month: ${formatMoney(reports.month.revenue, sales.currency)}`}
            icon={ChartPie}
            tone="success"
            to={ORDERS_PATH}
          />
        </Grid.Item>
      </Grid.Root>

      {/* Period reports */}
      <Panel
        title="Sales reports"
        subtitle={report?.rangeLabel ?? "Pick a period"}
        icon={Calendar}
        tone="secondary"
      >
        <Flex gap={2} wrap="wrap" paddingBottom={1}>
          {REPORT_KEYS.map((key) => (
            <Button
              key={key}
              size="S"
              variant={reportKey === key ? "default" : "tertiary"}
              onClick={() => setReportKey(key)}
            >
              {reports[key].label}
            </Button>
          ))}
        </Flex>

        <Grid.Root gap={4}>
          <Grid.Item col={3} s={6} xs={12}>
            <StatChip
              label="Orders"
              value={String(report.orders)}
              hint={report.cancelled ? `${report.cancelled} cancelled` : "active orders"}
              icon={ShoppingCart}
              tone="secondary"
            />
          </Grid.Item>
          <Grid.Item col={3} s={6} xs={12}>
            <StatChip
              label="Units sold"
              value={report.unitsSold.toLocaleString()}
              hint="from non-cancelled orders"
              icon={Stack}
              tone="primary"
            />
          </Grid.Item>
          <Grid.Item col={3} s={6} xs={12}>
            <StatChip
              label="Revenue"
              value={formatMoney(report.revenue, sales.currency)}
              hint={report.label}
              icon={ChartPie}
              tone="success"
            />
          </Grid.Item>
          <Grid.Item col={3} s={6} xs={12}>
            <StatChip
              label="Catalog changes"
              value={String(
                report.productsCreated +
                  report.variantsCreated +
                  report.stockUpdated +
                  (report.priceUpdated ?? 0),
              )}
              hint={`${report.productsCreated} products · ${report.variantsCreated} sizes · ${report.stockUpdated} stock · ${report.priceUpdated ?? 0} prices`}
              icon={Pencil}
              tone="alternative"
            />
          </Grid.Item>
        </Grid.Root>
      </Panel>

      {/* Today's daily summary */}
      <Grid.Root gap={5}>
        <Grid.Item col={5} xs={12}>
          <Panel
            title="Today's summary"
            subtitle={today.label}
            icon={Calendar}
            tone="primary"
          >
            <Flex direction="column" alignItems="stretch" gap={3}>
              <Grid.Root gap={3}>
                <Grid.Item col={6} xs={6}>
                  <Box
                    hasRadius
                    background="neutral100"
                    paddingTop={3}
                    paddingBottom={3}
                    paddingLeft={3}
                    paddingRight={3}
                  >
                    <Typography variant="pi" textColor="neutral600">
                      Orders today
                    </Typography>
                    <Typography
                      variant="delta"
                      fontWeight="bold"
                      textColor="neutral800"
                      style={{ display: "block", marginTop: 4 }}
                    >
                      {today.orders}
                    </Typography>
                  </Box>
                </Grid.Item>
                <Grid.Item col={6} xs={6}>
                  <Box
                    hasRadius
                    background="neutral100"
                    paddingTop={3}
                    paddingBottom={3}
                    paddingLeft={3}
                    paddingRight={3}
                  >
                    <Typography variant="pi" textColor="neutral600">
                      Units sold
                    </Typography>
                    <Typography
                      variant="delta"
                      fontWeight="bold"
                      textColor="neutral800"
                      style={{ display: "block", marginTop: 4 }}
                    >
                      {today.unitsSold.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid.Item>
                <Grid.Item col={6} xs={6}>
                  <Box
                    hasRadius
                    background="neutral100"
                    paddingTop={3}
                    paddingBottom={3}
                    paddingLeft={3}
                    paddingRight={3}
                  >
                    <Typography variant="pi" textColor="neutral600">
                      Revenue
                    </Typography>
                    <Typography
                      variant="delta"
                      fontWeight="bold"
                      textColor="neutral800"
                      style={{ display: "block", marginTop: 4 }}
                    >
                      {formatMoney(today.revenue, sales.currency)}
                    </Typography>
                  </Box>
                </Grid.Item>
                <Grid.Item col={6} xs={6}>
                  <Box
                    hasRadius
                    background="neutral100"
                    paddingTop={3}
                    paddingBottom={3}
                    paddingLeft={3}
                    paddingRight={3}
                  >
                    <Typography variant="pi" textColor="neutral600">
                      Changes made
                    </Typography>
                    <Typography
                      variant="delta"
                      fontWeight="bold"
                      textColor="neutral800"
                      style={{ display: "block", marginTop: 4 }}
                    >
                      {today.productsCreated +
                        today.variantsCreated +
                        today.stockUpdated +
                        (today.priceUpdated ?? 0)}
                    </Typography>
                  </Box>
                </Grid.Item>
              </Grid.Root>

              <Typography variant="pi" textColor="neutral500">
                {today.productsCreated} products added · {today.variantsCreated}{" "}
                size/color rows added · {today.stockUpdated} stock edits ·{" "}
                {today.priceUpdated ?? 0} price changes
                {today.cancelled > 0 ? ` · ${today.cancelled} cancelled` : ""}
              </Typography>
            </Flex>
          </Panel>
        </Grid.Item>

        <Grid.Item col={7} xs={12}>
          <Panel
            title="What happened today"
            subtitle="Orders, stock edits, price changes, and catalog updates for this day"
            icon={BulletList}
            tone="alternative"
          >
            {!today.activity || today.activity.length === 0 ? (
              <EmptyRow message="Nothing recorded for today yet. New orders, stock edits, and price changes will show up here." />
            ) : (
              <Flex direction="column" alignItems="stretch" gap={1}>
                {today.activity.map((item, index) => {
                  const Icon = activityIcon(item.type);
                  return (
                    <ListRow
                      key={`${item.type}-${item.documentId ?? index}-${item.at}`}
                      justifyContent="space-between"
                      alignItems="center"
                      gap={3}
                    >
                      <Flex gap={3} alignItems="center" style={{ minWidth: 0 }}>
                        <IconTile
                          icon={Icon}
                          tone={activityTone(item.type)}
                          size={32}
                        />
                        <Box style={{ minWidth: 0 }}>
                          <Flex gap={2} alignItems="center" wrap="wrap">
                            <Typography
                              variant="omega"
                              fontWeight="semiBold"
                              textColor="neutral800"
                            >
                              {item.title}
                            </Typography>
                            <Pill tone={activityTone(item.type)}>
                              {activityLabel(item.type)}
                            </Pill>
                          </Flex>
                          <Typography
                            variant="pi"
                            textColor="neutral500"
                            style={{ display: "block" }}
                          >
                            {[item.detail, formatWhen(item.at)]
                              .filter(Boolean)
                              .join(" · ")}
                          </Typography>
                        </Box>
                      </Flex>
                      {typeof item.amount === "number" ? (
                        <Typography
                          variant="omega"
                          fontWeight="bold"
                          textColor="neutral800"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {formatMoney(item.amount, sales.currency)}
                        </Typography>
                      ) : null}
                    </ListRow>
                  );
                })}
              </Flex>
            )}
          </Panel>
        </Grid.Item>
      </Grid.Root>

      <Grid.Root gap={4}>
        <Grid.Item col={3} s={6} xs={12}>
          <StatChip
            label="Low stock"
            value={String(inventory.lowStock)}
            hint={`≤ ${inventory.lowStockThreshold} left`}
            icon={WarningCircle}
            tone="warning"
            to={VARIANTS_PATH}
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatChip
            label="Out of stock"
            value={String(inventory.outOfStock)}
            hint={`of ${inventory.skuCount}`}
            icon={Archive}
            tone="danger"
            to={VARIANTS_PATH}
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatChip
            label="Sold (7 days)"
            value={sales.last7Days.unitsSold.toLocaleString()}
            hint={`${sales.last7Days.orders} orders`}
            icon={Clock}
            tone="secondary"
            to={ORDERS_PATH}
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatChip
            label="Sold (30 days)"
            value={sales.last30Days.unitsSold.toLocaleString()}
            hint={`${sales.last30Days.orders} orders`}
            icon={Clock}
            tone="alternative"
            to={ORDERS_PATH}
          />
        </Grid.Item>
      </Grid.Root>

      <Grid.Root gap={5}>
        <Grid.Item col={6} xs={12}>
          <Panel
            title="Needs attention"
            subtitle="Low or empty size & color rows"
            icon={WarningCircle}
            tone="warning"
            action={<PanelLink to={VARIANTS_PATH}>Open stock</PanelLink>}
          >
            {inventory.lowStockItems.length === 0 ? (
              <EmptyRow message="All size & color rows are above the low-stock level." />
            ) : (
              <Flex direction="column" alignItems="stretch" gap={1}>
                {inventory.lowStockItems.map((item) => (
                  <ListRow
                    key={item.documentId}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={3}
                  >
                    <Box style={{ minWidth: 0 }}>
                      <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                        {item.product_name || item.item_code || "Untitled"}
                      </Typography>
                      <Typography
                        variant="pi"
                        textColor="neutral500"
                        style={{ display: "block" }}
                      >
                        {[item.size, item.color, item.item_code]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                    </Box>
                    <Pill tone={item.how_many_left === 0 ? "danger" : "warning"}>
                      {item.how_many_left === 0
                        ? "Out of stock"
                        : `${item.how_many_left} left`}
                    </Pill>
                  </ListRow>
                ))}
              </Flex>
            )}
          </Panel>
        </Grid.Item>

        <Grid.Item col={6} xs={12}>
          <Panel
            title="Top sellers"
            subtitle="Units sold from non-cancelled orders"
            icon={Crown}
            tone="success"
            action={<PanelLink to={ORDERS_PATH}>Open orders</PanelLink>}
          >
            {sales.topSold.length === 0 ? (
              <EmptyRow message="No sold items yet." />
            ) : (
              <Flex direction="column" alignItems="stretch" gap={1}>
                {sales.topSold.map((item, index) => (
                  <ListRow
                    key={`${item.item_code}-${item.size}-${item.color}-${index}`}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={3}
                  >
                    <Flex gap={3} alignItems="center" style={{ minWidth: 0 }}>
                      <Flex
                        justifyContent="center"
                        alignItems="center"
                        shrink={0}
                        background={index === 0 ? "primary600" : "neutral150"}
                        style={{ width: 26, height: 26, borderRadius: 999 }}
                      >
                        <Typography
                          variant="pi"
                          fontWeight="bold"
                          textColor={index === 0 ? "neutral0" : "neutral600"}
                        >
                          {index + 1}
                        </Typography>
                      </Flex>
                      <Box style={{ minWidth: 0 }}>
                        <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                          {item.product_name || item.item_code || "Item"}
                        </Typography>
                        <Typography
                          variant="pi"
                          textColor="neutral500"
                          style={{ display: "block" }}
                        >
                          {[item.size, item.color, item.item_code]
                            .filter(Boolean)
                            .join(" · ")}
                        </Typography>
                      </Box>
                    </Flex>
                    <Typography variant="omega" fontWeight="bold" textColor="neutral800">
                      {item.units.toLocaleString()}
                      <Typography variant="pi" textColor="neutral500">
                        {" "}
                        sold
                      </Typography>
                    </Typography>
                  </ListRow>
                ))}
              </Flex>
            )}
          </Panel>
        </Grid.Item>

        <Grid.Item col={6} xs={12}>
          <Panel
            title="Recent orders"
            subtitle="Newest customer orders"
            icon={ShoppingCart}
            tone="secondary"
            action={<PanelLink to={ORDERS_PATH}>View all</PanelLink>}
          >
            {recent.orders.length === 0 ? (
              <EmptyRow message="No orders yet." />
            ) : (
              <Flex direction="column" alignItems="stretch" gap={1}>
                {recent.orders.map((order) => (
                  <ListRow
                    key={order.documentId}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={3}
                  >
                    <Box style={{ minWidth: 0 }}>
                      <Flex gap={2} alignItems="center">
                        <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                          {order.order_reference || "Order"}
                        </Typography>
                        <Pill tone={statusTone(order.order_status)}>
                          {statusLabel(order.order_status)}
                        </Pill>
                      </Flex>
                      <Typography
                        variant="pi"
                        textColor="neutral500"
                        style={{ display: "block" }}
                      >
                        {order.customer_name} · {formatWhen(order.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="omega" fontWeight="bold" textColor="neutral800">
                      {formatMoney(order.total, sales.currency)}
                    </Typography>
                  </ListRow>
                ))}
              </Flex>
            )}
          </Panel>
        </Grid.Item>

        <Grid.Item col={6} xs={12}>
          <Panel
            title="Recent stock updates"
            subtitle="Latest size & color changes"
            icon={Clock}
            tone="alternative"
            action={<PanelLink to={VARIANTS_PATH}>Edit stock</PanelLink>}
          >
            {recent.stockUpdates.length === 0 ? (
              <EmptyRow message="No size & color rows yet." />
            ) : (
              <Flex direction="column" alignItems="stretch" gap={1}>
                {recent.stockUpdates.map((item) => (
                  <ListRow
                    key={item.documentId}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={3}
                  >
                    <Box style={{ minWidth: 0 }}>
                      <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                        {item.product_name || item.item_code || "Variant"}
                      </Typography>
                      <Typography
                        variant="pi"
                        textColor="neutral500"
                        style={{ display: "block" }}
                      >
                        {[item.size, item.color].filter(Boolean).join(" · ")} ·{" "}
                        {formatWhen(item.updatedAt)}
                      </Typography>
                    </Box>
                    <Pill
                      tone={
                        item.how_many_left === 0
                          ? "danger"
                          : item.how_many_left <= inventory.lowStockThreshold
                            ? "warning"
                            : "success"
                      }
                    >
                      {item.how_many_left} left
                    </Pill>
                  </ListRow>
                ))}
              </Flex>
            )}
          </Panel>
        </Grid.Item>
      </Grid.Root>

      {recent.newProducts.length > 0 ? (
        <Panel
          title="Marked as new"
          subtitle="Products currently flagged as new arrivals"
          icon={Sparkle}
          tone="primary"
          action={<PanelLink to={PRODUCTS_PATH}>Open products</PanelLink>}
        >
          <Flex gap={2} wrap="wrap">
            {recent.newProducts.map((product) => (
              <Flex
                key={product.documentId}
                gap={1}
                alignItems="center"
                hasRadius
                background="primary100"
                paddingTop={1}
                paddingBottom={1}
                paddingLeft={2}
                paddingRight={3}
                style={{ borderRadius: 999 }}
              >
                <Sparkle fill="primary600" width="12px" height="12px" />
                <Typography variant="pi" textColor="primary700" fontWeight="semiBold">
                  {product.name}
                </Typography>
              </Flex>
            ))}
          </Flex>
        </Panel>
      ) : null}
    </Flex>
  );
}

export function Homepage() {
  const { formatMessage } = useIntl();
  const user = useAuth("Homepage", (state) => state.user);
  const displayName = user?.firstname ?? user?.username ?? user?.email ?? "there";

  const { data: documentCounts, isLoading: countsLoading } =
    useGetCountDocumentsQuery();

  const [homepage, setHomepage] = useState<HomepagePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          "/api/homepage?populate[hero_slides][populate]=image&populate[features]=true&populate[promo_banners]=true",
        );
        if (!cancelled && res.ok) {
          const json = await res.json();
          setHomepage(json.data ?? null);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstSlide = homepage?.hero_slides?.[0];
  const previewImage = firstSlide ? slideImageUrl(firstSlide.image) : null;

  return (
    <Layouts.Root>
      <Main>
        <Page.Title>
          {formatMessage({
            id: "HomePage.head.title",
            defaultMessage: "Homepage",
          })}
        </Page.Title>

        <Layouts.Header
          title={formatMessage(
            {
              id: "HomePage.header.title",
              defaultMessage: "Hello {name}",
            },
            { name: displayName },
          )}
          subtitle={formatMessage({
            id: "tigerwear.home.subtitle",
            defaultMessage:
              "Manage your Tiger Wear catalog, orders, and storefront",
          })}
          primaryAction={
            <Flex gap={2} wrap="wrap">
              <Button
                tag="a"
                href={STOREFRONT_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="tertiary"
                size="S"
                startIcon={<ExternalLink />}
              >
                {formatMessage({
                  id: "tigerwear.home.viewShop",
                  defaultMessage: "View shop",
                })}
              </Button>
              <Button
                tag={RouterLink}
                to={HOMEPAGE_EDIT_PATH}
                size="S"
                startIcon={<Pencil />}
              >
                {formatMessage({
                  id: "tigerwear.home.editHomepage",
                  defaultMessage: "Edit homepage",
                })}
              </Button>
            </Flex>
          }
        />

        <Layouts.Content>
          <Flex direction="column" alignItems="stretch" gap={6} paddingBottom={10}>
            <InventoryDashboardSection />

            {/* Storefront preview — same panel style as Settings pages */}
            <Flex
              direction="column"
              alignItems="stretch"
              gap={5}
              hasRadius
              background="neutral0"
              shadow="tableShadow"
              paddingTop={6}
              paddingBottom={6}
              paddingLeft={7}
              paddingRight={7}
            >
              <Flex justifyContent="space-between" alignItems="flex-start" gap={4}>
                <Box>
                  <Typography variant="delta" textColor="neutral800">
                    {formatMessage({
                      id: "tigerwear.home.previewTitle",
                      defaultMessage: "Storefront homepage",
                    })}
                  </Typography>
                  <Typography variant="pi" textColor="neutral600" style={{ marginTop: 4 }}>
                    {formatMessage({
                      id: "tigerwear.home.previewSubtitle",
                      defaultMessage: "What customers see on your shop website",
                    })}
                  </Typography>
                </Box>
                {!countsLoading && documentCounts && (
                  <Typography variant="pi" textColor="neutral500">
                    {formatMessage(
                      {
                        id: "tigerwear.home.documentCounts",
                        defaultMessage:
                          "{published} published · {draft} drafts",
                      },
                      {
                        published: documentCounts.published,
                        draft: documentCounts.draft,
                      },
                    )}
                  </Typography>
                )}
              </Flex>

              {previewLoading ? (
                <Flex justifyContent="center" padding={8}>
                  <Loader small>
                    {formatMessage({
                      id: "tigerwear.home.loading",
                      defaultMessage: "Loading preview…",
                    })}
                  </Loader>
                </Flex>
              ) : firstSlide ? (
                <Flex gap={6} alignItems="flex-start" wrap="wrap">
                  {previewImage && (
                    <Box
                      hasRadius
                      overflow="hidden"
                      background="neutral150"
                      style={{ width: 200, height: 140, flexShrink: 0 }}
                    >
                      <img
                        src={previewImage}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Box>
                  )}
                  <Box style={{ flex: 1, minWidth: 220 }}>
                    {firstSlide.tag && (
                      <Typography
                        variant="pi"
                        textColor="primary600"
                        fontWeight="semiBold"
                      >
                        {firstSlide.tag}
                      </Typography>
                    )}
                    <Typography
                      variant="beta"
                      textColor="neutral800"
                      style={{ marginTop: firstSlide.tag ? 4 : 0 }}
                    >
                      {firstSlide.title}
                    </Typography>
                    {firstSlide.subtitle && (
                      <Typography
                        variant="pi"
                        textColor="neutral600"
                        style={{ marginTop: 8, lineHeight: 1.5, maxWidth: 480 }}
                      >
                        {firstSlide.subtitle}
                      </Typography>
                    )}
                    {homepage && (
                      <Typography
                        variant="pi"
                        textColor="neutral500"
                        style={{ marginTop: 16 }}
                      >
                        {homepage.categories_title ?? "Categories"}
                        {" · "}
                        {homepage.new_arrivals_title ?? "New Arrivals"}
                        {" · "}
                        {homepage.featured_title ?? "Featured"}
                      </Typography>
                    )}
                  </Box>
                </Flex>
              ) : (
                <Typography variant="pi" textColor="neutral600">
                  {formatMessage({
                    id: "tigerwear.home.empty",
                    defaultMessage:
                      "No homepage content yet. Use Edit homepage to add your first hero slide.",
                  })}
                </Typography>
              )}

              <Box>
                <Link href={STOREFRONT_URL} isExternal endIcon={<ExternalLink />}>
                  {formatMessage({
                    id: "tigerwear.home.openShop",
                    defaultMessage: "Open live shop",
                  })}
                </Link>
              </Box>
            </Flex>

            {/* Shortcuts — ContentBox grid like other admin areas */}
            <Box>
              <Box paddingBottom={4}>
                <Typography variant="delta" textColor="neutral800">
                  {formatMessage({
                    id: "tigerwear.home.shortcuts",
                    defaultMessage: "Shortcuts",
                  })}
                </Typography>
              </Box>
              <Grid.Root gap={5}>
                {shortcuts.map((item) => (
                  <Grid.Item key={item.to} col={6} xs={12}>
                    <ShortcutCard {...item} />
                  </Grid.Item>
                ))}
              </Grid.Root>
            </Box>
          </Flex>
        </Layouts.Content>
      </Main>
    </Layouts.Root>
  );
}
