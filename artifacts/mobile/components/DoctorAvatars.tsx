import React from "react";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

interface AvatarProps { size?: number }

interface Config {
  skin: string;
  skinDetail: string;
  hair: string;
  bg: string;
  female: boolean;
  hairStyle: "sidepart" | "wavy" | "curly" | "bun" | "ponytail" | "afro";
}

function DoctorSvg({ size = 80, cfg }: { size: number; cfg: Config }) {
  const { skin, skinDetail, hair, bg, female, hairStyle } = cfg;

  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">

      {/* Background */}
      <Rect width="80" height="80" rx="18" fill={bg} />

      {/* White coat */}
      <Path d="M14 80 Q14 54 40 52 Q66 54 66 80Z" fill="#FFFFFF" stroke="#DDE3EB" strokeWidth="0.8" />
      {/* Lapels */}
      <Path d="M40 52 L33 65 L37 80H40" fill="#E8EFF8" />
      <Path d="M40 52 L47 65 L43 80H40" fill="#E8EFF8" />

      {/* Stethoscope */}
      <Path d="M32 57 Q27 64 31 70" stroke="#9AA5B4" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Circle cx="31" cy="70" r="3" fill="#64748B" />
      <Path d="M32 57 Q40 62 48 57" stroke="#9AA5B4" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Path d="M48 57 Q53 61 51 66" stroke="#9AA5B4" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* Neck */}
      <Rect x="35" y="43" width="10" height="11" rx="5" fill={skin} />

      {/* Head */}
      <Ellipse cx="40" cy="31" rx="17" ry="19" fill={skin} />

      {/* ── Hair styles ── */}

      {hairStyle === "sidepart" && (
        <>
          {/* Clean side-part cap */}
          <Path d="M23 28 Q23 12 40 11 Q57 12 57 28 Q55 18 40 17 Q25 18 23 28Z" fill={hair} />
          {/* Side part line */}
          <Path d="M30 13 Q32 17 31 22" stroke={bg} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
          {/* Side taper */}
          <Path d="M23 26 Q21 33 22 41" stroke={hair} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <Path d="M57 26 Q59 33 58 41" stroke={hair} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {hairStyle === "wavy" && (
        <>
          {/* Wavy top using bumpy path */}
          <Path d="M23 27 Q23 12 40 11 Q57 12 57 27 Q53 16 47 18 Q43 20 40 17 Q37 20 33 18 Q27 16 23 27Z" fill={hair} />
          {/* Slight wave texture on top */}
          <Path d="M27 20 Q32 16 37 19 Q40 17 43 19 Q48 16 53 20" stroke={hair === "#6B3A2A" ? "#7D4A3A" : "#3D2B1E"} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Path d="M23 26 Q21 33 22 42" stroke={hair} strokeWidth="5" fill="none" strokeLinecap="round" />
          <Path d="M57 26 Q59 33 58 42" stroke={hair} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}

      {hairStyle === "curly" && (
        <>
          {/* Tight curly / coiled cap — rounded bumpy top */}
          <Path d="M23 31 Q21 14 40 12 Q59 14 57 31 Q55 18 47 17 Q43 15 40 16 Q37 15 33 17 Q25 18 23 31Z" fill={hair} />
          {/* Curly texture bumps */}
          <Circle cx="32" cy="16" r="4" fill={hair} />
          <Circle cx="40" cy="13" r="4.5" fill={hair} />
          <Circle cx="48" cy="16" r="4" fill={hair} />
          <Circle cx="28" cy="20" r="3.5" fill={hair} />
          <Circle cx="52" cy="20" r="3.5" fill={hair} />
          <Path d="M23 29 Q21 36 22 43" stroke={hair} strokeWidth="5.5" fill="none" strokeLinecap="round" />
          <Path d="M57 29 Q59 36 58 43" stroke={hair} strokeWidth="5.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {hairStyle === "bun" && (
        <>
          {/* Elegant top bun */}
          <Circle cx="40" cy="11" r="7.5" fill={hair} />
          {/* Bun wrap detail */}
          <Path d="M34 12 Q40 9 46 12" stroke={hair === "#2D1B0E" ? "#4A2E18" : "#8D5534"} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Hair cap sides */}
          <Path d="M23 28 Q23 14 40 13 Q57 14 57 28 Q55 20 40 19 Q25 20 23 28Z" fill={hair} />
          {/* Side hair */}
          <Path d="M23 27 Q20 36 22 46" stroke={hair} strokeWidth="6" fill="none" strokeLinecap="round" />
          <Path d="M57 27 Q60 36 58 46" stroke={hair} strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      )}

      {hairStyle === "ponytail" && (
        <>
          {/* Smooth hair cap */}
          <Path d="M23 28 Q23 12 40 11 Q57 12 57 28 Q55 18 40 17 Q25 18 23 28Z" fill={hair} />
          {/* Ponytail at back */}
          <Path d="M56 22 Q64 26 62 36 Q61 42 57 44" stroke={hair} strokeWidth="7" fill="none" strokeLinecap="round" />
          {/* Hair tie */}
          <Circle cx="57" cy="28" r="3" fill="#E0D0C0" />
          <Circle cx="57" cy="28" r="1.5" fill={hair} />
          {/* Side hair */}
          <Path d="M23 27 Q20 36 22 46" stroke={hair} strokeWidth="6" fill="none" strokeLinecap="round" />
          <Path d="M57 27 Q59 33 58 40" stroke={hair} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}

      {hairStyle === "afro" && (
        <>
          {/* Natural full afro shape */}
          <Circle cx="40" cy="22" r="19" fill={hair} />
          <Circle cx="26" cy="28" r="10" fill={hair} />
          <Circle cx="54" cy="28" r="10" fill={hair} />
          <Circle cx="33" cy="16" r="9" fill={hair} />
          <Circle cx="47" cy="16" r="9" fill={hair} />
          {/* Inner sheen */}
          <Path d="M31 14 Q40 10 49 14" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Eyes */}
      <Ellipse cx="33" cy="32" rx="3" ry="3.2" fill="white" />
      <Circle cx="33" cy="32.5" r="2" fill="#1e293b" />
      <Circle cx="33.8" cy="31.8" r="0.8" fill="white" />

      <Ellipse cx="47" cy="32" rx="3" ry="3.2" fill="white" />
      <Circle cx="47" cy="32.5" r="2" fill="#1e293b" />
      <Circle cx="47.8" cy="31.8" r="0.8" fill="white" />

      {/* Eyebrows */}
      <Path d="M30 28.5 Q33 27 36 28.5" stroke={hair} strokeWidth={female ? 1.2 : 1.6} fill="none" strokeLinecap="round" />
      <Path d="M44 28.5 Q47 27 50 28.5" stroke={hair} strokeWidth={female ? 1.2 : 1.6} fill="none" strokeLinecap="round" />

      {/* Female lashes */}
      {female && (
        <>
          <Path d="M30.5 28 L29.5 26.5" stroke={hair} strokeWidth="1" strokeLinecap="round" />
          <Path d="M33 27.5 L33 26" stroke={hair} strokeWidth="1" strokeLinecap="round" />
          <Path d="M35.5 28 L36.5 26.5" stroke={hair} strokeWidth="1" strokeLinecap="round" />
          <Path d="M44.5 28 L43.5 26.5" stroke={hair} strokeWidth="1" strokeLinecap="round" />
          <Path d="M47 27.5 L47 26" stroke={hair} strokeWidth="1" strokeLinecap="round" />
          <Path d="M49.5 28 L50.5 26.5" stroke={hair} strokeWidth="1" strokeLinecap="round" />
        </>
      )}

      {/* Nose */}
      <Path d="M39 35 Q38.5 38 40 39 Q41.5 38 41 35" stroke={skinDetail} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* Smile */}
      <Path d="M35 43 Q40 47.5 45 43" stroke={skinDetail} strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Blush */}
      {female && (
        <>
          <Ellipse cx="28" cy="38" rx="4" ry="2.5" fill="#FFB3B3" opacity="0.45" />
          <Ellipse cx="52" cy="38" rx="4" ry="2.5" fill="#FFB3B3" opacity="0.45" />
        </>
      )}
    </Svg>
  );
}

