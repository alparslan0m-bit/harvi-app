import React from "react";
import { Image, View } from "react-native";

interface AvatarProps { size?: number }

/* ─────────────────────────────────────────────────────────────────────
   DiceBear avataaars — human-style cartoon doctor avatars.
   Docs: https://www.dicebear.com/styles/avataaars
   All parameters are stable and seed-locked per avatar.
───────────────────────────────────────────────────────────────────── */

const BASE = "https://api.dicebear.com/9.x/avataaars/png";

function url(params: Record<string, string>) {
  const q = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `${BASE}?${q}`;
}

/* Six fixed avatar URLs — deterministic via seed + explicit options */
const URLS: Record<string, { uri: string; bg: string }> = {
  male_light: {
    bg: "#EFF6FF",
    uri: url({
      seed: "harvi-male-light",
      size: "200",
      backgroundColor: "eff6ff",
      skinColor: "ffdbb4",
      top: "shortHairShortFlat",
      hairColor: "2c1b18",
      accessories: "blank",
      facialHair: "blank",
      clothing: "blazerShirt",
      clothingColor: "ffffff",
      eyes: "default",
      eyebrows: "defaultNatural",
      mouth: "smile",
    }),
  },
  male_medium: {
    bg: "#F0FDF4",
    uri: url({
      seed: "harvi-male-medium",
      size: "200",
      backgroundColor: "f0fdf4",
      skinColor: "d08b5b",
      top: "shortHairShortWaved",
      hairColor: "724133",
      accessories: "blank",
      facialHair: "blank",
      clothing: "blazerShirt",
      clothingColor: "ffffff",
      eyes: "default",
      eyebrows: "defaultNatural",
      mouth: "smile",
    }),
  },
  male_dark: {
    bg: "#FFF7ED",
    uri: url({
      seed: "harvi-male-dark",
      size: "200",
      backgroundColor: "fff7ed",
      skinColor: "614335",
      top: "shortHairDreads01",
      hairColor: "2c1b18",
      accessories: "blank",
      facialHair: "blank",
      clothing: "blazerShirt",
      clothingColor: "ffffff",
      eyes: "default",
      eyebrows: "defaultNatural",
      mouth: "smile",
    }),
  },
  female_light: {
    bg: "#FDF4FF",
    uri: url({
      seed: "harvi-female-light",
      size: "200",
      backgroundColor: "fdf4ff",
      skinColor: "ffdbb4",
      top: "longHairBun",
      hairColor: "2c1b18",
      accessories: "blank",
      facialHair: "blank",
      clothing: "blazerShirt",
      clothingColor: "ffffff",
      eyes: "default",
      eyebrows: "defaultNatural",
      mouth: "smile",
    }),
  },
  female_medium: {
    bg: "#FFF1F2",
    uri: url({
      seed: "harvi-female-medium",
      size: "200",
      backgroundColor: "fff1f2",
      skinColor: "d08b5b",
      top: "longHairCurvy",
      hairColor: "b58143",
      accessories: "blank",
      facialHair: "blank",
      clothing: "blazerShirt",
      clothingColor: "ffffff",
      eyes: "default",
      eyebrows: "defaultNatural",
      mouth: "smile",
    }),
  },
  female_dark: {
    bg: "#F0FDFA",
    uri: url({
      seed: "harvi-female-dark",
      size: "200",
      backgroundColor: "f0fdfa",
      skinColor: "614335",
      top: "longHairFro",
      hairColor: "2c1b18",
      accessories: "blank",
      facialHair: "blank",
      clothing: "blazerShirt",
      clothingColor: "ffffff",
      eyes: "default",
      eyebrows: "defaultNatural",
      mouth: "smile",
    }),
  },
};

/* ── Shared renderer ──────────────────────────────────────────────── */
function DoctorAvatar({ id, size = 80 }: { id: string; size: number }) {
  const cfg = URLS[id];
  if (!cfg) return null;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, overflow: "hidden", backgroundColor: cfg.bg }}>
      <Image
        source={{ uri: cfg.uri }}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}

/* ── Named exports ────────────────────────────────────────────────── */
export function MaleDoctorLight({ size = 80 }: AvatarProps)    { return <DoctorAvatar id="male_light"    size={size} />; }
export function MaleDoctorMedium({ size = 80 }: AvatarProps)   { return <DoctorAvatar id="male_medium"   size={size} />; }
export function MaleDoctorDark({ size = 80 }: AvatarProps)     { return <DoctorAvatar id="male_dark"     size={size} />; }
export function FemaleDoctorLight({ size = 80 }: AvatarProps)  { return <DoctorAvatar id="female_light"  size={size} />; }
export function FemaleDoctorMedium({ size = 80 }: AvatarProps) { return <DoctorAvatar id="female_medium" size={size} />; }
export function FemaleDoctorDark({ size = 80 }: AvatarProps)   { return <DoctorAvatar id="female_dark"   size={size} />; }

/* ── Registry ─────────────────────────────────────────────────────── */
export type AvatarId =
  | "male_light" | "male_medium" | "male_dark"
  | "female_light" | "female_medium" | "female_dark";

export const AVATARS: { id: AvatarId; label: string; component: React.FC<AvatarProps> }[] = [
  { id: "male_light",    label: "Doctor", component: MaleDoctorLight    },
  { id: "male_medium",   label: "Doctor", component: MaleDoctorMedium   },
  { id: "male_dark",     label: "Doctor", component: MaleDoctorDark     },
  { id: "female_light",  label: "Doctor", component: FemaleDoctorLight  },
  { id: "female_medium", label: "Doctor", component: FemaleDoctorMedium },
  { id: "female_dark",   label: "Doctor", component: FemaleDoctorDark   },
];

export function AvatarById({ id, size = 80 }: { id: AvatarId | null; size?: number }) {
  const found = AVATARS.find((a) => a.id === id);
  if (!found) return null;
  const C = found.component;
  return <C size={size} />;
}
