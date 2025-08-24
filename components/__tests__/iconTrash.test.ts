import { describe, it, expect, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import iconTrash from '../iconTrash.vue'

describe('iconTrash', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('基本表示', () => {
    it('SVGアイコンが正しくレンダリングされる', () => {
      wrapper = mount(iconTrash)
      
      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)
      expect(svg.attributes('xmlns')).toBe('http://www.w3.org/2000/svg')
      expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    })

    it('デフォルトプロパティが正しく適用される', () => {
      wrapper = mount(iconTrash)
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('20')
      expect(svg.attributes('height')).toBe('20')
      expect(svg.attributes('stroke')).toBe('currentColor')
      expect(svg.attributes('fill')).toBe('#9eb9f7')
    })

    it('pathエレメントが含まれている', () => {
      wrapper = mount(iconTrash)
      
      const path = wrapper.find('path')
      expect(path.exists()).toBe(true)
      expect(path.attributes('d')).toBeTruthy()
    })
  })

  describe('プロパティ', () => {
    it('widthプロパティが正しく適用される', () => {
      wrapper = mount(iconTrash, {
        props: { width: 30 }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('30')
    })

    it('heightプロパティが正しく適用される', () => {
      wrapper = mount(iconTrash, {
        props: { height: 25 }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('height')).toBe('25')
    })

    it('iconColorプロパティが正しく適用される', () => {
      wrapper = mount(iconTrash, {
        props: { iconColor: '#ff0000' }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('stroke')).toBe('#ff0000')
    })

    it('文字列の幅と高さが正しく適用される', () => {
      wrapper = mount(iconTrash, {
        props: { 
          width: '40',
          height: '35'
        }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('40')
      expect(svg.attributes('height')).toBe('35')
    })

    it('全てのプロパティを同時に設定できる', () => {
      wrapper = mount(iconTrash, {
        props: { 
          width: 50,
          height: 45,
          iconColor: '#00ff00'
        }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('50')
      expect(svg.attributes('height')).toBe('45')
      expect(svg.attributes('stroke')).toBe('#00ff00')
    })
  })

  describe('プロパティ定義', () => {
    it('widthプロパティの型とデフォルト値が正しい', () => {
      wrapper = mount(iconTrash)
      
      const widthProp = wrapper.vm.$options.props.width
      expect(widthProp.type).toEqual([Number, String])
      expect(widthProp.default).toBe(20)
    })

    it('heightプロパティの型とデフォルト値が正しい', () => {
      wrapper = mount(iconTrash)
      
      const heightProp = wrapper.vm.$options.props.height
      expect(heightProp.type).toEqual([Number, String])
      expect(heightProp.default).toBe(20)
    })

    it('iconColorプロパティの型とデフォルト値が正しい', () => {
      wrapper = mount(iconTrash)
      
      const iconColorProp = wrapper.vm.$options.props.iconColor
      expect(iconColorProp.type).toBe(String)
      expect(iconColorProp.default).toBe('currentColor')
    })
  })

  describe('イベント', () => {
    it('クリックイベントが正しく発行される', async () => {
      wrapper = mount(iconTrash)
      
      const svg = wrapper.find('svg')
      await svg.trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('click')
      expect(wrapper.emitted().click).toHaveLength(1)
    })

    it('複数回のクリックが正しく記録される', async () => {
      wrapper = mount(iconTrash)
      
      const svg = wrapper.find('svg')
      await svg.trigger('click')
      await svg.trigger('click')
      await svg.trigger('click')
      
      expect(wrapper.emitted().click).toHaveLength(3)
    })
  })

  describe('スタイリング', () => {
    it('カーソルポインターが設定される（親コンポーネント側）', () => {
      // このテストは実際のApp.vueの使用方法をテストします
      const ParentComponent = {
        template: `<iconTrash class="cursor-pointer" @click="handleClick" />`,
        components: { iconTrash },
        methods: {
          handleClick() {}
        }
      }
      
      const parentWrapper = mount(ParentComponent)
      expect(parentWrapper.find('.cursor-pointer').exists()).toBe(true)
      
      parentWrapper.unmount()
    })

    it('SVGのfill色が固定値で設定されている', () => {
      wrapper = mount(iconTrash)
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('#9eb9f7')
    })
  })
})