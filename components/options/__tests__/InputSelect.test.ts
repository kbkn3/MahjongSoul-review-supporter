import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InputSelect from '../InputSelect.vue'

describe('InputSelect', () => {
  const defaultProps = {
    label: 'Test Label',
    modelValue: 'option1',
    options: [
      { key: 'Option 1', value: 'option1' },
      { key: 'Option 2', value: 'option2' },
      { key: 'Option 3', value: 'option3' }
    ]
  }

  it('コンポーネントが正しくマウントされる', () => {
    const wrapper = mount(InputSelect, { props: defaultProps })
    expect(wrapper.exists()).toBe(true)
  })

  it('ラベルが正しく表示される', () => {
    const wrapper = mount(InputSelect, { 
      props: { ...defaultProps, label: 'Test Label' } 
    })
    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toContain('Test Label')
  })

  it('selectタグが正しいname属性を持つ', () => {
    const wrapper = mount(InputSelect, { props: defaultProps })
    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
    expect(select.attributes('name')).toBe('Test Label')
  })

  it('正しい数のオプションが表示される', () => {
    const wrapper = mount(InputSelect, { props: defaultProps })
    const options = wrapper.findAll('option')
    expect(options).toHaveLength(3)
  })

  it('各オプションの値とラベルが正しく設定される', () => {
    const wrapper = mount(InputSelect, { props: defaultProps })
    const options = wrapper.findAll('option')
    
    expect(options[0].attributes('value')).toBe('option1')
    expect(options[0].text()).toBe('Option 1')
    expect(options[1].attributes('value')).toBe('option2')
    expect(options[1].text()).toBe('Option 2')
    expect(options[2].attributes('value')).toBe('option3')
    expect(options[2].text()).toBe('Option 3')
  })

  it('modelValueに応じて正しいオプションが選択される', () => {
    const wrapper = mount(InputSelect, { 
      props: { ...defaultProps, modelValue: 'option2' } 
    })
    const select = wrapper.find('select')
    expect(select.element.value).toBe('option2')
  })

  it('選択変更時にupdate:modelValueイベントが発生する', async () => {
    const wrapper = mount(InputSelect, { props: defaultProps })
    const select = wrapper.find('select')
    
    await select.setValue('option3')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedEvents = wrapper.emitted('update:modelValue')
    const lastEvent = emittedEvents[emittedEvents.length - 1]
    expect(lastEvent).toEqual(['option3'])
  })

  it('マウント時に初期値のイベントが発生する', () => {
    const wrapper = mount(InputSelect, { props: defaultProps })
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['option1'])
  })

  it('labelが指定されない場合でもlabelタグは存在する', () => {
    const propsWithoutLabel = { ...defaultProps }
    delete propsWithoutLabel.label
    const wrapper = mount(InputSelect, { props: propsWithoutLabel })
    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text().trim()).toContain('Option 1')
  })
})