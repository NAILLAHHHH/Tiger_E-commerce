import type { StrapiApp } from "@strapi/strapi/admin";

import AuthLogo from "./extensions/tigerwear-logo.png";
import MenuLogo from "./extensions/tigerwear-logo.png";
import Favicon from "./extensions/favicon.ico";
import { tigerWearDarkColors, tigerWearLightColors } from "./theme";
import { installSelectOnlyProductRelations } from "./select-only-relations";

export default {
  config: {
    auth: {
      logo: AuthLogo,
    },
    head: {
      favicon: Favicon,
    },
    menu: {
      logo: MenuLogo,
    },
    locales: ["en"],
    translations: {
      en: {
        "Auth.form.welcome.title": "Welcome to Tiger Wear",
        "Auth.form.welcome.subtitle": "Sign in to manage your store",
        "app.components.HomePage.welcome": "Tiger Wear admin",
        "app.components.HomePage.welcome.again": "Welcome back",
        "app.components.LeftMenu.navbrand.title": "Tiger Wear",
        "app.components.LeftMenu.navbrand.workplace": "Store admin",
        "Settings.application.title": "Tiger Wear",
        "Settings.application.description": "Store settings",
        "global.content-manager": "Content",
        "content-manager.containers.Home.pluginHeaderTitle": "Tiger Wear",
        "content-manager.containers.Home.pluginHeaderDescription":
          "Manage products, categories, orders, and your homepage.",
        "content-manager.relation.add": "Pick from the list",
        "content-manager.relation.create": "Create under Category / Size & color",
      },
    },
    theme: {
      light: { colors: tigerWearLightColors },
      dark: { colors: tigerWearDarkColors },
    },
    tutorials: false,
    notifications: {
      releases: false,
    },
  },
  bootstrap() {
    if (!localStorage.getItem("STRAPI_THEME")) {
      localStorage.setItem("STRAPI_THEME", "light");
    }
    installSelectOnlyProductRelations();
  },
  register(app: StrapiApp) {
    const indexRoute = app.router.routes.find(({ index }) => index);
    if (!indexRoute) return;

    indexRoute.lazy = async () => {
      const { Homepage } = await import("./Homepage");
      return { Component: Homepage };
    };
  },
};
