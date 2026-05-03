import React from "react";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from "react-native-svg";

interface AvatarProps { size?: number }

interface Cfg {
  bg: string;
  skin: string; skinMid: string; skinDark: string;
  hair: string; hairLight: string;
  iris: string;
  female: boolean;
}

function DoctorSvg({ size = 80, cfg }: { size: number; cfg: Cfg }) {
  const { bg, skin, skinMid, skinDark, hair, hairLight, iris, female } = cfg;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={skin} />
          <Stop offset="1" stopColor={skinMid} />
        </LinearGradient>
        <LinearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F1F5F9" />
        </LinearGradient>
        <LinearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={hairLight} />
          <Stop offset="1" stopColor={hair} />
        </LinearGradient>
      </Defs>

      {/* ── Background ── */}
      <Rect width="100" height="100" rx="20" fill={bg} />

      {/* ── White coat ── */}
      <Path
        d="M15 100 L17 67 C28 60 38 58 50 57 C62 58 72 60 83 67 L85 100 Z"
        fill="url(#coatGrad)" stroke="#CBD5E1" strokeWidth="0.6"
      />
      {/* Coat inner shirt */}
      <Path d="M50 57 L43 70 L41 100 L50 100" fill="#DBEAFE" />
      <Path d="M50 57 L57 70 L59 100 L50 100" fill="#DBEAFE" />
      {/* Collar */}
      <Path d="M44 64 L50 72 L56 64" fill="none" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Pocket */}
      <Rect x="63" y="72" width="9" height="6" rx="1.5" fill="none" stroke="#CBD5E1" strokeWidth="0.8" />
      <Path d="M66 72 L66 69.5" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M68.5 72 L68.5 69" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Stethoscope ── */}
      <Path d="M35 67 C30 72 26 78 30 85" stroke="#94A3B8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Circle cx="30" cy="85" r="4" fill="#475569" />
      <Circle cx="30" cy="85" r="2.2" fill="#64748B" />
      <Path d="M35 67 C42 74 58 74 65 67" stroke="#94A3B8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M65 67 C70 72 68 78 66 82" stroke="#94A3B8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Circle cx="66" cy="82.5" r="2" fill="#94A3B8" />

      {/* ── Neck ── */}
      <Path d="M43 53 C43 64 57 64 57 53 L57 48 C57 43 43 43 43 48 Z" fill="url(#faceGrad)" />

      {/* ── Ears ── */}
      <Ellipse cx="26.5" cy="43" rx="4.5" ry="5.5" fill={skin} />
      <Ellipse cx="26.5" cy="43" rx="2.6" ry="3.8" fill={skinMid} />
      <Path d="M27 40 Q29 43 27 46" stroke={skinDark} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <Ellipse cx="73.5" cy="43" rx="4.5" ry="5.5" fill={skin} />
      <Ellipse cx="73.5" cy="43" rx="2.6" ry="3.8" fill={skinMid} />
      <Path d="M73 40 Q71 43 73 46" stroke={skinDark} strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* ── Head ── */}
      <Ellipse cx="50" cy="38" rx="23.5" ry="27" fill="url(#faceGrad)" />
      {/* Jawline shadow */}
      <Ellipse cx="50" cy="60" rx="14" ry="5" fill={skinMid} opacity="0.5" />

      {/* ── HAIR ── */}
      {female ? <FemaleHair hair={hair} hairLight={hairLight} cfg={cfg} /> : <MaleHair hair={hair} hairLight={hairLight} cfg={cfg} />}

      {/* ── Eyes ── */}
      {/* Left */}
      <Ellipse cx="38" cy="38.5" rx="7" ry="7" fill="white" />
      <Circle cx="38.5" cy="39" r="5" fill={iris} />
      <Circle cx="38.5" cy="39" r="2.8" fill="#111827" />
      <Circle cx="40.2" cy="37.2" r="1.6" fill="white" />
      <Circle cx="37.5" cy="41" r="0.7" fill="rgba(255,255,255,0.35)" />
      {/* Top eyelid line */}
      <Path d="M31.5 35.5 C35 32.5 42 32.5 44.5 35.5" stroke="#1e293b" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Right */}
      <Ellipse cx="62" cy="38.5" rx="7" ry="7" fill="white" />
      <Circle cx="62.5" cy="39" r="5" fill={iris} />
      <Circle cx="62.5" cy="39" r="2.8" fill="#111827" />
      <Circle cx="64.2" cy="37.2" r="1.6" fill="white" />
      <Circle cx="61.5" cy="41" r="0.7" fill="rgba(255,255,255,0.35)" />
      <Path d="M55.5 35.5 C59 32.5 66 32.5 68.5 35.5" stroke="#1e293b" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Female lashes */}
      {female && <>
        <Path d="M32 34.5 L30.5 32.8" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M35 33.2 L34.2 31.2" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M38 32.6 L38 30.5" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M41 33.2 L41.8 31.2" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M44 34.5 L45.5 32.8" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M56 34.5 L54.5 32.8" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M59 33.2 L58.2 31.2" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M62 32.6 L62 30.5" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M65 33.2 L65.8 31.2" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M68 34.5 L69.5 32.8" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
      </>}

      {/* ── Eyebrows ── */}
      <Path
        d="M31.5 32 C34 29.5 38 29.5 44.5 32"
        stroke={hair} strokeWidth={female ? 1.5 : 2} fill="none" strokeLinecap="round"
      />
      <Path
        d="M55.5 32 C59 29.5 63 29.5 68.5 32"
        stroke={hair} strokeWidth={female ? 1.5 : 2} fill="none" strokeLinecap="round"
      />

      {/* ── Nose ── */}
      <Path d="M47 44 C46 47.5 46.5 49.5 50 50 C53.5 49.5 54 47.5 53 44" stroke={skinDark} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.7" />
      <Circle cx="47.2" cy="48.5" r="1.8" fill={skinMid} opacity="0.7" />
      <Circle cx="52.8" cy="48.5" r="1.8" fill={skinMid} opacity="0.7" />

      {/* ── Mouth ── */}
      <Path d="M41 55 C45 60 55 60 59 55" stroke={skinDark} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M43 56.5 C47 60 53 60 57 56.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.9" />

      {/* ── Blush ── */}
      <Ellipse cx="27" cy="49" rx="5.5" ry="3" fill="#F87171" opacity={female ? 0.28 : 0.18} />
      <Ellipse cx="73" cy="49" rx="5.5" ry="3" fill="#F87171" opacity={female ? 0.28 : 0.18} />
    </Svg>
  );
}

