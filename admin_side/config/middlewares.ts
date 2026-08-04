import type { Core } from '@strapi/strapi';

export default ({ env }: Core.Config.Shared.ConfigParams) => {
  const useCloudinary = Boolean(env('CLOUDINARY_NAME'));
  const securityMiddleware = useCloudinary
    ? {
        name: 'strapi::security',
        config: {
          contentSecurityPolicy: {
            useDefaults: true,
            directives: {
              'connect-src': ["'self'", 'https:'],
              'img-src': [
                "'self'",
                'data:',
                'blob:',
                'market-assets.strapi.io',
                'res.cloudinary.com',
              ],
              'media-src': [
                "'self'",
                'data:',
                'blob:',
                'market-assets.strapi.io',
                'res.cloudinary.com',
              ],
              upgradeInsecureRequests: null,
            },
          },
        },
      }
    : 'strapi::security';

  return [
    'strapi::logger',
    'strapi::errors',
    securityMiddleware,
    {
      name: 'strapi::cors',
      config: {
        origin: [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          process.env.FRONTEND_URL,
        ].filter(Boolean),
        headers: ['Content-Type', 'Authorization'],
      },
    },
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};
