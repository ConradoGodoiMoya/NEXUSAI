import {
  Bath,
  Boxes,
  BrickWall,
  DoorOpen,
  Droplets,
  Grid3x3,
  Hammer,
  House,
  Lamp,
  Package,
  PaintRoller,
  Ruler,
  Shovel,
  Sparkles,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  boxes: Boxes,
  brick: BrickWall,
  package: Package,
  hammer: Hammer,
  wrench: Wrench,
  droplets: Droplets,
  zap: Zap,
  paint: PaintRoller,
  grid: Grid3x3,
  sparkles: Sparkles,
  lamp: Lamp,
  door: DoorOpen,
  bath: Bath,
  shovel: Shovel,
  ruler: Ruler,
  home: House,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Boxes;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.6} />;
}