/* ── Male hairstyles ─────────────────────────────────────────────── */
function MaleHair({ hair, hairLight, cfg }: { hair: string; hairLight: string; cfg: Cfg }) {
  const style = cfg.bg === "#EFF6FF" ? "sidepart" : cfg.bg === "#F0FDF4" ? "wavy" : "curly";

  if (style === "sidepart") return (
    <>
      {/* Clean side-part: main cap */}
      <Path
        d="M26.5 37 C25 27 27 15 50 13 C73 15 75 27 73.5 37 C72 24 64 19 50 19 C36 19 28 24 26.5 37 Z"
        fill={hair}
      />
      {/* Side taper */}
      <Path d="M26.5 35 C24 41 24 48 26 54" stroke={hair} strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <Path d="M73.5 35 C76 41 76 48 74 54" stroke={hair} strokeWidth="6.5" fill="none" strokeLinecap="round" />
      {/* Part sheen */}
      <Path d="M35 15 C34 19 34.5 23 35.5 27" stroke={hairLight} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Top sheen */}
      <Path d="M38 14 C45 12 55 12 62 14" stroke={hairLight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
    </>
  );

  if (style === "wavy") return (
    <>
      {/* Wavy cap with natural bumps */}
      <Path
        d="M26.5 37 C25 24 28 13 50 12 C72 13 75 24 73.5 37 C72 22 65 16 56 17 C51 18 49 15 44 17 C35 16 28 22 26.5 37 Z"
        fill={hair}
      />
      {/* Wave texture on top */}
      <Path d="M30 20 C35 16 40 18 44 17 C47 16 49 14 50 14 C51 14 53 16 56 17 C60 18 65 16 70 20"
        stroke={hairLight} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.45" />
      <Path d="M26.5 35 C24 41 24 48 26 54" stroke={hair} strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <Path d="M73.5 35 C76 41 76 48 74 54" stroke={hair} strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <Path d="M38 14 C45 11 55 11 62 14" stroke={hairLight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.35" />
    </>
  );

  /* curly */
  return (
    <>
      {/* Tight curl cap: filled base */}
      <Path
        d="M26 38 C23 22 27 10 50 9 C73 10 77 22 74 38 C72 20 65 14 50 14 C35 14 28 20 26 38 Z"
        fill={hair}
      />
      {/* Curl bumps row 1 */}
      <Circle cx="33" cy="15" r="5.5" fill={hair} />
      <Circle cx="42" cy="11" r="6" fill={hair} />
      <Circle cx="50" cy="10" r="6.5" fill={hair} />
      <Circle cx="58" cy="11" r="6" fill={hair} />
      <Circle cx="67" cy="15" r="5.5" fill={hair} />
      {/* Curl bumps row 2 */}
      <Circle cx="27" cy="24" r="5" fill={hair} />
      <Circle cx="36" cy="14" r="4" fill={hair} />
      <Circle cx="64" cy="14" r="4" fill={hair} />
      <Circle cx="73" cy="24" r="5" fill={hair} />
      {/* Sides */}
      <Path d="M26 36 C23 42 23 50 25 56" stroke={hair} strokeWidth="7" fill="none" strokeLinecap="round" />
      <Path d="M74 36 C77 42 77 50 75 56" stroke={hair} strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* Sheen */}
      <Path d="M39 11 C50 8 61 11 61 11" stroke={hairLight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />
    </>
  );
}

/* ── Female hairstyles ───────────────────────────────────────────── */
function FemaleHair({ hair, hairLight, cfg }: { hair: string; hairLight: string; cfg: Cfg }) {
  const style = cfg.bg === "#FDF4FF" ? "bun" : cfg.bg === "#FFF1F2" ? "ponytail" : "afro";

  if (style === "bun") return (
    <>
      {/* Bun sphere */}
      <Circle cx="50" cy="10" r="10" fill={hair} />
      <Circle cx="50" cy="10" r="7" fill={hairLight} opacity="0.2" />
      {/* Bun hair wrap detail */}
      <Path d="M42 10 C46 7 54 7 58 10" stroke={hairLight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      <Path d="M42 12 C46 15 54 15 58 12" stroke={hair} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Hair cap sides */}
      <Path d="M26.5 36 C25 24 29 16 50 15 C71 16 75 24 73.5 36 C72 22 64 18 50 18 C36 18 28 22 26.5 36 Z" fill={hair} />
      {/* Side volume */}
      <Path d="M26.5 34 C23 40 23 49 26 56" stroke={hair} strokeWidth="8" fill="none" strokeLinecap="round" />
      <Path d="M73.5 34 C77 40 77 49 74 56" stroke={hair} strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Sheen on cap */}
      <Path d="M36 17 C44 14 56 14 64 17" stroke={hairLight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
    </>
  );

  if (style === "ponytail") return (
    <>
      {/* Smooth cap */}
      <Path d="M26.5 36 C25 22 29 13 50 12 C71 13 75 22 73.5 36 C72 21 64 17 50 17 C36 17 28 21 26.5 36 Z" fill={hair} />
      {/* Side volume */}
      <Path d="M26.5 34 C23 40 23 49 26 55" stroke={hair} strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <Path d="M73.5 34 C76 39 76 45 74.5 50" stroke={hair} strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Ponytail tube */}
      <Path d="M73 38 C80 42 82 52 78 60 C75 66 72 68 70 72" stroke={hair} strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Hair tie */}
      <Circle cx="74" cy="40" r="4" fill="#E0D4C8" />
      <Circle cx="74" cy="40" r="2.2" fill={hair} />
      {/* Sheen */}
      <Path d="M36 15 C44 12 56 12 64 15" stroke={hairLight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
    </>
  );

  /* afro */
  return (
    <>
      {/* Full natural afro — layered circles */}
      <Circle cx="50" cy="22" r="22" fill={hair} />
      <Circle cx="29" cy="34" r="13" fill={hair} />
      <Circle cx="71" cy="34" r="13" fill={hair} />
      <Circle cx="37" cy="17" r="14" fill={hair} />
      <Circle cx="63" cy="17" r="14" fill={hair} />
      <Circle cx="50" cy="12" r="14" fill={hair} />
      {/* Inner sheen — top highlight */}
      <Path d="M37 13 C44 9 56 9 63 13" stroke={hairLight} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.25" />
      <Path d="M40 11 C50 8 60 11 60 11" stroke={hairLight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.2" />
    </>
  );
}

/* ── Configs ─────────────────────────────────────────────────────── */
const CFGS: Record<string, Cfg> = {
  male_light:    { bg: "#EFF6FF", skin: "#FDDBB4", skinMid: "#F0BC80", skinDark: "#C47C3E", hair: "#2D1B0E", hairLight: "#5C3820", iris: "#6B4226", female: false },
  male_medium:   { bg: "#F0FDF4", skin: "#D4956A", skinMid: "#BA7448", skinDark: "#8A4E28", hair: "#6B3A2A", hairLight: "#9B5A3A", iris: "#3B1F0E", female: false },
  male_dark:     { bg: "#FFF7ED", skin: "#8D5524", skinMid: "#6E3E14", skinDark: "#4A2608", hair: "#1A0D04", hairLight: "#3A200A", iris: "#2A1508", female: false },
  female_light:  { bg: "#FDF4FF", skin: "#FDDBB4", skinMid: "#F0BC80", skinDark: "#C47C3E", hair: "#2D1B0E", hairLight: "#5C3820", iris: "#6B4226", female: true  },
  female_medium: { bg: "#FFF1F2", skin: "#D4956A", skinMid: "#BA7448", skinDark: "#8A4E28", hair: "#6B3A2A", hairLight: "#9B5A3A", iris: "#3B1F0E", female: true  },
  female_dark:   { bg: "#F0FDFA", skin: "#8D5524", skinMid: "#6E3E14", skinDark: "#4A2608", hair: "#1A0D04", hairLight: "#3A200A", iris: "#2A1508", female: true  },
};

export function MaleDoctorLight({ size = 80 }: AvatarProps)    { return <DoctorSvg size={size} cfg={CFGS.male_light} />; }
export function MaleDoctorMedium({ size = 80 }: AvatarProps)   { return <DoctorSvg size={size} cfg={CFGS.male_medium} />; }
export function MaleDoctorDark({ size = 80 }: AvatarProps)     { return <DoctorSvg size={size} cfg={CFGS.male_dark} />; }
export function FemaleDoctorLight({ size = 80 }: AvatarProps)  { return <DoctorSvg size={size} cfg={CFGS.female_light} />; }
export function FemaleDoctorMedium({ size = 80 }: AvatarProps) { return <DoctorSvg size={size} cfg={CFGS.female_medium} />; }
export function FemaleDoctorDark({ size = 80 }: AvatarProps)   { return <DoctorSvg size={size} cfg={CFGS.female_dark} />; }

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
