import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import NagaList from '../NagaList.vue'

// soul2naga関数をモック
vi.mock('../../utils/dataConversion.js', () => ({
  soul2naga: vi.fn((data, rule) => {
    return data.log.map((log, index) => `https://tenhou.net/6/#json=test-log-${index}`)
  })
}))

describe('NagaList', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Chrome API のモックをリセット
    vi.clearAllMocks()
    
    // storage.local.get のモック設定
    vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
      if (typeof key === 'string') {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 0 })
        } else if (key === 'rule') {
          callback({ rule: 'dani' })
        } else {
          callback({})
        }
      } else {
        callback({})
      }
    })

    // tabs.query のモック設定
    vi.mocked(chrome.tabs.query).mockImplementation((queryInfo, callback) => {
      callback([
        {
          id: 1,
          url: 'https://game.mahjongsoul.com/',
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
        }
      ])
    })

    // tabs.sendMessage のモック設定
    vi.mocked(chrome.tabs.sendMessage).mockImplementation((tabId, message, callback) => {
      if (callback) {
        callback({ status: 'success' })
      }
      return Promise.resolve({ status: 'success' })
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('初期表示', () => {
    it('コンポーネントが正しくマウントされる', () => {
      wrapper = mount(NagaList)
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.template-title').text()).toBe('NAGA')
    })

    it('初期状態で局が選択されていない', () => {
      wrapper = mount(NagaList)
      const kyokuInfo = wrapper.vm.Kyoku_info
      expect(kyokuInfo.length).toBe(0)
    })

    it('選択ボタンのメッセージが0NPと表示される', () => {
      wrapper = mount(NagaList)
      expect(wrapper.vm.btn_msg).toBe('0NP')
    })

    it('ルールのデフォルト値が段位戦になっている', () => {
      wrapper = mount(NagaList)
      expect(wrapper.vm.Rule).toBe('dani')
    })

    it('匿名チェックボックスがデフォルトでオフになっている', () => {
      wrapper = mount(NagaList)
      expect(wrapper.vm.isChecked).toBe(false)
    })
  })

  describe('局選択機能', () => {
    it('局をクリックすると選択状態になる', async () => {
      wrapper = mount(NagaList)
      
      // テスト用の局データを設定
      wrapper.vm.Kyoku_info.push(
        { id: 0, Ba: 0, Kyoku_num: 1, Honba: 0, result: [['流局']], isSelect: false },
        { id: 1, Ba: 0, Kyoku_num: 2, Honba: 0, result: [['流局']], isSelect: false }
      )
      
      await nextTick()
      
      // 局を選択
      wrapper.vm.select(0)
      expect(wrapper.vm.Kyoku_info[0].isSelect).toBe(true)
      expect(wrapper.vm.Kyoku_info[1].isSelect).toBe(false)
    })

    it('全選択ボタンですべての局を選択できる', async () => {
      wrapper = mount(NagaList)
      
      // テスト用の局データを設定
      wrapper.vm.Kyoku_info.push(
        { id: 0, Ba: 0, Kyoku_num: 1, Honba: 0, result: [['流局']], isSelect: false },
        { id: 1, Ba: 0, Kyoku_num: 2, Honba: 0, result: [['流局']], isSelect: false },
        { id: 2, Ba: 0, Kyoku_num: 3, Honba: 0, result: [['流局']], isSelect: false }
      )
      
      await nextTick()
      
      // 全選択
      wrapper.vm.selectAll()
      expect(wrapper.vm.Kyoku_info[0].isSelect).toBe(true)
      expect(wrapper.vm.Kyoku_info[1].isSelect).toBe(true)
      expect(wrapper.vm.Kyoku_info[2].isSelect).toBe(true)
      
      // もう一度クリックで全解除
      wrapper.vm.selectAll()
      expect(wrapper.vm.Kyoku_info[0].isSelect).toBe(false)
      expect(wrapper.vm.Kyoku_info[1].isSelect).toBe(false)
      expect(wrapper.vm.Kyoku_info[2].isSelect).toBe(false)
    })

    it('選択した局数に応じてNPが計算される', async () => {
      wrapper = mount(NagaList)
      
      // テスト用の局データを設定
      wrapper.vm.Kyoku_info.push(
        { id: 0, Ba: 0, Kyoku_num: 1, Honba: 0, result: [['流局']], isSelect: false },
        { id: 1, Ba: 0, Kyoku_num: 2, Honba: 0, result: [['流局']], isSelect: false },
        { id: 2, Ba: 0, Kyoku_num: 3, Honba: 0, result: [['流局']], isSelect: false }
      )
      
      await nextTick()
      
      // 1局選択
      wrapper.vm.select(0)
      expect(wrapper.vm.btn_msg).toBe('10NP')
      
      // 2局選択
      wrapper.vm.select(1)
      expect(wrapper.vm.btn_msg).toBe('20NP')
      
      // 3局選択
      wrapper.vm.select(2)
      expect(wrapper.vm.btn_msg).toBe('30NP')
    })
  })

  describe('外部連携', () => {
    it('選択した局のデータがtoNagaDataに含まれる', async () => {
      wrapper = mount(NagaList)
      
      // 局データを設定
      wrapper.vm.Kyoku_info.push(
        { id: 0, Ba: 0, Kyoku_num: 1, Honba: 0, result: [['流局']], isSelect: true },
        { id: 1, Ba: 0, Kyoku_num: 2, Honba: 0, result: [['流局']], isSelect: false }
      )
      
      // toNagaDataを設定
      wrapper.vm.toNagaData = ['data-0', 'data-1']
      
      await nextTick()
      
      // submitNaga関数を呼び出し
      wrapper.vm.submitNaga()
      
      // Chrome storage APIが呼ばれることを確認
      expect(chrome.storage.local.set).toHaveBeenCalled()
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://naga.dmv.nico/naga_report/order_form/'
      })
    })

    it('匿名モードの設定が反映される', () => {
      wrapper = mount(NagaList)
      
      // 初期値確認
      expect(wrapper.vm.isChecked).toBe(false)
      
      // 匿名モードを有効化
      wrapper.vm.isChecked = true
      expect(wrapper.vm.isChecked).toBe(true)
    })
  })

  describe('ルール設定', () => {
    it('ルール変更時にstorage.localに保存される', async () => {
      // location.reloadのモック
      const reloadSpy = vi.fn()
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { reload: reloadSpy }
      })

      wrapper = mount(NagaList)
      const setStorageSpy = vi.spyOn(chrome.storage.local, 'set')
      
      // ルールを変更
      const selectElement = wrapper.find('select')
      await selectElement.setValue('1030')
      
      expect(setStorageSpy).toHaveBeenCalledWith({ rule: '1030' })
      expect(reloadSpy).toHaveBeenCalled()
    })

    it('各ルールオプションが表示される', () => {
      wrapper = mount(NagaList)
      const options = wrapper.findAll('option')
      
      expect(options.length).toBe(6)
      expect(options[0].text()).toBe('段位戦')
      expect(options[1].text()).toBe('10-30（M League）')
      expect(options[2].text()).toBe('10-20')
      expect(options[3].text()).toBe('5-15（四象戦）')
      expect(options[4].text()).toBe('5-10')
      expect(options[5].text()).toBe('ラス回避(90, 45, 0, -135)')
    })
  })

  describe('メッセージ処理', () => {
    it('runtime.onMessage.addListenerが設定される', () => {
      wrapper = mount(NagaList)
      
      // メッセージリスナーが追加されることを確認
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled()
    })

    it('processData関数が正しく動作する', () => {
      wrapper = mount(NagaList)
      
      const mockMessage = {
        log: [
          [
            [0, 0, 0], // 東1局0本場
            [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], 
            ["流局"] // 流局
          ]
        ],
        name: ["プレイヤー1", "プレイヤー2", "プレイヤー3", "プレイヤー4"]
      }
      
      // processData関数を直接テスト
      wrapper.vm.processData(mockMessage)
      
      expect(wrapper.vm.Kyoku_info.length).toBe(1)
      expect(wrapper.vm.Kyoku_info[0].Ba).toBe(0)
      expect(wrapper.vm.Kyoku_info[0].Kyoku_num).toBe(1)
      expect(wrapper.vm.Kyoku_info[0].result[0][0]).toBe('流局')
    })

    it('不正なデータ形式の場合エラーレスポンスを返す', async () => {
      wrapper = mount(NagaList)
      
      const testData = {
        invalidData: true
      }
      
      // メッセージハンドラーを取得して実行
      const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0]
      const sendResponse = vi.fn()
      
      listener(testData, {}, sendResponse)
      
      await nextTick()
      
      expect(sendResponse).toHaveBeenCalledWith({ 
        status: 'error', 
        message: 'Invalid data format' 
      })
    })
  })

  describe('初期化処理', () => {
    it('雀魂サイトでない場合はアラートを表示', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      // 雀魂以外のサイトを返すモック
      vi.mocked(chrome.tabs.query).mockImplementation((queryInfo, callback) => {
        callback([
          {
            id: 1,
            url: 'https://example.com/',
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
          }
        ])
      })
      
      wrapper = mount(NagaList)
      await flushPromises()
      
      expect(alertSpy).toHaveBeenCalledWith('雀魂のページで拡張機能を使用してください。')
    })

    it('Content Scriptが読み込まれていない場合のエラーハンドリング', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      // エラーを返すモック
      vi.mocked(chrome.tabs.sendMessage).mockImplementation((tabId, message, callback) => {
        chrome.runtime.lastError = { message: 'Receiving end does not exist' }
        if (callback) {
          callback(undefined)
        }
        return Promise.reject(new Error('Receiving end does not exist'))
      })
      
      wrapper = mount(NagaList)
      await flushPromises()
      
      expect(alertSpy).toHaveBeenCalledWith('Content scriptが読み込まれていません。ページをリロードしてください。')
      
      // lastErrorをクリア
      chrome.runtime.lastError = undefined
    })
  })
})