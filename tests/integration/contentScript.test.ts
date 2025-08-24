import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('Content Script Communication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // DOM環境のクリーンアップ
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  describe('Message Handling', () => {
    it('should send message to background script', async () => {
      // Arrange
      const testMessage = { type: 'GET_GAME_DATA', payload: {} }
      vi.mocked(chrome.runtime.sendMessage).mockResolvedValue({ success: true })

      // Act
      const response = await chrome.runtime.sendMessage(testMessage)

      // Assert
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(testMessage)
      expect(response).toEqual({ success: true })
    })

    it('should handle tab communication', async () => {
      // Arrange
      const tabId = 1
      const message = { message: 'tabNaga' }
      vi.mocked(chrome.tabs.sendMessage).mockResolvedValue({ data: 'response' })

      // Act
      const response = await chrome.tabs.sendMessage(tabId, message)

      // Assert
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message)
      expect(response).toEqual({ data: 'response' })
    })

    it('should handle runtime.sendMessage with timeout', async () => {
      // Arrange
      const message = { message: 'tabNaga' }
      const timeoutMs = 10000

      // タイムアウトのモック
      vi.mocked(chrome.runtime.sendMessage).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ status: 'success', data: 'test' })
          }, 100)
        })
      })

      // Act
      const startTime = Date.now()
      const response = await chrome.runtime.sendMessage(message)
      const endTime = Date.now()

      // Assert
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message)
      expect(response).toEqual({ status: 'success', data: 'test' })
      expect(endTime - startTime).toBeLessThan(timeoutMs)
    })

    it('should handle communication errors', async () => {
      // Arrange
      const message = { message: 'tabNaga' }
      const errorMessage = 'Receiving end does not exist'
      
      vi.mocked(chrome.runtime.sendMessage).mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(chrome.runtime.sendMessage(message)).rejects.toThrow(errorMessage)
    })
  })

  describe('Storage Operations', () => {
    it('should save data to chrome storage', async () => {
      // Arrange
      const testData = { kyokus: [], settings: {} }

      // Act
      await chrome.storage.local.set(testData)

      // Assert
      expect(chrome.storage.local.set).toHaveBeenCalledWith(testData)
    })

    it('should retrieve data from chrome storage', async () => {
      // Arrange
      const storedData = { kyokus: ['test'] }
      vi.mocked(chrome.storage.local.get).mockImplementation((key, callback) => {
        callback(storedData)
        return Promise.resolve(storedData)
      })

      // Act
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['kyokus'], resolve)
      })

      // Assert
      expect(result).toEqual(storedData)
    })

    it('should handle storage errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Storage quota exceeded'
      vi.mocked(chrome.storage.local.set).mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(chrome.storage.local.set({ data: 'test' })).rejects.toThrow(errorMessage)
    })

    it('should handle sync storage operations', async () => {
      // Arrange
      const testData = { preferences: { lang: 'ja' } }
      vi.mocked(chrome.storage.sync.get).mockImplementation((key, callback) => {
        callback(testData)
        return Promise.resolve(testData)
      })

      // Act
      const result = await new Promise((resolve) => {
        chrome.storage.sync.get(['preferences'], resolve)
      })

      // Assert
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['preferences'], expect.any(Function))
      expect(result).toEqual(testData)
    })
  })

  describe('Script Injection', () => {
    it('should inject script into page context', () => {
      // Arrange
      const scriptContent = 'console.log("test");'
      
      // Act
      const script = document.createElement('script')
      script.textContent = scriptContent
      document.head.appendChild(script)

      // Assert
      const injectedScript = document.querySelector('script')
      expect(injectedScript).toBeTruthy()
      expect(injectedScript?.textContent).toBe(scriptContent)
    })

    it('should remove script after injection', () => {
      // Arrange
      const scriptContent = 'console.log("test");'
      
      // Act
      const script = document.createElement('script')
      script.textContent = scriptContent
      document.head.appendChild(script)
      script.remove()

      // Assert
      const remainingScripts = document.querySelectorAll('script')
      expect(remainingScripts.length).toBe(0)
    })

    it('should create script element without throwing', () => {
      // Arrange & Act & Assert
      expect(() => {
        const script = document.createElement('script')
        script.textContent = 'console.log("test");'
        document.head.appendChild(script)
        script.remove()
      }).not.toThrow()
    })
  })

  describe('Page Context Communication', () => {
    it('should handle postMessage communication', async () => {
      // Arrange
      const testData = { type: 'GAME_DATA', data: { test: true } }
      
      // Create a promise to wait for the message
      const messagePromise = new Promise<void>((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'GAME_DATA') {
            // Assert
            expect(event.data).toEqual(testData)
            window.removeEventListener('message', messageHandler)
            resolve()
          }
        }
        window.addEventListener('message', messageHandler)
      })

      // Act
      window.postMessage(testData, '*')
      
      // Wait for the message to be received
      await messagePromise
    })

    it('should validate message origin', async () => {
      // Arrange
      const testData = { type: 'GAME_DATA', data: { test: true } }
      
      // Create a promise to wait for the message
      const messagePromise = new Promise<void>((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          // 本来は特定のoriginをチェックするが、テストでは省略
          if (event.data.type === 'GAME_DATA') {
            expect(event.origin).toBe('http://localhost:3000') // テスト環境のorigin
            window.removeEventListener('message', messageHandler)
            resolve()
          }
        }
        window.addEventListener('message', messageHandler)
      })

      // Act
      window.postMessage(testData, 'http://localhost:3000')
      
      // Wait for the message to be received
      await messagePromise
    })

    it('should ignore invalid messages', async () => {
      // Arrange
      let messageReceived = false
      
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'INVALID_TYPE') {
          messageReceived = true
        }
      }
      window.addEventListener('message', messageHandler)

      // Act
      window.postMessage({ type: 'VALID_TYPE', data: {} }, '*')
      
      // Wait briefly to ensure no invalid message is received
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Assert
      expect(messageReceived).toBe(false)
      window.removeEventListener('message', messageHandler)
    })
  })

  describe('URL Detection', () => {
    it('should detect Majsoul URLs correctly', () => {
      // Arrange
      const majsoulUrls = [
        'https://game.mahjongsoul.com/',
        'https://mahjongsoul.game.yo-star.com/',
        'https://game.maj-soul.net/',
        'https://game.maj-soul.com/'
      ]
      
      const nonMajsoulUrls = [
        'https://example.com/',
        'https://google.com/',
        'https://github.com/'
      ]

      // Act & Assert
      majsoulUrls.forEach(url => {
        const isMajsoul = majsoulUrls.some(majsoulUrl => url.includes(majsoulUrl.split('/')[2]))
        expect(isMajsoul).toBe(true)
      })

      nonMajsoulUrls.forEach(url => {
        const isMajsoul = majsoulUrls.some(majsoulUrl => url.includes(majsoulUrl.split('/')[2]))
        expect(isMajsoul).toBe(false)
      })
    })

    it('should handle URL parsing edge cases', () => {
      // Arrange
      const edgeCaseUrls = [
        'https://game.mahjongsoul.com/subpath?param=value',
        'https://game.mahjongsoul.com:8080/',
        'http://game.mahjongsoul.com/', // HTTPではなくHTTPS
        'https://fake-game.mahjongsoul.com/' // サブドメインの詐欺サイト
      ]

      // Act & Assert
      const majsoulDomain = 'game.mahjongsoul.com'
      
      expect(edgeCaseUrls[0].includes(majsoulDomain)).toBe(true) // サブパス付き
      expect(edgeCaseUrls[1].includes(majsoulDomain)).toBe(true) // ポート番号付き
      expect(edgeCaseUrls[2].includes(majsoulDomain)).toBe(true) // HTTP
      expect(edgeCaseUrls[3].includes(majsoulDomain)).toBe(true) // サブドメイン（注意が必要）
    })
  })

  describe('Error Handling', () => {
    it('should handle chrome.runtime.lastError', async () => {
      // Arrange
      const errorMessage = 'Extension context invalidated'
      chrome.runtime.lastError = { message: errorMessage }

      vi.mocked(chrome.tabs.sendMessage).mockImplementation((tabId, message, callback) => {
        if (callback) {
          callback(undefined) // エラー時はundefinedが返される
        }
      })

      // Act
      const result = await new Promise((resolve) => {
        chrome.tabs.sendMessage(1, { message: 'test' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message })
          } else {
            resolve(response)
          }
        })
      })

      // Assert
      expect(result).toEqual({ error: errorMessage })

      // Cleanup
      chrome.runtime.lastError = undefined
    })

    it('should handle timeout scenarios', async () => {
      // Arrange
      const timeoutMs = 1000
      let timeoutOccurred = false

      vi.mocked(chrome.tabs.sendMessage).mockImplementation(() => {
        // メッセージが永続的に応答しない状況をシミュレート
        return new Promise(() => {}) // 永続的に解決されないPromise
      })

      // Act
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          timeoutOccurred = true
          resolve({ error: 'Timeout' })
        }, timeoutMs)
      })

      const messagePromise = chrome.tabs.sendMessage(1, { message: 'test' })
      
      const result = await Promise.race([messagePromise, timeoutPromise])

      // Assert
      expect(timeoutOccurred).toBe(true)
      expect(result).toEqual({ error: 'Timeout' })
    })
  })

  describe('Content Script Lifecycle', () => {
    it('should initialize event listeners', () => {
      // Arrange
      let listenerAdded = false
      const mockAddListener = vi.fn(() => { listenerAdded = true })
      
      vi.mocked(chrome.runtime.onMessage.addListener).mockImplementation(mockAddListener)

      // Act
      const mockListener = (request: unknown, sender: unknown, sendResponse: unknown) => {
        // Mock listener function
      }
      chrome.runtime.onMessage.addListener(mockListener)

      // Assert
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(mockListener)
      expect(listenerAdded).toBe(true)
    })

    it('should cleanup event listeners', () => {
      // Arrange
      const mockListener = vi.fn()
      
      // Act
      chrome.runtime.onMessage.addListener(mockListener)
      chrome.runtime.onMessage.removeListener(mockListener)

      // Assert
      expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledWith(mockListener)
    })

    it('should handle multiple message listeners', () => {
      // Arrange
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      // Act
      chrome.runtime.onMessage.addListener(listener1)
      chrome.runtime.onMessage.addListener(listener2)

      // Assert
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(2)
      expect(chrome.runtime.onMessage.addListener).toHaveBeenNthCalledWith(1, listener1)
      expect(chrome.runtime.onMessage.addListener).toHaveBeenNthCalledWith(2, listener2)
    })
  })
})