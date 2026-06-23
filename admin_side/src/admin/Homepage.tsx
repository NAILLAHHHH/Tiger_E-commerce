import { useEffect, useState } from "react";
import {
  ContentBox,
  Layouts,
  Page,
  useAuth,
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
  ChevronRight,
  ExternalLink,
  GridFour,
  Layout,
  Pencil,
  Shirt,
  ShoppingCart,
} from "@strapi/icons";
import { useIntl } from "react-intl";
import { Link as RouterLink } from "react-router-dom";

const STOREFRONT_URL = "http://localhost:3000";
const HOMEPAGE_EDIT_PATH =
  "/content-manager/single-types/api::homepage.homepage";

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

const shortcuts = [
  {
    title: "Storefront homepage",
    subtitle: "Hero, features, promos, and section titles",
    to: HOMEPAGE_EDIT_PATH,
    icon: Layout,
  },
  {
    title: "Products",
    subtitle: "Catalog, pricing, stock, and homepage flags",
    to: "/content-manager/collection-types/api::product.product",
    icon: Shirt,
  },
  {
    title: "Categories",
    subtitle: "Shop sections and display order",
    to: "/content-manager/collection-types/api::category.category",
    icon: GridFour,
  },
  {
    title: "Orders",
    subtitle: "Customer orders and fulfilment",
    to: "/content-manager/collection-types/api::order.order",
    icon: ShoppingCart,
  },
] as const;

function slideImageUrl(image: HeroSlidePreview["image"]): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  return image.url ?? null;
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
