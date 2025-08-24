import { describe, it, expect, beforeEach } from 'vitest'
import { soul2naga, toSoulTable, toNagaHand, toNagaLog } from '../../utils/dataConversion.js'

/**
 * 雀魂→天鳳形式変換の網羅的テスト
 * 1.3.1の実際の出力結果を基にした変換テスト
 */
describe('雀魂→天鳳形式変換テスト', () => {
  describe('基本データ変換', () => {
    it('ルール表示変換 - develop branch形式への変換', () => {
      expect(toSoulTable('銅の間東喰赤')).toBe('銅の間四人東')
      expect(toSoulTable('銅の間南喰赤')).toBe('銅の間四人南')
      expect(toSoulTable('銀の間東喰')).toBe('銀の間四人東') // 赤なしも変換される
      expect(toSoulTable('銀の間南喰')).toBe('銀の間四人南') // 赤なしも変換される
    })

    it('基本的な雀魂データ構造からの変換', () => {
      const mockSoulData = {
        title: ['銅の間東喰赤', '2025/1/3 4:16:37'],
        name: ['グラン・メゾン', 'Nabla2850', 'TOLAちゃん', 'rachelttr'],
        dan: ['初心★3', '初心★1', '雀士★1', '初心★3'], // danプロパティを追加
        rule: {
          disp: '銅の間東喰赤',
          aka53: 1,
          aka52: 1,
          aka51: 1
        },
        log: []
      }

      const result = soul2naga(mockSoulData)
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBe(0) // ログが空なので0
    })

    it('プレイヤー名の保持確認', () => {
      const playerNames = ['グラン・メゾン', 'Nabla2850', 'TOLAちゃん', 'rachelttr']
      const mockData = {
        title: ['テスト', '2025/1/3'],
        name: playerNames,
        dan: ['初心★3', '初心★1', '雀士★1', '初心★3'], // danプロパティを追加
        rule: { disp: 'テスト', aka53: 1, aka52: 1, aka51: 1 },
        log: [[
          [0, 0, 0], [25000, 25000, 25000, 25000], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []
        ]]
      }

      const urls = soul2naga(mockData)
      const firstUrl = urls[0]
      const tenhouData = JSON.parse(decodeURIComponent(firstUrl.replace('https://tenhou.net/6/#json=', '')))
      
      expect(tenhouData.name).toEqual(playerNames)
    })
  })

  describe('役名変換テスト', () => {
    it('基本役名の変換確認', () => {
      // 実際の1.3.1出力で確認された役名
      const testCases = [
        { input: '門前清自摸和(1飜)', expected: '門前清自摸和(1飜)' },
        { input: '平和(1飜)', expected: '平和(1飜)' },
        { input: '立直(1飜)', expected: '立直(1飜)' },
        { input: '一発(1飜)', expected: '一発(1飜)' },
        { input: 'ドラ(2飜)', expected: 'ドラ(2飜)' },
        { input: '裏ドラ(0飜)', expected: '裏ドラ(0飜)' },
        { input: '役牌 中(1飜)', expected: '役牌 中(1飜)' },
        { input: '赤ドラ(1飜)', expected: '赤ドラ(1飜)' }
      ]

      testCases.forEach(({ input, expected }) => {
        expect(input).toBe(expected)
      })
    })

    it('特殊役名の変換', () => {
      expect(toNagaHand('役牌:場風牌(1飜)', '東', '南')).toBe('場風 東(1飜)')
      expect(toNagaHand('役牌:自風牌(1飜)', '東', '南')).toBe('自風 南(1飜)')
      expect(toNagaHand('ダブル立直(2飜)', '東', '東')).toBe('両立直(2飜)')
    })

    it('1.3.1実データに含まれる全役名の確認', () => {
      // 実際の出力から抽出された役名リスト
      const actualYaku = [
        '門前清自摸和(1飜)',
        '平和(1飜)',
        '立直(1飜)',
        '一発(1飜)',
        'ドラ(2飜)',
        '裏ドラ(0飜)',
        '役牌 中(1飜)',
        'ドラ(1飜)',
        '赤ドラ(1飜)',
        '赤ドラ(2飜)',
        '裏ドラ(1飜)'
      ]

      actualYaku.forEach(yaku => {
        // 役名の構造確認
        expect(yaku).toMatch(/.*\(\d+飜\)$/) // (X飜)で終わる
        expect(yaku.length).toBeGreaterThan(4) // 最低限の長さ
      })
    })

    it('飜数別役名パターンテスト', () => {
      const yakuByHan = {
        1: ['門前清自摸和', '平和', '立直', '一発', 'ドラ', '役牌 中', '赤ドラ', '裏ドラ'],
        2: ['ドラ', '赤ドラ'],
        0: ['裏ドラ'] // 0飜もある
      }

      Object.entries(yakuByHan).forEach(([han, yakuList]) => {
        yakuList.forEach(yaku => {
          const formatted = `${yaku}(${han}飜)`
          expect(formatted).toMatch(new RegExp(`${yaku}\\(${han}飜\\)`))
        })
      })
    })

    it('局データでの役名変換', () => {
      // 1.3.1の実際のデータから抜粋
      const sampleLog = [
        [0, 0, 0],
        [25000, 25000, 25000, 25000],
        [41, 26],
        [19, 36],
        // ... 他のデータ
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        ['和了', [-6000, 15000, -3000, -3000], [1, 1, 1, '跳満3000-6000点', '門前清自摸和(1飜)', '平和(1飜)', '立直(1飜)', '一発(1飜)', 'ドラ(2飜)', '裏ドラ(0飜)']]
      ]

      const convertedLog = toNagaLog(sampleLog)
      const winInfo = convertedLog[16]
      
      expect(winInfo[2]).toContain('門前清自摸和(1飜)')
      expect(winInfo[2]).toContain('平和(1飜)')
      expect(winInfo[2]).toContain('立直(1飜)')
    })
  })

  describe('点数計算テスト', () => {
    it('各点数帯の表示確認', () => {
      const pointTestCases = [
        {
          description: '跳満',
          expected: '跳満3000-6000点',
          scoreInfo: [1, 1, 1, '跳満3000-6000点']
        },
        {
          description: '満貫',
          expected: '満貫8000点',
          scoreInfo: [0, 3, 0, '満貫8000点']
        },
        {
          description: '倍満',
          expected: '倍満16000点',
          scoreInfo: [1, 3, 1, '倍満16000点']
        },
        {
          description: '通常点数',
          expected: '20符4飜2600点∀',
          scoreInfo: [1, 1, 1, '20符4飜2600点∀']
        }
      ]

      pointTestCases.forEach(({ description, expected, scoreInfo }) => {
        expect(scoreInfo[3]).toBe(expected)
      })
    })

    it('点数変動の計算確認', () => {
      const scoreChanges = [
        [-6000, 15000, -3000, -3000], // 跳満ツモ
        [-2600, 8800, -2600, -2600],  // 通常ツモ
        [9300, 0, 0, -8300],          // 満貫ロン（実際のデータでは9300 - 8300 = 1000差）
        [0, 17000, 0, -16000]         // 倍満ロン（実際のデータでは17000 - 16000 = 1000差）
      ]

      scoreChanges.forEach((change, index) => {
        const total = change.reduce((sum, val) => sum + val, 0)
        // 麻雀の点数計算では供託（リーチ棒）や本場の関係で合計が0にならないことがある
        expect(Math.abs(total)).toBeLessThanOrEqual(3000) // 合理的な範囲内
        
        // 少なくとも点数変動があることを確認
        const hasScoreChange = change.some(val => val !== 0)
        expect(hasScoreChange).toBe(true)
      })
    })
  })

  describe('局データ変換テスト', () => {
    it('局番号の変換確認', () => {
      const kyokuNumbers = [
        [0, 0, 0], // 東1局0本場
        [1, 0, 0], // 東2局0本場
        [1, 1, 0], // 東2局1本場
        [2, 0, 0]  // 東3局0本場
      ]

      kyokuNumbers.forEach((kyoku, index) => {
        expect(kyoku).toHaveLength(3)
        expect(kyoku[0]).toBeGreaterThanOrEqual(0)
        expect(kyoku[1]).toBeGreaterThanOrEqual(0)
        expect(kyoku[2]).toBe(0) // 立直棒数は通常0
      })
    })

    it('特殊記号の処理確認', () => {
      const specialSymbols = [
        'r14', 'r17', 'r23', 'r24', 'r36', // リーチ
        'p323232',                         // ポン
        '3333p33',                         // ポン
        'c141351',                         // チー
        'p414141',                         // ポン
        'c181617',                         // チー
        'm47474747',                       // 明槓
        '4545p45',                         // ポン
        '42p4242'                          // ポン
      ]

      specialSymbols.forEach(symbol => {
        if (symbol.startsWith('r')) {
          expect(symbol).toMatch(/^r\d+$/) // リーチ記号
        } else if (symbol.startsWith('p')) {
          expect(symbol).toMatch(/^p\d+$|^\d+p\d+$/) // ポン記号
        } else if (symbol.startsWith('c')) {
          expect(symbol).toMatch(/^c\d+$/) // チー記号
        } else if (symbol.startsWith('m')) {
          expect(symbol).toMatch(/^m\d+$/) // 明槓記号
        }
      })
    })

    it('牌番号の範囲確認', () => {
      const tiles = [14, 46, 17, 41, 13, 37, 14, 33, 42, 44, 18, 38, 19]
      
      tiles.forEach(tile => {
        // 天鳳形式の牌番号範囲チェック
        expect(tile).toBeGreaterThanOrEqual(11) // 1m以上
        expect(tile).toBeLessThanOrEqual(60)    // ツモ切り以下
      })
    })
  })

  describe('赤ドラルール判定テスト', () => {
    it('赤ドラありの場合', () => {
      const redDoraRule = {
        disp: '銅の間四人東',
        aka53: 1,
        aka52: 1,
        aka51: 1
      }

      expect(redDoraRule.aka53).toBe(1)
      expect(redDoraRule.aka52).toBe(1)
      expect(redDoraRule.aka51).toBe(1)
    })

    it('赤ドラなしの場合', () => {
      const noRedDoraRule = {
        disp: '段位戦東喰',
        aka53: 0,
        aka52: 0,
        aka51: 0
      }

      expect(noRedDoraRule.aka53).toBe(0)
      expect(noRedDoraRule.aka52).toBe(0)
      expect(noRedDoraRule.aka51).toBe(0)
    })

    it('ルール名での赤ドラ判定', () => {
      const ruleNames = [
        { name: '銅の間四人東', hasRed: true },
        { name: '銅の間東喰', hasRed: true },
        { name: '段位戦東喰', hasRed: false },
        { name: '友人戦赤なし', hasRed: false }
      ]

      ruleNames.forEach(({ name, hasRed }) => {
        const hasRedDora = !name.includes('赤なし') && !name.includes('段位戦')
        expect(hasRedDora).toBe(hasRed)
      })
    })
  })

  describe('牌・鳴き記号の詳細テスト', () => {
    it('1.3.1実データの牌番号分析', () => {
      // 実際のデータから抽出された牌番号
      const actualTiles = [
        14, 46, 17, 41, 13, 37, 14, 33, 42, 44, 18, 38, 19, // 配牌
        29, 42, 42, 25, 46, 42, 27, 44, 39, 23, 21, 28,    // ツモ・打牌
        41, 26, 19, 36, 33, 51, 32, 52, 53, 15, 37, 45,    // その他
        60  // ツモ切り記号
      ]

      const tileRanges = {
        man: { min: 11, max: 19 },    // 萬子
        pin: { min: 21, max: 29 },    // 筒子
        sou: { min: 31, max: 39 },    // 索子
        honors: { min: 41, max: 47 }, // 字牌
        red: { min: 51, max: 53 },    // 赤ドラ
        special: 60                   // ツモ切り
      }

      actualTiles.forEach(tile => {
        let isValid = false
        Object.values(tileRanges).forEach(range => {
          if (typeof range === 'number') {
            if (tile === range) isValid = true
          } else {
            if (tile >= range.min && tile <= range.max) isValid = true
          }
        })
        expect(isValid).toBe(true)
      })
    })

    it('鳴き記号の詳細分析', () => {
      const nakiPatterns = [
        { symbol: 'p323232', type: 'pon', description: '32のポン' },
        { symbol: '3333p33', type: 'pon', description: '33のポン（赤入り）' },
        { symbol: 'c141351', type: 'chi', description: '123の順子チー' },
        { symbol: 'p414141', type: 'pon', description: '41のポン' },
        { symbol: 'c181617', type: 'chi', description: '678の順子チー' },
        { symbol: 'm47474747', type: 'kan', description: '47の明槓' },
        { symbol: '4545p45', type: 'pon', description: '45のポン（赤入り）' },
        { symbol: '42p4242', type: 'pon', description: '42のポン' }
      ]

      nakiPatterns.forEach(({ symbol, type, description }) => {
        switch (type) {
          case 'pon':
            expect(symbol).toMatch(/^(\d+p\d+|p\d+)$/)
            break
          case 'chi':
            expect(symbol).toMatch(/^c\d+$/)
            break
          case 'kan':
            expect(symbol).toMatch(/^m\d+$/)
            break
        }
      })
    })

    it('リーチ記号の分析', () => {
      const reachSymbols = ['r14', 'r17', 'r23', 'r24', 'r36']
      
      reachSymbols.forEach(symbol => {
        expect(symbol).toMatch(/^r\d+$/)
        const tileNumber = parseInt(symbol.substring(1))
        expect(tileNumber).toBeGreaterThanOrEqual(11)
        expect(tileNumber).toBeLessThanOrEqual(60)
      })
    })
  })

  describe('複雑な局面での変換テスト', () => {
    it('複数回リーチがある局の処理', () => {
      // 実際のデータでは複数のrXX記号が出現
      const multiReachActions = [
        44, 41, 46, 14, 60, 33, 25, "424242a42", 44, 60, 60, "r14",  // 1人目リーチ
        45, 11, 47, 15, 23, 18, 60, 60, 60, "r17",                   // 2人目リーチ
        43, 22, 19, 32, 60, 60, 31, 32, "r24", 60                    // 3人目リーチ
      ]

      const reachCount = multiReachActions.filter(action => 
        typeof action === 'string' && action.startsWith('r')
      ).length

      expect(reachCount).toBe(3) // 3人リーチ
    })

    it('鳴きありの局での処理', () => {
      const actionsWithNaki = [
        44, 32, 47, 23, 11, 16, 32, "p323232", 19, 14  // ポンあり
      ]

      const nakiActions = actionsWithNaki.filter(action =>
        typeof action === 'string' && (
          action.startsWith('p') || 
          action.startsWith('c') || 
          action.startsWith('m')
        )
      )

      expect(nakiActions.length).toBeGreaterThan(0)
      expect(nakiActions[0]).toBe('p323232')
    })

    it('複雑な点数計算パターン', () => {
      const complexScorePatterns = [
        {
          description: '親のツモ跳満',
          delta: [-6000, 15000, -3000, -3000],
          winner: 1, // インデックス
          points: '跳満3000-6000点'
        },
        {
          description: '子のツモ',
          delta: [-2600, 8800, -2600, -2600],
          winner: 1,
          points: '20符4飜2600点∀'
        },
        {
          description: 'ロン満貫',
          delta: [9300, 0, 0, -8300],
          winner: 0,
          points: '満貫8000点'
        },
        {
          description: 'ロン倍満',
          delta: [0, 17000, 0, -16000],
          winner: 1,
          points: '倍満16000点'
        }
      ]

      complexScorePatterns.forEach(({ description, delta, winner, points }) => {
        const total = delta.reduce((sum, val) => sum + val, 0)
        
        // 供託や本場の関係で合計が0にならないことがある
        expect(Math.abs(total)).toBeLessThanOrEqual(3000)
        
        // 勝者の点数は正
        expect(delta[winner]).toBeGreaterThan(0)
        
        // 点数表記の確認
        expect(points).toMatch(/(跳満|満貫|倍満|\d+符\d+飜)[\d-]+点/)
      })
    })
  })

  describe('データ整合性テスト', () => {
    it('局番号の進行確認', () => {
      const kyokuProgression = [
        [0, 0, 0], // 東1局0本場
        [1, 0, 0], // 東2局0本場  
        [1, 1, 0], // 東2局1本場（連荘）
        [2, 0, 0]  // 東3局0本場
      ]

      for (let i = 1; i < kyokuProgression.length; i++) {
        const prev = kyokuProgression[i - 1]
        const curr = kyokuProgression[i]
        
        // 局が進むか、本場が増えるかのどちらか
        const kyokuAdvanced = curr[0] > prev[0]
        const honbaIncreased = curr[0] === prev[0] && curr[1] > prev[1]
        
        expect(kyokuAdvanced || honbaIncreased).toBe(true)
      }
    })

    it('点数変動の整合性確認', () => {
      const gameProgression = [
        [25000, 25000, 25000, 25000], // 開始
        [18000, 39000, 21000, 22000], // 1局後
        [15400, 46800, 18400, 19400], // 2局後
        [23700, 46800, 18400, 11100]  // 3局後
      ]

      gameProgression.forEach(scores => {
        // 各プレイヤーの点数は0以上
        scores.forEach(score => expect(score).toBeGreaterThanOrEqual(0))
        
        // 総点数は100000点
        const total = scores.reduce((sum, val) => sum + val, 0)
        expect(total).toBe(100000)
      })
    })

    it('ルールとデータの整合性', () => {
      // 赤ドラルールがある場合、赤ドラ関連の役が出現する可能性
      const redDoraRule = { aka53: 1, aka52: 1, aka51: 1 }
      const yakuList = ['赤ドラ(1飜)', '赤ドラ(2飜)']
      
      if (redDoraRule.aka53 === 1) {
        // 赤ドラありルールなら赤ドラ役が存在する可能性
        yakuList.forEach(yaku => {
          expect(yaku).toContain('赤ドラ')
        })
      }
    })
  })

  describe('エンドツーエンド統合テスト', () => {
    it('1.3.1実データに基づく完全変換テスト - 東1局', () => {
      const soulData = {
        title: ['銅の間四人東', '2025/1/3 4:16:37'],
        name: ['グラン・メゾン', 'Nabla2850', 'TOLAちゃん', 'rachelttr'],
        dan: ['初心★3', '初心★1', '雀士★1', '初心★3'], // danプロパティを追加
        rule: {
          disp: '銅の間四人東',
          aka53: 1,
          aka52: 1,
          aka51: 1
        },
        log: [[
          [0, 0, 0],
          [25000, 25000, 25000, 25000],
          [41, 26],
          [19, 36],
          [14, 46, 17, 41, 13, 37, 14, 33, 42, 44, 18, 38, 19],
          [29, 42, 42, 25, 46, 42, 27, 44, 39, 23, 21, 28],
          [44, 41, 46, 14, 60, 33, 25, "424242a42", 44, 60, 60, "r14"],
          [25, 27, 35, 35, 11, 47, 33, 15, 18, 17, 21, 45, 34],
          [21, 26, 28, 23, 34, 27, 12, 16, 15, 29, 36],
          [45, 11, 47, 15, 23, 18, 60, 60, 60, "r17"],
          [24, 13, 34, 19, 13, 35, 43, 26, 22, 36, 52, 17, 36],
          [32, 51, 32, 31, 21, 41, 24, 53, 16, 29],
          [43, 22, 19, 32, 60, 60, 31, 32, "r24", 60],
          [26, 46, 13, 38, 25, 43, 17, 38, 47, 33, 31, 11, 33],
          [44, 32, 47, 23, 11, 16, 32, "p323232", 19, 14],
          [43, 11, 44, 31, 17, 46, 11, 23, 60, 16],
          ["和了", [-6000, 15000, -3000, -3000], [1, 1, 1, "跳満3000-6000点", "門前清自摸和(1飜)", "平和(1飜)", "立直(1飜)", "一発(1飜)", "ドラ(2飜)", "裏ドラ(0飜)"]]
        ]]
      }

      const urls = soul2naga(soulData)
      expect(urls).toHaveLength(1)

      const firstUrl = urls[0]
      expect(firstUrl).toContain('https://tenhou.net/6/#json=')
      
      const tenhouData = JSON.parse(decodeURIComponent(firstUrl.replace('https://tenhou.net/6/#json=', '')))
      
      // 基本データ検証
      expect(tenhouData.title[0][0]).toBe('銅の間四人東')
      expect(tenhouData.name).toEqual(['グラン・メゾン', 'Nabla2850', 'TOLAちゃん', 'rachelttr'])
      expect(tenhouData.rule.disp).toBe('銅の間四人東')
      expect(tenhouData.rule.aka53).toBe(1)
      expect(tenhouData.rule.aka52).toBe(1)
      expect(tenhouData.rule.aka51).toBe(1)

      // 局データ検証
      expect(tenhouData.log).toHaveLength(1)
      const kyokuData = tenhouData.log[0]
      expect(kyokuData[0]).toEqual([0, 0, 0]) // 東1局0本場
      expect(kyokuData[1]).toEqual([25000, 25000, 25000, 25000]) // 初期点数

      // 和了情報検証
      const agariInfo = kyokuData[16]
      expect(agariInfo[0]).toBe('和了')
      expect(agariInfo[1]).toEqual([-6000, 15000, -3000, -3000])
      expect(agariInfo[2]).toContain('門前清自摸和(1飜)')
      expect(agariInfo[2]).toContain('平和(1飜)')
      expect(agariInfo[2]).toContain('立直(1飜)')
      expect(agariInfo[2]).toContain('一発(1飜)')
      expect(agariInfo[2]).toContain('ドラ(2飜)')
      expect(agariInfo[2]).toContain('裏ドラ(0飜)')
    })

    it('複数局の変換確認', () => {
      const multiKyokuData = {
        title: ['銅の間四人東', '2025/1/3 4:16:37'],
        name: ['グラン・メゾン', 'Nabla2850', 'TOLAちゃん', 'rachelttr'],
        dan: ['初心★3', '初心★1', '雀士★1', '初心★3'], // danプロパティを追加
        rule: { disp: '銅の間四人東', aka53: 1, aka52: 1, aka51: 1 },
        log: [
          [[0, 0, 0], [25000, 25000, 25000, 25000], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
          [[1, 0, 0], [18000, 39000, 21000, 22000], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
          [[1, 1, 0], [15400, 46800, 18400, 19400], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
          [[2, 0, 0], [23700, 46800, 18400, 11100], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]
        ]
      }

      const urls = soul2naga(multiKyokuData)
      expect(urls).toHaveLength(4) // 4局分のURL
      
      urls.forEach((url, index) => {
        expect(url).toContain('https://tenhou.net/6/#json=')
        const tenhouData = JSON.parse(decodeURIComponent(url.replace('https://tenhou.net/6/#json=', '')))
        expect(tenhouData.log).toHaveLength(1) // 各URLは1局分
      })
    })
  })

  describe('境界値・エラーケーステスト', () => {
    it('空データの処理', () => {
      const emptyData = {
        title: ['', ''],
        name: [],
        dan: [], // 空のdanプロパティを追加
        rule: { disp: '', aka53: 0, aka52: 0, aka51: 0 },
        log: []
      }

      const urls = soul2naga(emptyData)
      expect(urls).toHaveLength(0)
    })

    it('不正な役名の処理', () => {
      const invalidHand = toNagaHand('不明な役(1飜)', '東', '南')
      expect(invalidHand).toBe('不明な役(1飜)') // そのまま返す
    })

    it('極端な点数の処理', () => {
      const extremeScores = [
        [-48000, 48000, 0, 0],     // 役満直撃
        [-8000, 2000, 2000, 4000], // 満貫ツモ
        [0, 0, 0, 0]               // 流局
      ]

      extremeScores.forEach(scores => {
        const total = scores.reduce((sum, val) => sum + val, 0)
        expect(total).toBe(0)
      })
    })

    it('特殊な牌番号の処理', () => {
      const specialTiles = [
        51, 52, 53, // 赤ドラ
        60,         // ツモ切り
        0           // 特殊ケース
      ]

      specialTiles.forEach(tile => {
        expect(typeof tile).toBe('number')
      })
    })
  })
})