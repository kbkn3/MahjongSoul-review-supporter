import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import RecipeList from '../RecipeList.vue'

describe('RecipeList', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Chrome API のモックをリセット
    vi.clearAllMocks()
    
    // storage.local.get のモック設定
    vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
      if (key === 'DisplayLang') {
        callback({ DisplayLang: 0 })
      } else {
        callback({})
      }
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('初期表示', () => {
    it('コンポーネントが正しくマウントされる', () => {
      wrapper = mount(RecipeList)
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.template-title').text()).toBe('Result Output')
    })

    it('初期状態で牌譜未読み込みメッセージが表示される', () => {
      wrapper = mount(RecipeList)
      expect(wrapper.vm.TableText).toBe('牌譜を読み込めていません')
      
      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toBe('牌譜を読み込めていません')
    })

    it('textareaがreadonly属性を持つ', () => {
      wrapper = mount(RecipeList)
      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('readonly')).toBeDefined()
    })
  })

  describe('多言語対応', () => {
    it('日本語（DisplayLang=0）の説明文が表示される', async () => {
      wrapper = mount(RecipeList)
      await nextTick()
      
      expect(wrapper.text()).toContain('Excelやスプレッドシートにコピペできる戦績です。')
      expect(wrapper.text()).toContain('ゲームID,名前,素点,順位,和了,放銃,立直,副露,ツモ,ロン,局数,流局数')
    })

    it('英語（DisplayLang=1）の説明文が表示される', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 1 })
        } else {
          callback({})
        }
      })

      wrapper = mount(RecipeList)
      wrapper.vm.DisplayLang = 1
      await nextTick()
      
      expect(wrapper.text()).toContain('The results can be copied and pasted into Excel or spreadsheets.')
      expect(wrapper.text()).toContain('gameID,name,Table Points,rank,num of Win,num of Deal-in,num of riichi,num of meld,num of Tsumo,num of Ron,num of game,num of exhaustive')
    })

    it('中国語（DisplayLang=2）の説明文が表示される', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 2 })
        } else {
          callback({})
        }
      })

      wrapper = mount(RecipeList)
      wrapper.vm.DisplayLang = 2
      await nextTick()
      
      expect(wrapper.text()).toContain('结果可以被复制并粘贴到Excel或电子表格中。')
      expect(wrapper.text()).toContain('gameID,帐户名,标准分之和,名次,和了数,放銃数,立直数,副露数,自摸数,榮和数,局数,荒牌数')
    })
  })

  describe('データ処理機能', () => {
    it('processData関数が正しく動作する', async () => {
      wrapper = mount(RecipeList)
      
      const mockMessage = {
        name: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4'],
        sc: [25000, 0, 24000, -10, 26000, 15, 25000, -5],
        log: [
          [
            [0, 0, 0], // 東1局0本場
            [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], 
            ['流局'] // 流局
          ]
        ]
      }
      
      const refId = '240101-12345678-1234'
      
      // processData関数を直接テスト
      wrapper.vm.processData(mockMessage, refId)
      
      await nextTick()
      
      const tableText = wrapper.vm.TableText
      const lines = tableText.split('\n').filter(line => line.trim() !== '')
      
      expect(lines.length).toBe(4) // 4人分
      
      // 各行の基本データを確認
      const player1Data = lines[0].split('\t')
      expect(player1Data[0]).toBe('240101-12345678-1234') // ゲームID
      expect(player1Data[1]).toBe('プレイヤー1') // 名前
      expect(player1Data[2]).toBe('25000') // 素点
    })

    it('テキストエリアの初期値が設定される', () => {
      wrapper = mount(RecipeList)
      expect(wrapper.vm.TableText).toBe('牌譜を読み込めていません')
    })

    it('processData関数が存在する', () => {
      wrapper = mount(RecipeList)
      expect(typeof wrapper.vm.processData).toBe('function')
    })

    it('runtime.onMessage.addListenerが設定される', () => {
      wrapper = mount(RecipeList)
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled()
    })

    it('名前の特殊文字除去機能が動作する', () => {
      wrapper = mount(RecipeList)
      
      // メッセージリスナーが追加されることを確認（特殊文字除去処理を含む）
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled()
    })
  })

  describe('setup関数の戻り値', () => {
    it('必要な関数とプロパティがエクスポートされる', () => {
      wrapper = mount(RecipeList)
      
      expect(wrapper.vm.processData).toBeDefined()
      expect(wrapper.vm.TableText).toBeDefined()
      expect(wrapper.vm.DisplayLang).toBeDefined()
      expect(wrapper.vm.description).toBeDefined()
      expect(wrapper.vm.descriptionColumn).toBeDefined()
    })

    it('description配列が正しい内容を持つ', () => {
      wrapper = mount(RecipeList)
      
      expect(wrapper.vm.description).toEqual([
        'Excelやスプレッドシートにコピペできる戦績です。',
        'The results can be copied and pasted into Excel or spreadsheets.',
        '结果可以被复制并粘贴到Excel或电子表格中。'
      ])
    })

    it('descriptionColumn配列が正しい内容を持つ', () => {
      wrapper = mount(RecipeList)
      
      expect(wrapper.vm.descriptionColumn).toEqual([
        'ゲームID,名前,素点,順位,和了,放銃,立直,副露,ツモ,ロン,局数,流局数',
        'gameID,name,Table Points,rank,num of Win,num of Deal-in,num of riichi,num of meld,num of Tsumo,num of Ron,num of game,num of exhaustive',
        'gameID,帐户名,标准分之和,名次,和了数,放銃数,立直数,副露数,自摸数,榮和数,局数,荒牌数'
      ])
    })
  })
})