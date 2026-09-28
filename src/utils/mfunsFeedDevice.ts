/** 动态卡片副标题「发布于」设备文案（对齐 m.mfuns） */
export function formatMfunsFeedDevice(device: string | number | undefined | null): string {
  if (device === undefined || device === null || device === '') return '未知设备'
  if (typeof device === 'string') {
    const d = device.toLowerCase()
    if (d === 'pc' || d === 'web') return '电脑'
    if (d === 'ios' || d === 'iphone') return 'iPhone'
    if (d === 'android') return 'Android'
    return device
  }
  switch (device) {
    case 1:
      return 'Android'
    case 2:
      return 'iPhone'
    case 3:
      return '电脑'
    default:
      return '未知设备'
  }
}
