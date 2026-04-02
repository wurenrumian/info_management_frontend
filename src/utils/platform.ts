function getUniPlatform(): string {
  try {
    const systemInfo = uni.getSystemInfoSync()
    return String(systemInfo.uniPlatform || '').toLowerCase()
  } catch {
    return ''
  }
}

export function isWeixinMiniProgram(): boolean {
  const platform = getUniPlatform()
  return platform === 'mp-weixin'
}

export function isH5(): boolean {
  const platform = getUniPlatform()
  return platform === 'h5' || platform === 'web'
}
