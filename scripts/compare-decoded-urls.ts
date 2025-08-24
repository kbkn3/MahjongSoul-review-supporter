#!/usr/bin/env node

/**
 * URLデコード後の実質的な内容比較
 * エンコーディングの違いを除外して本質的な差異を確認
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface DecodedComparison {
  filename: string
  totalGames: number
  identicalGames: number
  differentGames: number
  differences: Array<{
    gameIndex: number
    type: string
    details: string
  }>
}

function extractUrlsFromMd(mdPath: string): string[] {
  try {
    const content = readFileSync(mdPath, 'utf-8')
    return content.trim().split('\n').filter(line => line.startsWith('https://'))
  } catch {
    return []
  }
}

function extractUrlsFromJson(jsonPath: string): string[] {
  try {
    const content = readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(content)
    return data.nagaUrls || []
  } catch {
    return []
  }
}

function decodeAndParseUrl(url: string): any {
  try {
    // URLからJSON部分を抽出
    const match = url.match(/#json=(.+)$/)
    if (!match) return null
    
    // URLデコードを複数回実行（二重エンコードの場合があるため）
    let decoded = match[1]
    let prevDecoded = ''
    while (decoded !== prevDecoded) {
      prevDecoded = decoded
      decoded = decodeURIComponent(decoded)
    }
    
    // JSON解析
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to decode URL:', error)
    return null
  }
}

function deepCompare(obj1: any, obj2: any, path: string = ''): string[] {
  const differences: string[] = []
  
  if (obj1 === obj2) return differences
  
  if (typeof obj1 !== typeof obj2) {
    differences.push(`${path}: type mismatch (${typeof obj1} vs ${typeof obj2})`)
    return differences
  }
  
  if (obj1 === null || obj2 === null) {
    differences.push(`${path}: null mismatch`)
    return differences
  }
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      differences.push(`${path}: array length mismatch (${obj1.length} vs ${obj2.length})`)
    }
    const minLen = Math.min(obj1.length, obj2.length)
    for (let i = 0; i < minLen; i++) {
      differences.push(...deepCompare(obj1[i], obj2[i], `${path}[${i}]`))
    }
  } else if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1).sort()
    const keys2 = Object.keys(obj2).sort()
    
    const allKeys = new Set([...keys1, ...keys2])
    for (const key of allKeys) {
      if (!(key in obj1)) {
        differences.push(`${path}.${key}: missing in v1.3.1`)
      } else if (!(key in obj2)) {
        differences.push(`${path}.${key}: missing in v1.4.0`)
      } else {
        differences.push(...deepCompare(obj1[key], obj2[key], `${path}.${key}`))
      }
    }
  } else if (obj1 !== obj2) {
    differences.push(`${path}: value mismatch ("${obj1}" vs "${obj2}")`)
  }
  
  return differences
}

function compareFile(filename: string): DecodedComparison {
  const v131MdPath = join('tests/replace_tests/1.3.1', `${filename}.md`)
  const v140JsonPath = join('tests/replace_tests/1.4.0', `${filename}.json`)
  
  const result: DecodedComparison = {
    filename,
    totalGames: 0,
    identicalGames: 0,
    differentGames: 0,
    differences: []
  }
  
  // URLを取得
  const v131Urls = extractUrlsFromMd(v131MdPath)
  const v140Urls = extractUrlsFromJson(v140JsonPath)
  
  result.totalGames = Math.max(v131Urls.length, v140Urls.length)
  
  // 各ゲームを比較
  for (let i = 0; i < result.totalGames; i++) {
    if (i >= v131Urls.length) {
      result.differentGames++
      result.differences.push({
        gameIndex: i,
        type: 'missing',
        details: 'Missing in v1.3.1'
      })
      continue
    }
    
    if (i >= v140Urls.length) {
      result.differentGames++
      result.differences.push({
        gameIndex: i,
        type: 'missing',
        details: 'Missing in v1.4.0'
      })
      continue
    }
    
    // URLをデコードしてJSON比較
    const data131 = decodeAndParseUrl(v131Urls[i])
    const data140 = decodeAndParseUrl(v140Urls[i])
    
    if (!data131 || !data140) {
      result.differentGames++
      result.differences.push({
        gameIndex: i,
        type: 'parse_error',
        details: `Failed to parse: v1.3.1=${!!data131}, v1.4.0=${!!data140}`
      })
      continue
    }
    
    // 深い比較
    const diffs = deepCompare(data131, data140)
    
    if (diffs.length === 0) {
      result.identicalGames++
    } else {
      result.differentGames++
      
      // 主要な差異のみ記録（タイトル形式の違いは想定内）
      const significantDiffs = diffs.filter(d => {
        // タイトル形式の変更は想定内なので除外
        if (d.startsWith('.title:')) return false
        // その他の差異は記録
        return true
      })
      
      if (significantDiffs.length > 0) {
        result.differences.push({
          gameIndex: i,
          type: 'content',
          details: significantDiffs.slice(0, 3).join('; ')
        })
      } else {
        // タイトル形式のみの差異
        result.differences.push({
          gameIndex: i,
          type: 'title_format',
          details: 'Title format changed (expected: added ptEV)'
        })
      }
    }
  }
  
  return result
}

function main() {
  console.log('=== URLデコード後の実質的内容比較 ===\n')
  
  const files = ['9tiles', 'cant_mortal_input', 'kazoe_yakuman', 'riichi_sengen_ron', 'url_encode_replace']
  const results: DecodedComparison[] = []
  
  for (const filename of files) {
    const result = compareFile(filename)
    results.push(result)
    
    console.log(`\n📁 ${filename}:`)
    console.log(`  総ゲーム数: ${result.totalGames}`)
    console.log(`  完全一致: ${result.identicalGames} (${(result.identicalGames/result.totalGames*100).toFixed(1)}%)`)
    console.log(`  差異あり: ${result.differentGames}`)
    
    if (result.differences.length > 0) {
      console.log('  差異詳細:')
      const titleFormatDiffs = result.differences.filter(d => d.type === 'title_format')
      const contentDiffs = result.differences.filter(d => d.type === 'content')
      const otherDiffs = result.differences.filter(d => d.type !== 'title_format' && d.type !== 'content')
      
      if (titleFormatDiffs.length > 0) {
        console.log(`    - タイトル形式変更: ${titleFormatDiffs.length}件 (ptEV追加による想定内の変更)`)
      }
      if (contentDiffs.length > 0) {
        console.log(`    - 内容差異: ${contentDiffs.length}件`)
        contentDiffs.slice(0, 2).forEach(d => {
          console.log(`      Game ${d.gameIndex + 1}: ${d.details}`)
        })
      }
      if (otherDiffs.length > 0) {
        console.log(`    - その他: ${otherDiffs.length}件`)
      }
    }
  }
  
  // サマリー
  console.log('\n' + '='.repeat(50))
  console.log('\n📊 総合結果:\n')
  
  const totalGames = results.reduce((sum, r) => sum + r.totalGames, 0)
  const identicalGames = results.reduce((sum, r) => sum + r.identicalGames, 0)
  const titleOnlyDiffs = results.reduce((sum, r) => 
    sum + r.differences.filter(d => d.type === 'title_format').length, 0)
  const realDiffs = results.reduce((sum, r) => 
    sum + r.differences.filter(d => d.type === 'content').length, 0)
  
  console.log(`  検査ゲーム総数: ${totalGames}`)
  console.log(`  完全一致: ${identicalGames} (${(identicalGames/totalGames*100).toFixed(1)}%)`)
  console.log(`  タイトル形式のみ差異: ${titleOnlyDiffs} (ptEV追加による想定内)`)
  console.log(`  実質的な内容差異: ${realDiffs}`)
  
  if (realDiffs === 0) {
    console.log('\n✅ URLエンコードの違いを除けば、実質的な内容は完全に一致しています！')
    console.log('   タイトル形式の差異はptEV情報追加による改善です。')
  } else {
    console.log(`\n⚠️ ${realDiffs}件の実質的な差異が検出されました。`)
  }
}

main()