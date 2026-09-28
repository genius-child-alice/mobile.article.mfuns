import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export function fetchIsReward(
  id: number,
  type: number,
  token: string,
): Promise<MfunsApiEnvelope<{ is_reward?: boolean }>> {
  return mfunsGet('/reward/is_reward', { id, type }, token)
}

export function rewardResource(
  id: number,
  type: number,
  count: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/reward/reward', { id, type, count }, token)
}
