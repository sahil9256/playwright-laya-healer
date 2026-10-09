export const PRODUCT_CATEGORIES = [
  'Hand Tools',
  'Power Tools',
  'Other',
  'Special Tools',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_BRANDS = [
  'ForgeFlex Tools',
  'MightyCraft Hardware',
  'ProScrews',
  'WrenchWorks',
] as const;

export type ProductBrand = (typeof PRODUCT_BRANDS)[number];

export const categories = PRODUCT_CATEGORIES;
export const brands = PRODUCT_BRANDS;
