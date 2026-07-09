type SeedCategory = {
  name: string;
  link_name: string;
  photo: string;
  list_position: number;
};

type SeedVariant = {
  item_code: string;
  size: string;
  color: string;
  color_dot?: string;
  photo?: string;
  color_photos?: string[];
  price_for_one: number;
  price_for_bulk?: number;
  min_quantity_for_bulk?: number;
  how_many_left: number;
};

type SeedProduct = {
  name: string;
  link_name: string;
  description: string;
  photo: string;
  video?: string;
  category_link_name: string;
  highlight_on_homepage: boolean;
  mark_as_new: boolean;
  variants: SeedVariant[];
};

export const seedCategories: SeedCategory[] = [
  { name: "T-Shirts", link_name: "t-shirts", photo: "/products/21-tygastyle-tee-set.png", list_position: 1 },
  { name: "Hoodies & Knitwear", link_name: "hoodies", photo: "/products/01-grey-zip-hoodie.png", list_position: 2 },
  { name: "Pants", link_name: "pants", photo: "/products/16-navy-chino-pants.png", list_position: 3 },
  { name: "Formal & Suits", link_name: "formal", photo: "/products/13-suit-collection.png", list_position: 4 },
  { name: "Jackets", link_name: "jackets", photo: "/products/18-bomber-jacket.png", list_position: 5 },
];

export const seedProducts: SeedProduct[] = [
  {
    name: "Heather Grey Zip Hoodie",
    link_name: "heather-grey-zip-hoodie",
    description: "Oversized heather grey zip hoodie with kangaroo pockets.",
    photo: "/products/01-grey-zip-hoodie.png",
    category_link_name: "hoodies",
    highlight_on_homepage: true,
    mark_as_new: true,
    variants: [
      {
        item_code: "Grey-Hoodie-M",
        size: "M",
        color: "Heather Grey",
        color_dot: "#A8A29E",
        color_photos: ["/products/12-black-oversized-hoodie.png"],
        price_for_one: 64.99,
        price_for_bulk: 44.99,
        min_quantity_for_bulk: 10,
        how_many_left: 28,
      },
      {
        item_code: "Grey-Hoodie-L",
        size: "L",
        color: "Heather Grey",
        color_dot: "#A8A29E",
        price_for_one: 64.99,
        price_for_bulk: 44.99,
        min_quantity_for_bulk: 10,
        how_many_left: 22,
      },
    ],
  },
  {
    name: "Quarter-Zip Bulk Color Pack",
    link_name: "quarter-zip-bulk-color-pack",
    description: "Wholesale pack of quarter-zip pullovers in mixed colors.",
    photo: "/products/03-quarter-zip-bulk-pack.png",
    category_link_name: "hoodies",
    highlight_on_homepage: true,
    mark_as_new: false,
    variants: [
      { item_code: "Zip-Pack-M", size: "M", color: "Mixed", color_dot: "#737373", price_for_one: 699.99, price_for_bulk: 28.99, min_quantity_for_bulk: 24, how_many_left: 200 },
    ],
  },
  {
    name: "Navy Chino Pants",
    link_name: "navy-chino-pants",
    description: "Classic navy chino pants with a tailored fit.",
    photo: "/products/16-navy-chino-pants.png",
    category_link_name: "pants",
    highlight_on_homepage: true,
    mark_as_new: false,
    variants: [
      { item_code: "Navy-Pants-32", size: "32", color: "Navy", color_dot: "#1E3A5F", price_for_one: 54.99, price_for_bulk: 36.99, min_quantity_for_bulk: 15, how_many_left: 30 },
      { item_code: "Navy-Pants-34", size: "34", color: "Navy", color_dot: "#1E3A5F", price_for_one: 54.99, price_for_bulk: 36.99, min_quantity_for_bulk: 15, how_many_left: 25 },
    ],
  },
  {
    name: "TygaStyle Tee Set",
    link_name: "tygastyle-tee-set",
    description: "Graphic tee set — per piece and bulk available.",
    photo: "/products/21-tygastyle-tee-set.png",
    category_link_name: "t-shirts",
    highlight_on_homepage: true,
    mark_as_new: true,
    variants: [
      {
        item_code: "Tee-Black-M",
        size: "M",
        color: "Black",
        color_dot: "#0A0A0A",
        photo: "/products/10-black-quarter-zip-folded.png",
        color_photos: ["/products/20-tee-neck-tag.png"],
        price_for_one: 24.99,
        price_for_bulk: 18.99,
        min_quantity_for_bulk: 12,
        how_many_left: 62,
      },
      {
        item_code: "Tee-Black-L",
        size: "L",
        color: "Black",
        color_dot: "#0A0A0A",
        photo: "/products/10-black-quarter-zip-folded.png",
        price_for_one: 24.99,
        price_for_bulk: 18.99,
        min_quantity_for_bulk: 12,
        how_many_left: 48,
      },
      {
        item_code: "Tee-Navy-M",
        size: "M",
        color: "Navy",
        color_dot: "#1E3A5F",
        photo: "/products/21-tygastyle-tee-set.png",
        color_photos: ["/products/20-tee-neck-tag.png"],
        price_for_one: 24.99,
        price_for_bulk: 18.99,
        min_quantity_for_bulk: 12,
        how_many_left: 40,
      },
      {
        item_code: "Tee-Navy-L",
        size: "L",
        color: "Navy",
        color_dot: "#1E3A5F",
        photo: "/products/21-tygastyle-tee-set.png",
        price_for_one: 24.99,
        price_for_bulk: 18.99,
        min_quantity_for_bulk: 12,
        how_many_left: 35,
      },
    ],
  },
  {
    name: "Suit Collection — Tan",
    link_name: "suit-collection-tan",
    description: "Two-piece tan suit.",
    photo: "/products/13-suit-collection.png",
    category_link_name: "formal",
    highlight_on_homepage: false,
    mark_as_new: false,
    variants: [
      { item_code: "Tan-Suit-40R", size: "40R", color: "Tan", color_dot: "#C4A574", price_for_one: 349.99, price_for_bulk: 249.99, min_quantity_for_bulk: 5, how_many_left: 8 },
    ],
  },
  {
    name: "Bomber Jacket",
    link_name: "bomber-jacket",
    description: "Classic bomber jacket in black — sold per piece only.",
    photo: "/products/18-bomber-jacket.png",
    category_link_name: "jackets",
    highlight_on_homepage: true,
    mark_as_new: true,
    variants: [
      { item_code: "Bomber-Black-M", size: "M", color: "Black", color_dot: "#0A0A0A", price_for_one: 89.99, how_many_left: 15 },
    ],
  },
];
