#!/usr/bin/env node

/**
 * 詳細な変換差分分析ツール
 * 1.3.1と1.4.0の実際の変換内容を詳細に比較
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface ComparisonResult {
  filename: string
  roleNameCheck: {
    v131: string[]
    v140: string[]
    matches: boolean
    details: string[]
  }
  titleFormatCheck: {
    v131Format: any
    v140Format: any
    hasPtEV: boolean
    details: string[]
  }
  overallStatus: 'PASS' | 'FAIL' | 'PARTIAL'
}

function extractRoleNames(content: string): string[] {
  // 役名パターンを抽出 (例: "断幺九(1飜)")
  const pattern = /"([^"]+)\(\d+飜\)"/g
  const matches: string[] = []
  let match
  while ((match = pattern.exec(content)) !== null) {
    matches.push(match[1])
  }
  return matches
}

function extractTitle(jsonPath: string): any {
  try {
    const content = readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(content)
    return data.title
  } catch {
    return null
  }
}

function analyzeFile(filename: string): ComparisonResult {
  const v131JsonPath = join('tests/replace_tests/1.3.1', `${filename}.json`)
  const v140JsonPath = join('tests/replace_tests/1.4.0', `${filename}.json`)
  
  const result: ComparisonResult = {
    filename,
    roleNameCheck: {
      v131: [],
      v140: [],
      matches: false,
      details: []
    },
    titleFormatCheck: {
      v131Format: null,
      v140Format: null,
      hasPtEV: false,
      details: []
    },
    overallStatus: 'FAIL'
  }
  
  // 役名チェック
  if (existsSync(v131JsonPath) && existsSync(v140JsonPath)) {
    const v131Content = readFileSync(v131JsonPath, 'utf-8')
    const v140Content = readFileSync(v140JsonPath, 'utf-8')
    
    result.roleNameCheck.v131 = extractRoleNames(v131Content)
    result.roleNameCheck.v140 = extractRoleNames(v140Content)
    
    // 役名の一致確認（主要な役のみチェック）
    const importantRoles = ['断幺九', '平和', '立直', '門前清自摸和', '一発']
    const v131ImportantRoles = result.roleNameCheck.v131.filter(r => importantRoles.includes(r))
    const v140ImportantRoles = result.roleNameCheck.v140.filter(r => importantRoles.includes(r))
    
    if (v131ImportantRoles.length === v140ImportantRoles.length) {
      result.roleNameCheck.matches = true
      result.roleNameCheck.details.push('✅ 主要な役名が一致')
    } else {
      result.roleNameCheck.details.push('❌ 役名に差異あり')
    }
    
    // タイトル形式チェック
    result.titleFormatCheck.v131Format = extractTitle(v131JsonPath)
    result.titleFormatCheck.v140Format = extractTitle(v140JsonPath)
    
    // ptEVの存在確認
    if (result.titleFormatCheck.v140Format && Array.isArray(result.titleFormatCheck.v140Format)) {
      if (result.titleFormatCheck.v140Format.length === 2) {
        const secondElement = result.titleFormatCheck.v140Format[1]
        if (typeof secondElement === 'string' && secondElement.includes('[') && secondElement.includes(']')) {
          result.titleFormatCheck.hasPtEV = true
          result.titleFormatCheck.details.push('✅ ptEV情報を含む')
        }
      }
    }
    
    if (!result.titleFormatCheck.hasPtEV) {
      result.titleFormatCheck.details.push('❌ ptEV情報なし')
    }
    
    // 総合評価
    if (result.roleNameCheck.matches && result.titleFormatCheck.hasPtEV) {
      result.overallStatus = 'PASS'
    } else if (result.roleNameCheck.matches || result.titleFormatCheck.hasPtEV) {
      result.overallStatus = 'PARTIAL'
    }
  }
  
  return result
}

function main() {
  console.log('=== 詳細変換分析レポート ===\n')
  
  const testFiles = ['9tiles', 'cant_mortal_input', 'kazoe_yakuman', 'riichi_sengen_ron', 'url_encode_replace']
  const results: ComparisonResult[] = []
  
  for (const filename of testFiles) {
    console.log(`\n📁 ${filename}`)
    const result = analyzeFile(filename)
    results.push(result)
    
    // 役名チェック結果
    console.log('\n  🀄 役名チェック:')
    console.log(`    v1.3.1: ${result.roleNameCheck.v131.slice(0, 3).join(', ')}${result.roleNameCheck.v131.length > 3 ? '...' : ''}`)
    console.log(`    v1.4.0: ${result.roleNameCheck.v140.slice(0, 3).join(', ')}${result.roleNameCheck.v140.length > 3 ? '...' : ''}`)
    result.roleNameCheck.details.forEach(d => console.log(`    ${d}`))
    
    // タイトル形式チェック結果
    console.log('\n  📋 タイトル形式:')
    console.log(`    v1.3.1: ${JSON.stringify(result.titleFormatCheck.v131Format).slice(0, 50)}...`)
    console.log(`    v1.4.0: ${JSON.stringify(result.titleFormatCheck.v140Format).slice(0, 50)}...`)
    result.titleFormatCheck.details.forEach(d => console.log(`    ${d}`))
    
    // 総合結果
    console.log(`\n  📊 総合評価: ${
      result.overallStatus === 'PASS' ? '✅ PASS' :
      result.overallStatus === 'PARTIAL' ? '⚠️ PARTIAL' :
      '❌ FAIL'
    }`)
  }
  
  // サマリー
  console.log('\n' + '='.repeat(50))
  console.log('\n📊 最終結果サマリー:\n')
  
  const passCount = results.filter(r => r.overallStatus === 'PASS').length
  const partialCount = results.filter(r => r.overallStatus === 'PARTIAL').length
  const failCount = results.filter(r => r.overallStatus === 'FAIL').length
  
  console.log(`  ✅ PASS: ${passCount}/${results.length} ファイル`)
  console.log(`  ⚠️ PARTIAL: ${partialCount}/${results.length} ファイル`)
  console.log(`  ❌ FAIL: ${failCount}/${results.length} ファイル`)
  
  if (passCount === results.length) {
    console.log('\n🎉 全てのテストファイルで修正が正しく適用されています！')
  } else if (passCount > 0) {
    console.log('\n⚠️ 一部のファイルで修正が不完全です。')
  } else {
    console.log('\n❌ 修正が正しく適用されていません。')
  }
}

main()