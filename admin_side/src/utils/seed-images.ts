import fs from 'fs';
import path from 'path';
import type { Core } from '@strapi/strapi';

const uploadCache = new Map<string, number>();

function resolveLocalImage(publicPath: string): string | null {
  const relative = publicPath.replace(/^\//, '');
  const candidates = [
    path.join(process.cwd(), '../frontend/public', relative),
    path.join(process.cwd(), 'public', relative),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

/** Upload a storefront image into Strapi Media Library (cached per path). */
export async function uploadCatalogImage(
  strapi: Core.Strapi,
  publicPath: string | null | undefined,
): Promise<number | null> {
  if (!publicPath) return null;

  const cached = uploadCache.get(publicPath);
  if (cached != null) return cached;

  const filePath = resolveLocalImage(publicPath);
  if (!filePath) {
    strapi.log.warn(`Seed image not found: ${publicPath}`);
    return null;
  }

  const stat = fs.statSync(filePath);
  const uploadService = strapi.plugin('upload').service('upload');
  const uploaded = await uploadService.upload({
    data: {
      fileInfo: {
        name: path.basename(filePath),
        alternativeText: path.basename(filePath, path.extname(filePath)),
      },
    },
    files: {
      filepath: filePath,
      originalFilename: path.basename(filePath),
      mimetype: 'image/png',
      size: stat.size,
    },
  });

  const fileId = uploaded[0]?.id;
  if (fileId == null) return null;

  uploadCache.set(publicPath, fileId);
  return fileId;
}
