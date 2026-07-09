/** MTN MoMo Pay merchant code (TygaStyle) */
export const MOMO_MERCHANT_CODE = "55066";

/** Build the full USSD string — customer enters their MoMo PIN after dialing. */
export function buildMomoPayUssd(amountRwf: number): string {
  const amount = Math.round(amountRwf);
  return `*182*8*1*${MOMO_MERCHANT_CODE}*${amount}#`;
}

/** Opens the phone dialer with the USSD code pre-filled (mobile). */
export function momoPayTelUrl(amountRwf: number): string {
  return `tel:${buildMomoPayUssd(amountRwf).replace(/#$/, "%23")}`;
}
