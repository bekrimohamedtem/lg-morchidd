import tvOled from "@/assets/tv-oled.jpg";
import tvQned from "@/assets/tv-qned.jpg";
import soundbar from "@/assets/soundbar.jpg";
import fridge from "@/assets/fridge.jpg";
import washer from "@/assets/washer.jpg";
import ac from "@/assets/ac.jpg";
import heroTv from "@/assets/hero-tv.jpg";
import heroKitchen from "@/assets/hero-kitchen.jpg";

export const heroTvUrl = heroTv;
export const heroKitchenUrl = heroKitchen;

const map: Record<string, string> = {
  "oled-evo-c5-65": tvOled,
  "qned-mini-led-75": tvQned,
  "soundbar-s95-9-1-5": soundbar,
  "soundbar-sn5": soundbar,
  "instaview-french-door-635l": fridge,
  "lave-linge-ai-dd-12kg": washer,
  "dualcool-inverter-18000": ac,
  "dualcool-inverter-12000": ac,
};

export function productImage(slug: string): string {
  return map[slug] ?? tvOled;
}
