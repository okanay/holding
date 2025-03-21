// prettier-ignore
import { PhoneCodeSearch, type PhoneCodeOption, type PhoneCodeOptions } from '../packages/phone-code-search.js'
import { phoneCodesTR, phoneCodesEN } from '../../constants/phone-code.js'

declare global {
  interface Window {
    RefreshPhone: () => void
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Global yapılandırma
  const phoneCodeConfig = {
    classNames: {
      container: 'phone-code-container',
      select: 'phone-code-select',
      flag: 'phone-code-flag',
      prefix: 'phone-code-prefix',
      phoneInput: 'phone-code-input',
      searchInput: 'phone-code-search-input',
      suggestions: 'phone-code-suggestions',
      searchModal: 'phone-code-search-modal',
      clearButton: 'phone-code-clear-button',
      afterFocusElement: 'phone-code-input',
    },
    languages: [
      {
        id: 'TR',
        data: phoneCodesTR,
      },
      {
        id: 'EN',
        data: phoneCodesEN,
      },
    ],
    defaultLanguage: 'EN',
    onSelect: (option: PhoneCodeOption, instance: PhoneCodeSearch) => {},
    onPhoneChange: (phone: string, instance: PhoneCodeSearch) => {},
  }

  PhoneCodeSearch.init(phoneCodeConfig as PhoneCodeOptions)
  window.RefreshPhone = () => PhoneCodeSearch.refresh()
})
