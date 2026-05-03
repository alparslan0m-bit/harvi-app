import React from "react";
import Svg, {
  Circle,
  Ellipse,
  Path,
  Rect,
} from "react-native-svg";

interface AvatarProps { size?: number }

/* ── Skin / coat palette helpers ─────────────────────────────────────── */
const SKIN = { light: "#FDDBB4", medium: "#D4956A", dark: "#8D5524" };
const COAT = "#FFFFFF";
const COAT_STROKE = "#E2E8F0";
const HAIR = { black: "#2D1B0E", brown: "#6B3A2A", blonde: "#D4A843" };
const STETH = "#94A3B8";
const STETH_HEAD = "#64748B";

/* ─────────────────────────────────────────────────────────────────────
   MALE DOCTOR — light skin, black hair
───────────────────────────────────────────────────────────────────── */
export function MaleDoctorLight({ size = 80 }: AvatarProps) {
  const s = size / 80;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* White coat body */}
      <Path d="M18 80 Q18 56 40 54 Q62 56 62 80Z" fill={COAT} stroke={COAT_STROKE} strokeWidth="1" />
      {/* Coat lapels */}
      <Path d="M40 54 L32 66 L36 80H40" fill="#E2E8F0" />
      <Path d="M40 54 L48 66 L44 80H40" fill="#E2E8F0" />
      {/* Stethoscope */}
      <Path d="M33 58 Q28 66 33 72" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="33" cy="72" r="3" fill={STETH_HEAD} />
      <Path d="M33 58 Q38 62 44 58" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M44 58 Q48 62 46 66" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <Rect x="35" y="44" width="10" height="12" rx="5" fill={SKIN.light} />
      {/* Head */}
      <Ellipse cx="40" cy="32" rx="17" ry="19" fill={SKIN.light} />
      {/* Hair */}
      <Path d="M23 30 Q23 14 40 13 Q57 14 57 30 Q55 22 40 21 Q25 22 23 30Z" fill={HAIR.black} />
      {/* Eyes */}
      <Ellipse cx="33" cy="33" rx="2.5" ry="2.8" fill="#fff" />
      <Ellipse cx="47" cy="33" rx="2.5" ry="2.8" fill="#fff" />
      <Circle cx="33.5" cy="33.5" r="1.6" fill="#1e293b" />
      <Circle cx="47.5" cy="33.5" r="1.6" fill="#1e293b" />
      {/* Eyebrows */}
      <Path d="M30 29.5 Q33 28 36 29.5" stroke={HAIR.black} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Path d="M44 29.5 Q47 28 50 29.5" stroke={HAIR.black} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M39 35 Q38 39 40 40 Q42 39 41 35" stroke="#C9956A" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M34 43 Q40 47 46 43" stroke="#C9956A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MALE DOCTOR — medium skin, brown hair
