import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'data-transfer': {
    enabled: true,
    resolve: './src/plugins/data-transfer',
  },
});

export default config;
