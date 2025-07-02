import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  soul2naga, 
  toSoulTable, 
  toNagaLog, 
  toNagaHand, 
  extractTable,
  deepCopy,
  POINTS 
} from '@/utils/dataConversion'

// モックデータ
const mockSoulData = {
  name: ["プレイヤー1", "プレイヤー2", "プレイヤー3", "プレイヤー4"],
  rule: {
    disp: "金の間四人南"
  },
  title: ["金の間四人南", "2024/01/01 12:00:00"],
  dan: ["雀傑★1", "雀傑★2", "雀傑★3", "雀豪★1"],
  sc: [25000, 0, 24000, -10, 26000, 15, 25000, -5],
  log: [
    [
      [0, 0, 0], // 東1局0本場 - index 0
      [11, 12, 13, 14], // 配牌情報 - index 1
      [], [], [], [], // 各プレイヤーの手牌 - index 2-5
      [], [], [], [], // 各プレイヤーの捨牌 - index 6-9
      [], [], [], [], // 各プレイヤーの副露 - index 10-13
      [], // ドラ - index 14
      [], // index 15
      ["和了", [8000, -2000, -3000, -3000], [0, 1], [0, 0, 0, 0], ["立直(1飜)", "ツモ(1飜)"]] // index 16
    ]
  ]
}

describe('Data Conversion Functions', () => {
  describe('soul2naga function', () => {
    it('should convert soul data to naga format', () => {
      const result = soul2naga(mockSoulData)
      
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(mockSoulData.log.length)
      expect(result[0]).toContain('https://tenhou.net/6/#json=')
    })
    
    it('should handle empty log data', () => {
      const emptyData = { ...mockSoulData, log: [] }
      
      const result = soul2naga(emptyData)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })
    
    it('should convert table names correctly', () => {
      expect(toSoulTable("金の間南喰赤")).toBe("金の間四人南")
      expect(toSoulTable("玉の間東喰赤")).toBe("玉の間四人東")
      expect(toSoulTable("銅の間四人南")).toBe("銅の間四人南") // 変換不要
    })
  })
  
  describe('toNagaLog function', () => {
    it('should convert soul log to naga log format', () => {
      const mockSoulLog = mockSoulData.log[0]
      
      const result = toNagaLog(mockSoulLog)
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toEqual(mockSoulLog[0]) // 基本情報は変更されない
    })
    
    it('should handle ryukyoku (draw) data without conversion', () => {
      const ryukyokuLog = [
        [0, 0, 0],
        [11, 12, 13, 14],
        [], [], [], [], // index 2-5
        [], [], [], [], // index 6-9
        [], [], [], [], // index 10-13
        [], // index 14
        [], // index 15
        ["流局"] // index 16 - 流局データ
      ]
      
      const result = toNagaLog(ryukyokuLog)
      expect(result).toEqual(ryukyokuLog) // 流局データは変換されない
    })
  })
  
  describe('toNagaHand function', () => {
    it('should convert hand names to naga format', () => {
      expect(toNagaHand("役牌:場風牌(1飜)", "東", "南")).toBe("場風 東(1飜)")
      expect(toNagaHand("役牌:自風牌(1飜)", "東", "南")).toBe("自風 南(1飜)")
      expect(toNagaHand("ダブル立直(2飜)", "東", "南")).toBe("両立直(2飜)")
      expect(toNagaHand("立直(1飜)", "東", "南")).toBe("立直(1飜)") // 変換不要
    })
  })
  
  describe('extractTable function', () => {
    it('should extract correct table type from display name', () => {
      expect(extractTable('銅の間四人東')).toBe('bronze')
      expect(extractTable('銀の間四人南')).toBe('silver')
      expect(extractTable('金の間四人南')).toBe('gold')
      expect(extractTable('玉の間四人東')).toBe('tama')
      expect(extractTable('王座の間四人南')).toBe('king')
    })
    
    it('should handle unknown table types', () => {
      expect(extractTable('友人戦')).toBe('others')
      expect(extractTable('大会戦')).toBe('others')
    })
  })
  
  describe('deepCopy function', () => {
    it('should create deep copy of object', () => {
      const original = { a: 1, b: { c: 2 } }
      const copied = deepCopy(original)
      
      expect(copied).toEqual(original)
      expect(copied).not.toBe(original)
      expect(copied.b).not.toBe(original.b)
    })
  })
  
  describe('POINTS constant', () => {
    it('should have correct point structure', () => {
      expect(POINTS.east.bronze["初心★1"]).toEqual([25, 10, -5, -15])
      expect(POINTS.south.gold["雀傑★1"]).toEqual([95, 45, -5, -95])
      expect(POINTS.others["1030"]).toEqual([50, 10, -10, -30])
    })
  })
})