───────────────────────────────────────────────────────────────────── */
export function MaleDoctorMedium({ size = 80 }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path d="M18 80 Q18 56 40 54 Q62 56 62 80Z" fill={COAT} stroke={COAT_STROKE} strokeWidth="1" />
      <Path d="M40 54 L32 66 L36 80H40" fill="#E2E8F0" />
      <Path d="M40 54 L48 66 L44 80H40" fill="#E2E8F0" />
      <Path d="M33 58 Q28 66 33 72" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="33" cy="72" r="3" fill={STETH_HEAD} />
      <Path d="M33 58 Q38 62 44 58" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M44 58 Q48 62 46 66" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Rect x="35" y="44" width="10" height="12" rx="5" fill={SKIN.medium} />
      <Ellipse cx="40" cy="32" rx="17" ry="19" fill={SKIN.medium} />
      <Path d="M23 30 Q23 14 40 13 Q57 14 57 30 Q55 22 40 21 Q25 22 23 30Z" fill={HAIR.brown} />
      <Ellipse cx="33" cy="33" rx="2.5" ry="2.8" fill="#fff" />
      <Ellipse cx="47" cy="33" rx="2.5" ry="2.8" fill="#fff" />
      <Circle cx="33.5" cy="33.5" r="1.6" fill="#1e293b" />
      <Circle cx="47.5" cy="33.5" r="1.6" fill="#1e293b" />
      <Path d="M30 29.5 Q33 28 36 29.5" stroke={HAIR.brown} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Path d="M44 29.5 Q47 28 50 29.5" stroke={HAIR.brown} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Path d="M39 35 Q38 39 40 40 Q42 39 41 35" stroke="#A0694A" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M34 43 Q40 47 46 43" stroke="#A0694A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MALE DOCTOR — dark skin, black hair
───────────────────────────────────────────────────────────────────── */
export function MaleDoctorDark({ size = 80 }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path d="M18 80 Q18 56 40 54 Q62 56 62 80Z" fill={COAT} stroke={COAT_STROKE} strokeWidth="1" />
      <Path d="M40 54 L32 66 L36 80H40" fill="#E2E8F0" />
      <Path d="M40 54 L48 66 L44 80H40" fill="#E2E8F0" />
      <Path d="M33 58 Q28 66 33 72" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="33" cy="72" r="3" fill={STETH_HEAD} />
      <Path d="M33 58 Q38 62 44 58" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M44 58 Q48 62 46 66" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Rect x="35" y="44" width="10" height="12" rx="5" fill={SKIN.dark} />
      <Ellipse cx="40" cy="32" rx="17" ry="19" fill={SKIN.dark} />
      <Path d="M23 30 Q23 14 40 13 Q57 14 57 30 Q55 22 40 21 Q25 22 23 30Z" fill={HAIR.black} />
      <Ellipse cx="33" cy="33" rx="2.5" ry="2.8" fill="#fff" />
      <Ellipse cx="47" cy="33" rx="2.5" ry="2.8" fill="#fff" />
      <Circle cx="33.5" cy="33.5" r="1.6" fill="#0f172a" />
      <Circle cx="47.5" cy="33.5" r="1.6" fill="#0f172a" />
      <Path d="M30 29.5 Q33 28 36 29.5" stroke={HAIR.black} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Path d="M44 29.5 Q47 28 50 29.5" stroke={HAIR.black} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Path d="M39 35 Q38 39 40 40 Q42 39 41 35" stroke="#5C3318" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M34 43 Q40 47 46 43" stroke="#5C3318" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   FEMALE DOCTOR — light skin, black hair (bun)
───────────────────────────────────────────────────────────────────── */
export function FemaleDoctorLight({ size = 80 }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* Coat body */}
      <Path d="M14 80 Q14 54 40 52 Q66 54 66 80Z" fill={COAT} stroke={COAT_STROKE} strokeWidth="1" />
      <Path d="M40 52 L30 66 L35 80H40" fill="#E2E8F0" />
      <Path d="M40 52 L50 66 L45 80H40" fill="#E2E8F0" />
      {/* Stethoscope */}
      <Path d="M31 58 Q26 66 31 72" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="31" cy="72" r="3" fill={STETH_HEAD} />
      <Path d="M31 58 Q38 63 45 58" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M45 58 Q50 62 47 67" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <Rect x="35" y="43" width="10" height="11" rx="5" fill={SKIN.light} />
      {/* Head */}
      <Ellipse cx="40" cy="31" rx="17" ry="19" fill={SKIN.light} />
      {/* Hair — sides + bun */}
      <Path d="M23 28 Q22 12 40 11 Q58 12 57 28 Q56 19 40 18 Q24 19 23 28Z" fill={HAIR.black} />
      {/* Bun on top */}
      <Circle cx="40" cy="12" r="7" fill={HAIR.black} />
      <Path d="M23 27 Q20 38 22 47" stroke={HAIR.black} strokeWidth="6" fill="none" strokeLinecap="round" />
      <Path d="M57 27 Q60 38 58 47" stroke={HAIR.black} strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <Ellipse cx="33" cy="32" rx="2.5" ry="2.8" fill="#fff" />
      <Ellipse cx="47" cy="32" rx="2.5" ry="2.8" fill="#fff" />
      <Circle cx="33.5" cy="32.5" r="1.6" fill="#1e293b" />
      <Circle cx="47.5" cy="32.5" r="1.6" fill="#1e293b" />
      {/* Lashes */}
      <Path d="M30.5 29.5 L31 27.5" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M33 29 L33 27" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M35.5 29.5 L36 27.5" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M44.5 29.5 L44 27.5" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M47 29 L47 27" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M49.5 29.5 L50 27.5" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      {/* Eyebrows */}
      <Path d="M30 28.5 Q33 27 36 28.5" stroke={HAIR.black} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M44 28.5 Q47 27 50 28.5" stroke={HAIR.black} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Path d="M39 34 Q38 38 40 39 Q42 38 41 34" stroke="#C9956A" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M34 42 Q40 47 46 42" stroke="#C9956A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Cheek blush */}
      <Ellipse cx="28" cy="38" rx="4" ry="2.5" fill="#FFB3B3" opacity="0.5" />
      <Ellipse cx="52" cy="38" rx="4" ry="2.5" fill="#FFB3B3" opacity="0.5" />
    </Svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   FEMALE DOCTOR — medium skin, brown hair
───────────────────────────────────────────────────────────────────── */
export function FemaleDoctorMedium({ size = 80 }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path d="M14 80 Q14 54 40 52 Q66 54 66 80Z" fill={COAT} stroke={COAT_STROKE} strokeWidth="1" />
      <Path d="M40 52 L30 66 L35 80H40" fill="#E2E8F0" />
      <Path d="M40 52 L50 66 L45 80H40" fill="#E2E8F0" />
      <Path d="M31 58 Q26 66 31 72" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="31" cy="72" r="3" fill={STETH_HEAD} />
      <Path d="M31 58 Q38 63 45 58" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M45 58 Q50 62 47 67" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Rect x="35" y="43" width="10" height="11" rx="5" fill={SKIN.medium} />
      <Ellipse cx="40" cy="31" rx="17" ry="19" fill={SKIN.medium} />
      <Path d="M23 28 Q22 12 40 11 Q58 12 57 28 Q56 19 40 18 Q24 19 23 28Z" fill={HAIR.brown} />
      <Circle cx="40" cy="12" r="7" fill={HAIR.brown} />
      <Path d="M23 27 Q20 38 22 47" stroke={HAIR.brown} strokeWidth="6" fill="none" strokeLinecap="round" />
      <Path d="M57 27 Q60 38 58 47" stroke={HAIR.brown} strokeWidth="6" fill="none" strokeLinecap="round" />
      <Ellipse cx="33" cy="32" rx="2.5" ry="2.8" fill="#fff" />
      <Ellipse cx="47" cy="32" rx="2.5" ry="2.8" fill="#fff" />
      <Circle cx="33.5" cy="32.5" r="1.6" fill="#1e293b" />
      <Circle cx="47.5" cy="32.5" r="1.6" fill="#1e293b" />
      <Path d="M30.5 29.5 L31 27.5" stroke={HAIR.brown} strokeWidth="1" strokeLinecap="round" />
      <Path d="M33 29 L33 27" stroke={HAIR.brown} strokeWidth="1" strokeLinecap="round" />
      <Path d="M35.5 29.5 L36 27.5" stroke={HAIR.brown} strokeWidth="1" strokeLinecap="round" />
      <Path d="M44.5 29.5 L44 27.5" stroke={HAIR.brown} strokeWidth="1" strokeLinecap="round" />
      <Path d="M47 29 L47 27" stroke={HAIR.brown} strokeWidth="1" strokeLinecap="round" />
      <Path d="M49.5 29.5 L50 27.5" stroke={HAIR.brown} strokeWidth="1" strokeLinecap="round" />
      <Path d="M30 28.5 Q33 27 36 28.5" stroke={HAIR.brown} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M44 28.5 Q47 27 50 28.5" stroke={HAIR.brown} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M39 34 Q38 38 40 39 Q42 38 41 34" stroke="#A0694A" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M34 42 Q40 47 46 42" stroke="#A0694A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Ellipse cx="28" cy="38" rx="4" ry="2.5" fill="#FFB3B3" opacity="0.4" />
      <Ellipse cx="52" cy="38" rx="4" ry="2.5" fill="#FFB3B3" opacity="0.4" />
    </Svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   FEMALE DOCTOR — dark skin, black hair
───────────────────────────────────────────────────────────────────── */
export function FemaleDoctorDark({ size = 80 }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path d="M14 80 Q14 54 40 52 Q66 54 66 80Z" fill={COAT} stroke={COAT_STROKE} strokeWidth="1" />
      <Path d="M40 52 L30 66 L35 80H40" fill="#E2E8F0" />
      <Path d="M40 52 L50 66 L45 80H40" fill="#E2E8F0" />
      <Path d="M31 58 Q26 66 31 72" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="31" cy="72" r="3" fill={STETH_HEAD} />
      <Path d="M31 58 Q38 63 45 58" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M45 58 Q50 62 47 67" stroke={STETH} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Rect x="35" y="43" width="10" height="11" rx="5" fill={SKIN.dark} />
      <Ellipse cx="40" cy="31" rx="17" ry="19" fill={SKIN.dark} />
      <Path d="M23 28 Q22 12 40 11 Q58 12 57 28 Q56 19 40 18 Q24 19 23 28Z" fill={HAIR.black} />
      <Circle cx="40" cy="12" r="7" fill={HAIR.black} />
      <Path d="M23 27 Q20 38 22 47" stroke={HAIR.black} strokeWidth="6" fill="none" strokeLinecap="round" />
      <Path d="M57 27 Q60 38 58 47" stroke={HAIR.black} strokeWidth="6" fill="none" strokeLinecap="round" />
      <Ellipse cx="33" cy="32" rx="2.5" ry="2.8" fill="#fff" />
      <Ellipse cx="47" cy="32" rx="2.5" ry="2.8" fill="#fff" />
      <Circle cx="33.5" cy="32.5" r="1.6" fill="#0f172a" />
      <Circle cx="47.5" cy="32.5" r="1.6" fill="#0f172a" />
      <Path d="M30.5 29.5 L31 27.5" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M33 29 L33 27" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M35.5 29.5 L36 27.5" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M44.5 29.5 L44 27.5" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M47 29 L47 27" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M49.5 29.5 L50 27.5" stroke={HAIR.black} strokeWidth="1" strokeLinecap="round" />
      <Path d="M30 28.5 Q33 27 36 28.5" stroke={HAIR.black} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M44 28.5 Q47 27 50 28.5" stroke={HAIR.black} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M39 34 Q38 38 40 39 Q42 38 41 34" stroke="#5C3318" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M34 42 Q40 47 46 42" stroke="#5C3318" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Ellipse cx="28" cy="38" rx="4" ry="2.5" fill="#FFB3B3" opacity="0.3" />
      <Ellipse cx="52" cy="38" rx="4" ry="2.5" fill="#FFB3B3" opacity="0.3" />
    </Svg>
  );
}

/* ── Registry ─────────────────────────────────────────────────────── */
export type AvatarId =
  | "male_light"
  | "male_medium"
  | "male_dark"
  | "female_light"
  | "female_medium"
  | "female_dark";

export const AVATARS: { id: AvatarId; label: string; component: React.FC<AvatarProps> }[] = [
  { id: "male_light",   label: "Doctor",   component: MaleDoctorLight   },
  { id: "male_medium",  label: "Doctor",   component: MaleDoctorMedium  },
  { id: "male_dark",    label: "Doctor",   component: MaleDoctorDark    },
  { id: "female_light", label: "Doctor",   component: FemaleDoctorLight  },
  { id: "female_medium",label: "Doctor",   component: FemaleDoctorMedium },
  { id: "female_dark",  label: "Doctor",   component: FemaleDoctorDark   },
];

export function AvatarById({ id, size = 80 }: { id: AvatarId | null; size?: number }) {
  const found = AVATARS.find((a) => a.id === id);
  if (!found) return null;
  const C = found.component;
  return <C size={size} />;
}
