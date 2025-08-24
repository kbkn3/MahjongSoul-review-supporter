import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../App.vue'

// 子コンポーネントをモック化
vi.mock('../NagaList.vue', () => ({
  default: {
    name: 'NagaList',
    template: '<div class="template-box"><div class="template-title">NAGA</div></div>'
  }
}))

vi.mock('../MjaiList.vue', () => ({
  default: {
    name: 'MjaiList', 
    template: '<div class="template-box"><div class="template-title">Motal/Acochan</div></div>'
  }
}))

vi.mock('../RecipeList.vue', () => ({
  default: {
    name: 'RecipeList',
    template: '<div class="template-box"><div class="template-title">Result Output</div></div>'
  }
}))

vi.mock('../iconTrash.vue', () => ({
  default: {
    name: 'iconTrash',
    props: ['width', 'height', 'iconColor'],
    emits: ['click'],
    template: '<svg @click="$emit(\'click\')" class="cursor-pointer fill-gray-200"><path/></svg>'
  }
}))

describe('App (Popup)', () => {
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

  describe('基本表示', () => {
    it('コンポーネントが正しくマウントされる', () => {
      wrapper = mount(App)
      expect(wrapper.exists()).toBe(true)
    })

    it('アプリタイトルとバージョンが表示される', () => {
      wrapper = mount(App)
      expect(wrapper.text()).toContain('Review Supporter')
      expect(wrapper.text()).toContain('v 1.3.0')
    })

    it('子コンポーネントが正しく表示される', () => {
      wrapper = mount(App)
      expect(wrapper.text()).toContain('NAGA')
      expect(wrapper.text()).toContain('Motal/Acochan')
      expect(wrapper.text()).toContain('Result Output')
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('外部リンクが正しく表示される', () => {
      wrapper = mount(App)
      
      const links = wrapper.findAll('a')
      expect(links.length).toBe(3)
      
      expect(links[0].attributes('href')).toBe('https://modern-jan.com/2022/07/19/mjrs/')
      expect(links[0].attributes('target')).toBe('_blank')
      
      expect(links[1].attributes('href')).toBe('https://github.com/kbkn3/MahjongSoul-review-supporter/issues')
      expect(links[1].attributes('target')).toBe('_blank')
      
      expect(links[2].attributes('href')).toBe('https://twitter.com/kbkn3')
      expect(links[2].attributes('target')).toBe('_blank')
    })
  })

  describe('オプション画面開く機能', () => {
    it('トラッシュアイコンクリックでオプション画面を開く', async () => {
      wrapper = mount(App)
      
      const trashIcon = wrapper.find('svg')
      await trashIcon.trigger('click')
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'options.html'
      })
    })
  })

  describe('多言語対応', () => {
    it('日本語（DisplayLang=0）で開発支援テキストが表示される', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 0 })
        } else {
          callback({})
        }
      })

      wrapper = mount(App)
      await nextTick()
      
      expect(wrapper.text()).toContain('開発を支援する')
    })

    it('英語（DisplayLang=1）で開発支援テキストが表示される', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 1 })
        } else {
          callback({})
        }
      })

      wrapper = mount(App)
      
      // DisplayLang の値を直接設定してテスト
      wrapper.vm.DisplayLang = 1
      await nextTick()
      
      expect(wrapper.text()).toContain('Sponsor development')
    })

    it('中国語（DisplayLang=2）で開発支援テキストが表示される', async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({ DisplayLang: 2 })
        } else {
          callback({})
        }
      })

      wrapper = mount(App)
      
      // DisplayLang の値を直接設定してテスト
      wrapper.vm.DisplayLang = 2
      await nextTick()
      
      expect(wrapper.text()).toContain('支持开发')
    })

    it('supportDevelopText配列が正しい内容を持つ', () => {
      wrapper = mount(App)
      
      expect(wrapper.vm.supportDevelopText).toEqual([
        '開発を支援する',
        'Sponsor development',
        '支持开发'
      ])
    })
  })

  describe('レイアウト構造', () => {
    it('2カラムレイアウトが正しく設定されている', () => {
      wrapper = mount(App)
      
      // NAGAとMjai/Recipe/Linksのセクションが分かれている
      const columns = wrapper.findAll('.w-1\\/2')
      expect(columns.length).toBe(2)
      
      // 左カラムにNAGAList
      expect(columns[0].text()).toContain('NAGA')
      
      // 右カラムにMjaiList、RecipeList、リンク
      expect(columns[1].text()).toContain('Motal/Acochan')
      expect(columns[1].text()).toContain('Result Output')
      expect(columns[1].findAll('a').length).toBe(3)
    })

    it('トラッシュアイコンが右上に配置されている', () => {
      wrapper = mount(App)
      
      const iconContainer = wrapper.find('.absolute.top-4.right-4')
      expect(iconContainer.exists()).toBe(true)
      expect(iconContainer.find('svg').exists()).toBe(true)
    })

    it('メインコンテナにMahjong Soulテーマが適用されている', () => {
      wrapper = mount(App)
      
      const mainContainer = wrapper.find('.relative.wide.bg-mjsoul-bg-blue')
      expect(mainContainer.exists()).toBe(true)
      
      const contentContainer = wrapper.find('.bg-mjsoul-fl-blue')
      expect(contentContainer.exists()).toBe(true)
    })
  })

  describe('setup関数の戻り値', () => {
    it('必要な関数とプロパティがエクスポートされる', () => {
      wrapper = mount(App)
      
      expect(wrapper.vm.openTab).toBeDefined()
      expect(wrapper.vm.toggleTabs).toBeDefined()
      expect(wrapper.vm.openOption).toBeDefined()
      expect(wrapper.vm.supportDevelopText).toBeDefined()
      expect(wrapper.vm.DisplayLang).toBeDefined()
    })

    it('toggleTabsが正しく動作する', () => {
      wrapper = mount(App)
      
      expect(wrapper.vm.openTab).toBe(1)
      
      wrapper.vm.toggleTabs(2)
      expect(wrapper.vm.openTab).toBe(2)
      
      wrapper.vm.toggleTabs(3)
      expect(wrapper.vm.openTab).toBe(3)
    })
  })

  describe('Chrome Storage初期化', () => {
    it('DisplayLangが未定義の場合デフォルト値0を使用', () => {
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        if (key === 'DisplayLang') {
          callback({}) // DisplayLangが未定義
        } else {
          callback({})
        }
      })

      wrapper = mount(App)
      expect(wrapper.vm.DisplayLang).toBe(0)
    })

    it('storage.local.getが正しく呼ばれる', () => {
      wrapper = mount(App)
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        'DisplayLang',
        expect.any(Function)
      )
    })
  })
})