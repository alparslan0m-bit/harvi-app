const XOR_KEY = "harvi-quiz-secure-key-2024";

export function decryptAnswer(encrypted: string): { answer: number; explanation: string } {
  try {
    const decoded = atob(encrypted);
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(
        decoded.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length)
      );
    }
    return JSON.parse(decrypted);
  } catch {
    return { answer: 0, explanation: "" };
  }
}
