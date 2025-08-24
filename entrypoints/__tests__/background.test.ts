import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fakeBrowser } from 'wxt/testing'

describe('Background Service Worker', () => {
  beforeEach(() => {
    fakeBrowser.reset()
    vi.clearAllMocks()
  })

  it('拡張機能インストール時の初期化処理をテスト', () => {
    const onInstalledSpy = vi.fn()
    fakeBrowser.runtime.onInstalled.addListener(onInstalledSpy)
    
    fakeBrowser.runtime.onInstalled.trigger({
      reason: 'install',
      temporary: false
    })
    
    expect(onInstalledSpy).toHaveBeenCalledTimes(1)
    expect(onInstalledSpy).toHaveBeenCalledWith({
      reason: 'install',
      temporary: false
    })
  })

  it('拡張機能更新時の処理をテスト', () => {
    const onInstalledSpy = vi.fn()
    fakeBrowser.runtime.onInstalled.addListener(onInstalledSpy)
    
    fakeBrowser.runtime.onInstalled.trigger({
      reason: 'update',
      previousVersion: '1.2.0',
      temporary: false
    })
    
    expect(onInstalledSpy).toHaveBeenCalledTimes(1)
    expect(onInstalledSpy).toHaveBeenCalledWith({
      reason: 'update',
      previousVersion: '1.2.0',
      temporary: false
    })
  })

  it('メッセージリスナーが正しく設定される', () => {
    const onMessageSpy = vi.fn()
    fakeBrowser.runtime.onMessage.addListener(onMessageSpy)
    
    const testMessage = { type: 'test', data: 'test-data' }
    const sender = { tab: { id: 1 } }
    const sendResponse = vi.fn()
    
    fakeBrowser.runtime.onMessage.trigger(testMessage, sender, sendResponse)
    
    expect(onMessageSpy).toHaveBeenCalledTimes(1)
    expect(onMessageSpy).toHaveBeenCalledWith(testMessage, sender, sendResponse)
  })

  it('ストレージAPIが利用可能', async () => {
    const testData = { key: 'value' }
    
    await fakeBrowser.storage.local.set({ testData })
    const result = await fakeBrowser.storage.local.get('testData')
    
    expect(result.testData).toEqual(testData)
  })

  it('拡張機能のマニフェスト情報を取得できる', () => {
    const getManifestSpy = vi.fn().mockReturnValue({
      manifest_version: 3,
      name: 'Mahjong Soul Review Helper',
      version: '1.3.1'
    })
    fakeBrowser.runtime.getManifest = getManifestSpy
    
    const manifest = fakeBrowser.runtime.getManifest()
    
    expect(manifest.manifest_version).toBe(3)
    expect(manifest.name).toBe('Mahjong Soul Review Helper')
    expect(manifest.version).toBe('1.3.1')
  })

  it('タブAPIが利用可能', async () => {
    const createTabSpy = vi.fn().mockResolvedValue({ id: 123 })
    fakeBrowser.tabs.create = createTabSpy
    
    const tab = await fakeBrowser.tabs.create({ url: 'https://example.com' })
    
    expect(createTabSpy).toHaveBeenCalledWith({ url: 'https://example.com' })
    expect(tab.id).toBe(123)
  })

  it('i18n APIが利用可能', () => {
    const getMessageSpy = vi.fn().mockReturnValue('Translated Message')
    fakeBrowser.i18n.getMessage = getMessageSpy
    
    const message = fakeBrowser.i18n.getMessage('testKey')
    
    expect(message).toBe('Translated Message')
  })
})