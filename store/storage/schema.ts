import { z } from "zod";

const point = z.object({ x: z.number(), y: z.number() });

export const openingSchema = z.object({
  id: z.string(),
  type: z.enum(["door", "window"]),
  wallIndex: z.number().int().min(0),
  offset: z.number(),
  width: z.number().positive(),
});

export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  polygon: z.array(point).min(3),
  openings: z.array(openingSchema).default([]),
  createdAt: z.number().default(() => Date.now()),
});

export const furnitureSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  type: z.enum(["drawer", "bookshelf", "wardrobe", "storage_box", "fridge"]),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  depth: z.number().positive(),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).default(0),
  rows: z.number().int().min(1).default(1),
  cols: z.number().int().min(1).default(1),
});

export const compartmentSchema = z.object({
  id: z.string(),
  furnitureId: z.string(),
  name: z.string(),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  items: z.array(z.string()).default([]),
  color: z.string().default("#f4f4f5"),
  icon: z.string().optional(),
  updatedAt: z.number().default(() => Date.now()),
});

export const labelStyleSchema = z.object({
  preset: z.enum(["minimal", "kids", "fridge"]).default("minimal"),
  font: z.literal("noto-sans-kr").default("noto-sans-kr"),
  showLocation: z.boolean().default(true),
  showQR: z.boolean().default(false),
});

export const labelSchema = z.object({
  id: z.string(),
  compartmentId: z.string().nullable(),
  customText: z.string().optional(),
  style: labelStyleSchema,
  qty: z.number().int().min(1).default(1),
  selected: z.boolean().default(true),
  printedAt: z.number().optional(),
  printedHash: z.string().optional(),
  createdAt: z.number().default(() => Date.now()),
});

export const sheetSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  pageSize: z.literal("A4").default("A4"),
  cols: z.number().int().min(1),
  rows: z.number().int().min(1),
  labelWidth: z.number().positive(),
  labelHeight: z.number().positive(),
  marginTop: z.number().min(0),
  marginLeft: z.number().min(0),
  gapX: z.number().min(0),
  gapY: z.number().min(0),
  builtin: z.boolean().optional(),
});

export const documentSchema = z.object({
  schemaVersion: z.number().int(),
  exportedAt: z.number().default(() => Date.now()),
  home: z.object({ id: z.string(), name: z.string() }),
  rooms: z.array(roomSchema),
  furniture: z.array(furnitureSchema),
  compartments: z.array(compartmentSchema),
  labels: z.array(labelSchema),
  customSheetSpecs: z.array(sheetSpecSchema).default([]),
  settings: z
    .object({
      calibration: z.object({ dx: z.number(), dy: z.number() }).default({ dx: 0, dy: 0 }),
      defaultSheetSpecId: z.string().default("grid-3x7"),
      lastStartIndex: z.number().int().min(0).default(0),
      qrBaseUrl: z.string().optional(),
    })
    .default({ calibration: { dx: 0, dy: 0 }, defaultSheetSpecId: "grid-3x7", lastStartIndex: 0 }),
});

export type DocumentInput = z.input<typeof documentSchema>;
