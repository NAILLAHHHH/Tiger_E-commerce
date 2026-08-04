import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const plugins: Core.Config.Plugin = {
    'data-transfer': {
      enabled: true,
      resolve: './src/plugins/data-transfer',
    },
  };

  // Production (Render): set CLOUDINARY_* env vars to store uploads on Cloudinary.
  if (env('CLOUDINARY_NAME')) {
    plugins.upload = {
      config: {
        provider: 'cloudinary',
        providerOptions: {
          cloud_name: env('CLOUDINARY_NAME'),
          api_key: env('CLOUDINARY_KEY'),
          api_secret: env('CLOUDINARY_SECRET'),
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    };
  }

  return plugins;
};

export default config;
