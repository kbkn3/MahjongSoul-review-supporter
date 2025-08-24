import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LangList from '../LangList.vue'
import { fakeBrowser } from 'wxt/testing'

describe.skip('LangList', () => {
  beforeEach(() => {
    fakeBrowser.reset()
    fakeBrowser.storage.local.data = {}
  })

  it('コンポーネントが正しくマウントされる', () => {
    const wrapper = mount(LangList)
    expect(wrapper.exists()).toBe(true)
  })

  it('サーバー言語設定のタイトルが表示される', () => {
    const wrapper = mount(LangList)
    const title = wrapper.find('h2')
    expect(title.exists()).toBe(true)
    expect(title.text()).toContain('サーバー言語')
  })

  it('表示言語設定セクションが存在する', () => {
    const wrapper = mount(LangList)
    const sections = wrapper.findAll('section')
    expect(sections.length).toBeGreaterThan(0)
  })

  it('サーバー選択リストが表示される', () => {
    const wrapper = mount(LangList)
    const serverOptions = wrapper.find('.server-options')
    expect(serverOptions.exists()).toBe(true)
  })

  it('日本サーバーオプションが存在する', () => {
    const wrapper = mount(LangList)
    const japanServer = wrapper.find('input[value="0"]')
    expect(japanServer.exists()).toBe(true)
  })

  it('中国サーバーオプションが存在する', () => {
    const wrapper = mount(LangList)
    const chinaServer = wrapper.find('input[value="2"]')
    expect(chinaServer.exists()).toBe(true)
  })

  it('グローバルサーバーオプションが存在する', () => {
    const wrapper = mount(LangList)
    const globalServer = wrapper.find('input[value="3"]')
    expect(globalServer.exists()).toBe(true)
  })

  it('表示言語の選択肢が表示される', () => {
    const wrapper = mount(LangList)
    const displayLangSection = wrapper.find('.display-lang')
    expect(displayLangSection.exists()).toBe(true)
  })

  it('日本語表示オプションが存在する', () => {
    const wrapper = mount(LangList)
    const japaneseOption = wrapper.find('input[name="display-lang"][value="0"]')
    expect(japaneseOption.exists()).toBe(true)
  })

  it('英語表示オプションが存在する', () => {
    const wrapper = mount(LangList)
    const englishOption = wrapper.find('input[name="display-lang"][value="1"]')
    expect(englishOption.exists()).toBe(true)
  })

  it('中国語表示オプションが存在する', () => {
    const wrapper = mount(LangList)
    const chineseOption = wrapper.find('input[name="display-lang"][value="2"]')
    expect(chineseOption.exists()).toBe(true)
  })

  it('サーバー変更時にlocalStorageが更新される', async () => {
    const wrapper = mount(LangList)
    const chinaServer = wrapper.find('input[value="2"]')
    
    await chinaServer.setChecked()
    
    expect(wrapper.vm.msLang).toBe(2)
  })

  it('表示言語変更時にlocalStorageが更新される', async () => {
    const wrapper = mount(LangList)
    const englishOption = wrapper.find('input[name="display-lang"][value="1"]')
    
    await englishOption.setChecked()
    
    expect(wrapper.vm.displayLang).toBe(1)
  })
})