export function isWeixinMiniProgram(): boolean {
  const systemInfo = uni.getSystemInfoSync()
  return systemInfo.uniPlatform === 'mp-weixin'
}

export function isH5(): boolean {
  const systemInfo = uni.getSystemInfoSync()
  return systemInfo.uniPlatform === 'h5'
}
