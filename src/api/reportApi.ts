import { mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export function reportContent(
  id: number,
  type: number,
  reason: string,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost(
    '/reports/report',
    {
      resource_id: id,
      resource_type: type,
      reason,
      images: JSON.stringify([]),
    },
    token,
  )
}
