import React from "react";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

interface AvatarProps { size?: number }

/* ── Shared config type ───────────────────────────────────────────── */
interface Config {
  skin: string; skinShadow: string; skinDetail: string;
  hair: string; iris: string; bg: string; female: boolean;
}

/* ── Core renderer ────────────────────────────────────────────────── */
function DoctorSvg({ size = 80, cfg }: { size: number; cfg: Config }) {
  const { skin, skinShadow, skinDetail, hair, iris, bg, female } = cfg;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">

      {/* ── Background ── */}
      <Rect width="100" height="100" rx="22" fill={bg} />

      {/* ── White coat body ── */}
      <Path d="M16 100 L18 65 Q34 58 50 57 Q66 58 82 65 L84 100Z"
        fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
      {/* Coat lapels / inner shirt */}
      <Path d="M50 57 L42 72 L40 100 L50 100" fill="#DBEAFE" />
      <Path d="M50 57 L58 72 L60 100 L50 100" fill="#DBEAFE" />
      {/* Coat collar V */}
      <Path d="M44 63 L50 70 L56 63" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      {/* Breast pocket */}
      <Rect x="62" y="70" width="10" height="7" rx="1.5" fill="none" stroke="#CBD5E1" strokeWidth="1" />
      <Path d="M65 70 L65 67" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M68 70 L68 66" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" />

      {/* ── Stethoscope ── */}
      <Path d="M36 68 Q28 78 34 87" stroke="#94A3B8" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Circle cx="34" cy="87" r="4" fill="#64748B" />
      <Circle cx="34" cy="87" r="2" fill="#94A3B8" />
      <Path d="M36 68 Q50 76 64 68" stroke="#94A3B8" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M64 68 Q72 75 69 83" stroke="#94A3B8" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Circle cx="69" cy="83.5" r="2.5" fill="#94A3B8" />

      {/* ── Neck ── */}
      <Rect x="43" y="53" width="14" height="10" rx="7" fill={skin} />
      {/* Neck shadow */}
      <Rect x="43" y="57" width="14" height="6" rx="4" fill={skinShadow} opacity="0.5" />

      {/* ── Ears ── */}
      <Ellipse cx="27" cy="40" rx="4.5" ry="5.5" fill={skin} />
      <Ellipse cx="27" cy="40" rx="2.8" ry="3.8" fill={skinShadow} />
      <Ellipse cx="73" cy="40" rx="4.5" ry="5.5" fill={skin} />
      <Ellipse cx="73" cy="40" rx="2.8" ry="3.8" fill={skinShadow} />

      {/* ── Head ── */}
      <Ellipse cx="50" cy="37" rx="23" ry="27" fill={skin} />
      {/* Jaw / chin shading */}
      <Ellipse cx="50" cy="57" rx="14" ry="5" fill={skinShadow} opacity="0.35" />

      {/* ── HAIR ── */}
      {female ? (
        <>
          {/* Bun on top */}
          <Circle cx="50" cy="11" r="8.5" fill={hair} />
          <Circle cx="50" cy="11" r="5" fill={hair === "#2D1B0E" ? "#3D2B1E" : hair === "#6B3A2A" ? "#7D4A3A" : "#9D5534"} />
          {/* Hair top cap */}
          <Path d="M27 30 Q27 11 50 10 Q73 11 73 30 Q70 19 50 18 Q30 19 27 30Z" fill={hair} />
          {/* Side hair flowing down */}
          <Path d="M27 28 Q22 40 24 54" stroke={hair} strokeWidth="8" fill="none" strokeLinecap="round" />
          <Path d="M73 28 Q78 40 76 54" stroke={hair} strokeWidth="8" fill="none" strokeLinecap="round" />
          {/* Hair highlight */}
          <Path d="M36 16 Q50 12 63 16" stroke="rgba(255,255,255,0.18)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Short male hair cap */}
          <Path d="M27 32 Q27 12 50 11 Q73 12 73 32 Q71 20 50 19 Q29 20 27 32Z" fill={hair} />
          {/* Side taper */}
          <Path d="M27 30 Q24 38 26 48" stroke={hair} strokeWidth="5" fill="none" strokeLinecap="round" />
          <Path d="M73 30 Q76 38 74 48" stroke={hair} strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Hair highlight */}
          <Path d="M36 18 Q50 14 64 18" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── Eyes ── */}
      {/* Left eye */}
      <Ellipse cx="39" cy="38" rx="7" ry="7.5" fill="white" />
      <Circle cx="39" cy="38.5" r="4.8" fill={iris} />
      <Circle cx="39" cy="38.5" r="2.8" fill="#111" />
      <Circle cx="40.8" cy="36.8" r="1.5" fill="white" />
      <Circle cx="39.2" cy="40.2" r="0.7" fill="rgba(255,255,255,0.4)" />
      {/* Left eyelid top */}
      <Path d="M32 35 Q39 31.5 46 35" stroke={hair} strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Right eye */}
      <Ellipse cx="61" cy="38" rx="7" ry="7.5" fill="white" />
      <Circle cx="61" cy="38.5" r="4.8" fill={iris} />
      <Circle cx="61" cy="38.5" r="2.8" fill="#111" />
      <Circle cx="62.8" cy="36.8" r="1.5" fill="white" />
      <Circle cx="61.2" cy="40.2" r="0.7" fill="rgba(255,255,255,0.4)" />
      {/* Right eyelid top */}
      <Path d="M54 35 Q61 31.5 68 35" stroke={hair} strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Female lashes */}
      {female && (
        <>
          <Path d="M32.5 33.5 L31 31.5" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
          <Path d="M35.5 32 L34.5 29.8" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
          <Path d="M39 31.2 L39 29" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
          <Path d="M42.5 32 L43.5 29.8" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
          <Path d="M45.5 33.5 L47 31.5" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
          <Path d="M54.5 33.5 L53 31.5" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
          <Path d="M57.5 32 L56.5 29.8" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
          <Path d="M61 31.2 L61 29" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
          <Path d="M64.5 32 L65.5 29.8" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
          <Path d="M67.5 33.5 L69 31.5" stroke={hair} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}

      {/* ── Eyebrows ── */}
      <Path d="M33 32 Q39 29 45 32"
        stroke={hair} strokeWidth={female ? 1.5 : 2} fill="none" strokeLinecap="round" />
      <Path d="M55 32 Q61 29 67 32"
        stroke={hair} strokeWidth={female ? 1.5 : 2} fill="none" strokeLinecap="round" />

      {/* ── Nose ── */}
      <Circle cx="46.5" cy="46" r="2" fill={skinDetail} opacity="0.7" />
      <Circle cx="53.5" cy="46" r="2" fill={skinDetail} opacity="0.7" />
      <Path d="M46.5 46 Q50 48.5 53.5 46" stroke={skinDetail} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* ── Mouth ── */}
      <Path d="M41 52 Q50 59 59 52"
        stroke={skinDetail} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Teeth */}
      <Path d="M43.5 53.5 Q50 58 56.5 53.5"
        stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* ── Blush ── */}
      <Ellipse cx="28" cy="47" rx="5" ry="3" fill="#FFB3B3" opacity={female ? 0.5 : 0.3} />
      <Ellipse cx="72" cy="47" rx="5" ry="3" fill="#FFB3B3" opacity={female ? 0.5 : 0.3} />
    </Svg>
  );
}

