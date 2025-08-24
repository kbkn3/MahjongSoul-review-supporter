import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import LangList from '../LangList.vue'

describe('Options App', () => {
  it('コンポーネントが正しくマウントされる', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
  })

  it('LangListコンポーネントを含む', () => {
    const wrapper = mount(App)
    const langList = wrapper.findComponent(LangList)
    expect(langList.exists()).toBe(true)
  })

  it('正しいタイトルが表示される', () => {
    const wrapper = mount(App)
    const title = wrapper.find('.text-2xl')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('Mahjong Soul Review Supporter Settings Page')
  })

  it('ラッパーdivが存在する', () => {
    const wrapper = mount(App)
    const wrapperDiv = wrapper.find('.m-5')
    expect(wrapperDiv.exists()).toBe(true)
  })

  it('コンテナが表示される', () => {
    const wrapper = mount(App)
    const container = wrapper.find('.flex.flex-wrap')
    expect(container.exists()).toBe(true)
  })

  it('カードコンポーネントが存在する', () => {
    const wrapper = mount(App)
    const card = wrapper.find('.bg-white.shadow-lg.rounded')
    expect(card.exists()).toBe(true)
  })
})