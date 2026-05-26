export interface PickedLocalFile {
  name: string
  path: string
  file?: File
}

const DOC_EXT = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx'])

function getExt(name: string) {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : ''
}

function isDocFileName(name: string) {
  return DOC_EXT.has(getExt(name))
}

function pickFromH5Input(count: number): Promise<PickedLocalFile[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    let settled = false

    const cleanup = () => {
      window.removeEventListener('focus', onWindowFocus)
      input.remove()
    }

    const finish = (files: PickedLocalFile[]) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(files)
    }

    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const onWindowFocus = () => {
      window.setTimeout(() => {
        if (!settled) {
          finish([])
        }
      }, 0)
    }

    input.type = 'file'
    input.multiple = true
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx'
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const picked = Array.from(input.files || [])
        .slice(0, count)
        .filter((file) => isDocFileName(file.name))
        .map((file) => ({
          name: file.name,
          path: file.name,
          file,
        }))
      finish(picked)
    })

    window.addEventListener('focus', onWindowFocus, { once: true })
    document.body.appendChild(input)

    try {
      input.click()
    } catch (error) {
      fail(error)
    }
  })
}

function pickFromUniChooser(count: number): Promise<PickedLocalFile[]> {
  const chooser = uni as unknown as {
    chooseMessageFile?: (options: {
      count: number
      type: 'file'
      success: (res: { tempFiles?: Array<{ name?: string; path?: string }> }) => void
      fail: (err: unknown) => void
    }) => void
    chooseFile?: (options: {
      count: number
      type: 'all'
      success: (res: { tempFiles?: Array<{ name?: string; path?: string; file?: File }> }) => void
      fail: (err: unknown) => void
    }) => void
  }

  return new Promise((resolve, reject) => {
    const onSuccess = (res: { tempFiles?: Array<{ name?: string; path?: string; file?: File }> }) => {
      const picked = (res.tempFiles || [])
        .map((item) => ({
          name: String(item.name || ''),
          path: String(item.path || ''),
          file: item.file,
        }))
        .filter((item) => item.path && isDocFileName(item.name))
      resolve(picked)
    }

    const onFail = (err: unknown) => {
      const message = err instanceof Error ? err.message : String((err as { errMsg?: string })?.errMsg || '')
      if (message.includes('cancel') || message.includes('取消')) {
        resolve([])
        return
      }
      reject(err)
    }

    if (typeof chooser.chooseMessageFile === 'function') {
      chooser.chooseMessageFile({ count, type: 'file', success: onSuccess, fail: onFail })
      return
    }

    if (typeof chooser.chooseFile === 'function') {
      chooser.chooseFile({ count, type: 'all', success: onSuccess, fail: onFail })
      return
    }

    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      pickFromH5Input(count).then(resolve).catch(reject)
      return
    }

    reject(new Error('当前端不支持文件选择'))
  })
}

export function pickDocumentFiles(count = 10) {
  return pickFromUniChooser(count)
}
