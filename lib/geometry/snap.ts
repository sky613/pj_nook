import type { Point } from "@/lib/types";
import { snap } from "@/lib/units";

export const GRID_CM = 10;

export const snapValue = (v: number, step = GRID_CM) => snap(v, step);
export const snapPoint = (p: Point, step = GRID_CM): Point => ({ x: snapValue(p.x, step), y: snapValue(p.y, step) });