/* ── Configs ─────────────────────────────────────────────────────── */
const CONFIGS: Record<string, Config> = {
  male_light:    { skin: "#FDDBB4", skinDetail: "#C8804A", hair: "#2D1B0E", bg: "#EFF6FF", female: false, hairStyle: "sidepart"  },
  male_medium:   { skin: "#D4956A", skinDetail: "#8A4E28", hair: "#6B3A2A", bg: "#F0FDF4", female: false, hairStyle: "wavy"      },
  male_dark:     { skin: "#8D5524", skinDetail: "#4A2608", hair: "#1A0D04", bg: "#FFF7ED", female: false, hairStyle: "curly"     },
  female_light:  { skin: "#FDDBB4", skinDetail: "#C8804A", hair: "#2D1B0E", bg: "#FDF4FF", female: true,  hairStyle: "bun"       },
  female_medium: { skin: "#D4956A", skinDetail: "#8A4E28", hair: "#6B3A2A", bg: "#FFF1F2", female: true,  hairStyle: "ponytail"  },
  female_dark:   { skin: "#8D5524", skinDetail: "#4A2608", hair: "#1A0D04", bg: "#F0FDFA", female: true,  hairStyle: "afro"      },
};

export function MaleDoctorLight({ size = 80 }: AvatarProps)    { return <DoctorSvg size={size} cfg={CONFIGS.male_light} />; }
export function MaleDoctorMedium({ size = 80 }: AvatarProps)   { return <DoctorSvg size={size} cfg={CONFIGS.male_medium} />; }
export function MaleDoctorDark({ size = 80 }: AvatarProps)     { return <DoctorSvg size={size} cfg={CONFIGS.male_dark} />; }
export function FemaleDoctorLight({ size = 80 }: AvatarProps)  { return <DoctorSvg size={size} cfg={CONFIGS.female_light} />; }
export function FemaleDoctorMedium({ size = 80 }: AvatarProps) { return <DoctorSvg size={size} cfg={CONFIGS.female_medium} />; }
export function FemaleDoctorDark({ size = 80 }: AvatarProps)   { return <DoctorSvg size={size} cfg={CONFIGS.female_dark} />; }

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
