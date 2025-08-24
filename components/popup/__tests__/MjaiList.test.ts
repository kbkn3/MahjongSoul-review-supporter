import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MjaiList from '../MjaiList.vue'

describe('MjaiList', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Chrome API のモックをリセット
    vi.clearAllMocks()
    
    // storage.local.get のモック設定
    vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
      if (typeof key === 'string') {
        if (key === 'MSLang') {
          callback({ MSLang: 0 })
        } else if (key === 'DisplayLang') {
          callback({ DisplayLang: 0 })
        } else {
          callback({})
        }
      } else {
        callback({})
      }
    })

    // storage.local.set のモック設定
    vi.mocked(chrome.storage.local.set).mockImplementation((data, callback) => {
      if (callback) callback()
      return Promise.resolve()
    })

    // tabs.create のモック設定
    vi.mocked(chrome.tabs.create).mockImplementation((createProperties, callback) => {
      if (callback) {
        callback({
          id: 1,
          url: createProperties.url!,
          active: true,
          index: 0,
          pinned: false,
          highlighted: true,
          windowId: 1,
          incognito: false,
          selected: true,
          discarded: false,
          autoDiscardable: true,
          groupId: -1
        })
      }
      return Promise.resolve({
        id: 1,
        url: createProperties.url!,
        active: true,
        index: 0,
        pinned: false,
        highlighted: true,
        windowId: 1,
        incognito: false,
        selected: true,
        discarded: false,
        autoDiscardable: true,
        groupId: -1
      })
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('初期表示', () => {
    it('コンポーネントが正しくマウントされる', () => {
      wrapper = mount(MjaiList)
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.template-title').text()).toBe('Motal/Acochan')
    })

    it('初期状態でプレイヤー選択画面が表示されない', () => {
      wrapper = mount(MjaiList)
      expect(wrapper.find('button').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('Which is your name?')
    })

    it('初期状態でsekiが空の配列', () => {
      wrapper = mount(MjaiList)
      expect(wrapper.vm.seki.length).toBe(1) // 初期値が[""]なので1
    })
  })

  describe('メッセージ処理', () => {
    it('牌譜データを受信してプレイヤー名を表示する', async () => {
      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      // メッセージハンドラーを取得して実行
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
      
      // プレイヤー名が追加されていることを確認
      expect(wrapper.vm.seki.length).toBe(5) // 初期の[""] + 4人のプレイヤー
      expect(wrapper.vm.seki).toContain('プレイヤー1')
      expect(wrapper.vm.seki).toContain('プレイヤー2')
      expect(wrapper.vm.seki).toContain('プレイヤー3')
      expect(wrapper.vm.seki).toContain('プレイヤー4')
    })

    it('プレイヤー選択ボタンが表示される', async () => {
      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      // メッセージハンドラーを取得して実行
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
      
      // プレイヤー選択画面が表示される
      expect(wrapper.text()).toContain('Which is your name?')
      
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(4)
      expect(buttons[0].text()).toBe('プレイヤー1')
      expect(buttons[1].text()).toBe('プレイヤー2')
      expect(buttons[2].text()).toBe('プレイヤー3')
      expect(buttons[3].text()).toBe('プレイヤー4')
    })

    it('MSLangに応じて正しいURLを生成する', async () => {
      // MSLang = 1 (yo-star.com) の場合
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'MSLang') {
          callback({ MSLang: 1 })
        } else if (key === 'DisplayLang') {
          callback({ DisplayLang: 0 })
        } else {
          callback({})
        }
      })

      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      // メッセージハンドラーを取得して実行
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
      
      // MjaiURLstringが正しく設定されているかは直接確認できないが、
      // submitMjaiでstorageに保存される値を確認することで間接的にテスト
      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        toMjaiData: 'https://mahjongsoul.game.yo-star.com/?paipu=240101-12345678-1234'
      })
    })
  })

  describe('プレイヤー選択機能', () => {
    beforeEach(async () => {
      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      // メッセージハンドラーを取得して実行
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
    })

    it('プレイヤー1を選択してmjai-reviewerを開く', async () => {
      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        toMjaiData: 'https://game.mahjongsoul.com/?paipu=240101-12345678-1234'
      })
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        toMjaiData_no: 1
      })
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://mjai.ekyu.moe/ja.html'
      })
    })

    it('プレイヤー4を選択してmjai-reviewerを開く', async () => {
      const buttons = wrapper.findAll('button')
      await buttons[3].trigger('click')
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        toMjaiData_no: 4
      })
    })
  })

  describe('言語設定', () => {
    it('DisplayLang=0で日本語版mjai-reviewerを開く', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 0 })
        } else {
          callback({})
        }
      })

      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
      
      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://mjai.ekyu.moe/ja.html'
      })
    })

    it('DisplayLang=1で英語版mjai-reviewerを開く', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 1 })
        } else {
          callback({})
        }
      })

      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
      
      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://mjai.ekyu.moe/'
      })
    })

    it('DisplayLang=2で中国語版mjai-reviewerを開く', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 2 })
        } else {
          callback({})
        }
      })

      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
      
      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://mjai.ekyu.moe/zh-cn.html'
      })
    })

    it('不明なDisplayLangでデフォルト（英語版）を開く', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 99 })
        } else {
          callback({})
        }
      })

      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
      
      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://mjai.ekyu.moe/'
      })
    })
  })

  describe('各雀魂サーバーURL対応', () => {
    it('MSLang=0で雀魂日本版URLを生成', async () => {
      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
      
      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        toMjaiData: 'https://game.mahjongsoul.com/?paipu=240101-12345678-1234'
      })
    })

    it('MSLang=2で雀魂中国版URLを生成', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'MSLang') {
          callback({ MSLang: 2 })
        } else if (key === 'DisplayLang') {
          callback({ DisplayLang: 0 })
        } else {
          callback({})
        }
      })

      wrapper = mount(MjaiList)
      
      const testData = {
        message: {
          ref: '240101-12345678-1234',
          name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4']
        }
      }
      
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      listener(testData, {}, vi.fn())
      
      await nextTick()
      
      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        toMjaiData: 'https://game.maj-soul.net/1/?paipu=240101-12345678-1234'
      })
    })
  })
})