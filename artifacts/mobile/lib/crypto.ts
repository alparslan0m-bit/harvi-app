const XOR_KEY = "harvi-quiz-secure-key-2024";

export function decryptAnswer(encrypted: string): { answer: number; explanation: string } {
  if (!encrypted) return { answer: 0, explanation: "" };

  // Try 1: XOR decryption (original format)
  try {
    const decoded = atob(encrypted);
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(
        decoded.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length)
      );
    }
    const parsed = JSON.parse(decrypted);
    if (typeof parsed.answer === "number") {
      return { answer: parsed.answer, explanation: parsed.explanation ?? "" };
    }
  } catch { /* fall through */ }

  // Try 2: plain base64-encoded JSON (produced by buildSecure for non-encrypted DBs)
  try {
    const decoded = atob(encrypted);
    const parsed = JSON.parse(decoded);
    if (typeof parsed.answer === "number") {
      return { answer: parsed.answer, explanation: parsed.explanation ?? "" };
    }
  } catch { /* fall through */ }

  return { answer: 0, explanation: "" };
}
