import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Kyoku from '../Kyoku.vue'

describe('Kyoku', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // 各テスト前に既存のwrapperを破棄
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('基本表示', () => {
    it('東1局0本場が正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('東')
      expect(wrapper.text()).toContain('1 局')
      expect(wrapper.text()).toContain('0 本場')
    })

    it('南3局2本場が正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 1,
          Kyoku_num: 3,
          Honba: 2,
          result: [['流局']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('南')
      expect(wrapper.text()).toContain('3 局')
      expect(wrapper.text()).toContain('2 本場')
    })

    it('英語表示が正しく動作する', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 1,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('East')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('0Counter Repeat')
    })

    it('中国語表示が正しく動作する', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 2,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('東')
      expect(wrapper.text()).toContain('1 局')
      expect(wrapper.text()).toContain('0 本場')
    })
  })

  describe('選択状態の表示', () => {
    it('選択されていない状態のスタイル', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局']],
          isSelect: false
        }
      })

      expect(wrapper.classes()).toContain('border-gray-200')
      expect(wrapper.classes()).not.toContain('border-red-600')
    })

    it('選択された状態のスタイル', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局']],
          isSelect: true
        }
      })

      expect(wrapper.classes()).toContain('border-red-600')
      expect(wrapper.classes()).not.toContain('border-gray-200')
    })
  })

  describe('ロン和表示', () => {
    it('単騎ロンが正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['ロン和', 'プレイヤー1', 'プレイヤー2', 8000, -8000]],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('ロン和')
      expect(wrapper.text()).toContain('プレイヤー1')
      expect(wrapper.text()).toContain('プレイヤー2')
      expect(wrapper.text()).toContain('+8000')
      expect(wrapper.text()).toContain('放銃')
    })

    it('ダブロンが正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [
            ['ロン和', 'プレイヤー1', 'プレイヤー4', 4000, -4000],
            ['ロン和', 'プレイヤー2', 'プレイヤー4', 4000, -4000]
          ],
          isSelect: false
        }
      })

      const text = wrapper.text()
      expect(text).toContain('プレイヤー1')
      expect(text).toContain('プレイヤー2')
      expect(text).toContain('プレイヤー4')
      expect(text).toContain('-8000') // ダブロンなので合計
    })

    it('トリロンが正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [
            ['ロン和', 'プレイヤー1', 'プレイヤー4', 2000, -2000],
            ['ロン和', 'プレイヤー2', 'プレイヤー4', 2000, -2000],
            ['ロン和', 'プレイヤー3', 'プレイヤー4', 2000, -2000]
          ],
          isSelect: false
        }
      })

      const text = wrapper.text()
      expect(text).toContain('プレイヤー1')
      expect(text).toContain('プレイヤー2')
      expect(text).toContain('プレイヤー3')
      expect(text).toContain('プレイヤー4')
      expect(text).toContain('-6000') // トリロンなので合計
    })

    it('英語でロンが正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 1,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['ロン和', 'Player1', 'Player2', 8000, -8000]],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('Ron')
      expect(wrapper.text()).toContain('Deal-in')
    })
  })

  describe('ツモ和表示', () => {
    it('ツモ和が正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['ツモ和', 'プレイヤー1', '', 12000, '']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('ツモ和')
      expect(wrapper.text()).toContain('プレイヤー1')
      expect(wrapper.text()).toContain('+12000')
    })

    it('英語でツモが正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 1,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['ツモ和', 'Player1', '', 12000, '']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('Tsumo')
    })

    it('中国語でツモが正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 2,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['ツモ和', 'プレイヤー1', '', 12000, '']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('自摸')
    })
  })

  describe('流局表示', () => {
    it('通常の流局が正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局', 'プレイヤー1', 'プレイヤー2']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('流局')
      expect(wrapper.text()).toContain('プレイヤー1')
      expect(wrapper.text()).toContain('プレイヤー2')
      expect(wrapper.text()).toContain('+1500') // 3000 / 2 = 1500
    })

    it('一人テンパイの流局が正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局', 'プレイヤー1']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('流局')
      expect(wrapper.text()).toContain('プレイヤー1')
      expect(wrapper.text()).toContain('+3000') // 3000 / 1 = 3000
    })

    it('特殊流局（九種九牌）が正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局', '九種九牌']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('流局')
      expect(wrapper.text()).toContain('九種九牌')
    })

    it('特殊流局（四風連打）が正しく表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局', '四風連打']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('流局')
      expect(wrapper.text()).toContain('四風連打')
    })

    it('直接特殊流局表示が正しく動作する', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['九種九牌']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('流局')
      expect(wrapper.text()).toContain('九種九牌')
    })
  })

  describe('特殊流局判定関数', () => {
    it('isSpecialAbortion が九種九牌を正しく判定する', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局', '九種九牌']],
          isSelect: false
        }
      })

      expect(wrapper.vm.isSpecialAbortion()).toBe(true)
    })

    it('isSpecialAbortion が通常流局を正しく判定する', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局', 'プレイヤー1']],
          isSelect: false
        }
      })

      expect(wrapper.vm.isSpecialAbortion()).toBe(false)
    })

    it('isDirectSpecialAbortion が正しく判定する', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['九種九牌']],
          isSelect: false
        }
      })

      expect(wrapper.vm.isDirectSpecialAbortion()).toBe(true)
    })

    it('isDirectSpecialAbortion が通常結果を正しく判定する', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局']],
          isSelect: false
        }
      })

      expect(wrapper.vm.isDirectSpecialAbortion()).toBe(false)
    })
  })

  describe('その他のパターン', () => {
    it('不明な結果パターンが表示される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['中途終了']],
          isSelect: false
        }
      })

      expect(wrapper.text()).toContain('中途終了')
    })
  })

  describe('プロパティの型チェック', () => {
    it('必須プロパティが正しく設定される', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局']],
          isSelect: false
        }
      })

      expect(wrapper.props().Language).toBe(0)
      expect(wrapper.props().Ba).toBe(0)
      expect(wrapper.props().Kyoku_num).toBe(1)
      expect(wrapper.props().Honba).toBe(0)
      expect(wrapper.props().result).toEqual([['流局']])
      expect(wrapper.props().isSelect).toBe(false)
    })

    it('isSelectのデフォルト値がfalse', () => {
      wrapper = mount(Kyoku, {
        props: {
          Language: 0,
          Ba: 0,
          Kyoku_num: 1,
          Honba: 0,
          result: [['流局']]
          // isSelectを指定しない
        }
      })

      expect(wrapper.props().isSelect).toBe(false)
    })
  })
})