/* ── 6 avatar configs ─────────────────────────────────────────────── */
const CONFIGS: Record<string, Config> = {
  male_light: {
    skin: "#FDDBB4", skinShadow: "#F0BC80", skinDetail: "#C8804A",
    hair: "#2D1B0E", iris: "#5C3D1E", bg: "#EFF6FF", female: false,
  },
  male_medium: {
    skin: "#D4956A", skinShadow: "#BA7448", skinDetail: "#8A4E28",
    hair: "#6B3A2A", iris: "#3B1F0E", bg: "#F0FDF4", female: false,
  },
  male_dark: {
    skin: "#8D5524", skinShadow: "#6E3E14", skinDetail: "#4A2608",
    hair: "#1A0D04", iris: "#2A1508", bg: "#FFF7ED", female: false,
  },
  female_light: {
    skin: "#FDDBB4", skinShadow: "#F0BC80", skinDetail: "#C8804A",
    hair: "#2D1B0E", iris: "#5C3D1E", bg: "#FDF4FF", female: true,
  },
  female_medium: {
    skin: "#D4956A", skinShadow: "#BA7448", skinDetail: "#8A4E28",
    hair: "#6B3A2A", iris: "#3B1F0E", bg: "#FFF1F2", female: true,
  },
  female_dark: {
    skin: "#8D5524", skinShadow: "#6E3E14", skinDetail: "#4A2608",
    hair: "#1A0D04", iris: "#2A1508", bg: "#F0FDFA", female: true,
  },
};

/* ── Named exports ────────────────────────────────────────────────── */
export function MaleDoctorLight({ size = 80 }: AvatarProps) {
  return <DoctorSvg size={size} cfg={CONFIGS.male_light} />;
}
export function MaleDoctorMedium({ size = 80 }: AvatarProps) {
  return <DoctorSvg size={size} cfg={CONFIGS.male_medium} />;
}
export function MaleDoctorDark({ size = 80 }: AvatarProps) {
  return <DoctorSvg size={size} cfg={CONFIGS.male_dark} />;
}
export function FemaleDoctorLight({ size = 80 }: AvatarProps) {
  return <DoctorSvg size={size} cfg={CONFIGS.female_light} />;
}
export function FemaleDoctorMedium({ size = 80 }: AvatarProps) {
  return <DoctorSvg size={size} cfg={CONFIGS.female_medium} />;
}
export function FemaleDoctorDark({ size = 80 }: AvatarProps) {
  return <DoctorSvg size={size} cfg={CONFIGS.female_dark} />;
}

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
