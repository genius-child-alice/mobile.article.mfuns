import { mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export interface PremiumCodeResult {
  /** 兑换获得的会员天数 */
  day?: number
}

/** POST /premium/code — 兑换会员激活码（参考站 m.mfuns Premium 页） */
export function redeemPremiumCode(
  code: string,
  token?: string | null,
): Promise<MfunsApiEnvelope<PremiumCodeResult>> {
  return mfunsPost<PremiumCodeResult>('/premium/code', { code }, token)
}
