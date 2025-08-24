#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
class ConversionDiffAnalyzer {
    testDir;
    v131Dir;
    v140Dir;
    constructor(testDir = 'tests/replace_tests') {
        this.testDir = testDir;
        this.v131Dir = join(testDir, '1.3.1');
        this.v140Dir = join(testDir, '1.4.0');
    }
    /**
     * メイン分析処理
     */
    analyze() {
        console.log('=== Mahjong Soul Conversion Diff Analysis ===\n');
        // ディレクトリ存在チェック
        if (!this.checkDirectories()) {
            return;
        }
        // ファイル一覧取得
        const files = this.getTestFiles();
        console.log(`Found ${files.length} test files to analyze\n`);
        // 各ファイルの分析
        const results = [];
        for (const filename of files) {
            console.log(`Analyzing: ${filename}`);
            const analysis = this.analyzeFile(filename);
            results.push(analysis);
            this.printFileReport(analysis);
            console.log('');
        }
        // 総合レポート出力
        this.printSummaryReport(results);
        // 詳細レポートをファイルに出力
        this.writeDetailedReport(results);
    }
    /**
     * ディレクトリ存在チェック
     */
    checkDirectories() {
        if (!existsSync(this.v131Dir)) {
            console.error(`Error: Directory not found: ${this.v131Dir}`);
            return false;
        }
        if (!existsSync(this.v140Dir)) {
            console.error(`Error: Directory not found: ${this.v140Dir}`);
            return false;
        }
        return true;
    }
    /**
     * テストファイル一覧取得
     */
    getTestFiles() {
        const v131Files = readdirSync(this.v131Dir)
            .filter((f) => f.endsWith('.json'))
            .map((f) => f.replace('.json', ''));
        const v140Files = readdirSync(this.v140Dir)
            .filter((f) => f.endsWith('.json'))
            .map((f) => f.replace('.json', ''));
        // 両バージョンに存在するファイルのみ
        return v131Files.filter((f) => v140Files.includes(f));
    }
    /**
     * 個別ファイル分析
     */
    analyzeFile(filename) {
        const analysis = {
            filename,
            v131: { jsonExists: false, mdExists: false, urlCount: 0, urls: [] },
            v140: { jsonExists: false, nagaUrlsExists: false, urlCount: 0, urls: [] },
            differences: { urlCountDiff: 0, contentDifferences: [], issues: [] }
        };
        // 1.3.1の分析
        this.analyzeV131File(filename, analysis);
        // 1.4.0の分析
        this.analyzeV140File(filename, analysis);
        // 差分分析
        this.analyzeDifferences(analysis);
        return analysis;
    }
    /**
     * 1.3.1ファイル分析
     */
    analyzeV131File(filename, analysis) {
        const jsonPath = join(this.v131Dir, `${filename}.json`);
        const mdPath = join(this.v131Dir, `${filename}.md`);
        // JSON存在チェック
        if (existsSync(jsonPath)) {
            analysis.v131.jsonExists = true;
        }
        // MD存在チェック
        if (existsSync(mdPath)) {
            analysis.v131.mdExists = true;
            try {
                const mdContent = readFileSync(mdPath, 'utf-8');
                const urls = mdContent.trim().split('\n').filter((line) => line.startsWith('https://'));
                analysis.v131.urls = urls;
                analysis.v131.urlCount = urls.length;
            }
            catch (error) {
                analysis.differences.issues.push(`Failed to read ${filename}.md: ${error}`);
            }
        }
    }
    /**
     * 1.4.0ファイル分析
     */
    analyzeV140File(filename, analysis) {
        const jsonPath = join(this.v140Dir, `${filename}.json`);
        if (existsSync(jsonPath)) {
            analysis.v140.jsonExists = true;
            try {
                const jsonContent = readFileSync(jsonPath, 'utf-8');
                const data = JSON.parse(jsonContent);
                if (data.nagaUrls && Array.isArray(data.nagaUrls)) {
                    analysis.v140.nagaUrlsExists = true;
                    analysis.v140.urls = data.nagaUrls;
                    analysis.v140.urlCount = data.nagaUrls.length;
                }
            }
            catch (error) {
                analysis.differences.issues.push(`Failed to parse ${filename}.json: ${error}`);
            }
        }
    }
    /**
     * 差分分析
     */
    analyzeDifferences(analysis) {
        // URL数の差分
        analysis.differences.urlCountDiff = analysis.v140.urlCount - analysis.v131.urlCount;
        if (analysis.differences.urlCountDiff !== 0) {
            analysis.differences.issues.push(`URL count mismatch: v1.3.1=${analysis.v131.urlCount}, v1.4.0=${analysis.v140.urlCount}`);
        }
        // URL内容の比較（デコード後）
        if (analysis.v131.urls.length > 0 && analysis.v140.urls.length > 0) {
            this.compareUrls(analysis);
        }
        // ファイル存在チェック
        if (!analysis.v131.mdExists && !analysis.v140.nagaUrlsExists) {
            analysis.differences.issues.push('No URL data found in either version');
        }
        if (analysis.v131.mdExists && !analysis.v140.nagaUrlsExists) {
            analysis.differences.issues.push('v1.3.1 has MD file but v1.4.0 has no nagaUrls');
        }
        if (!analysis.v131.mdExists && analysis.v140.nagaUrlsExists) {
            analysis.differences.issues.push('v1.4.0 has nagaUrls but v1.3.1 has no MD file');
        }
    }
    /**
     * URL内容比較
     */
    compareUrls(analysis) {
        const v131Decoded = analysis.v131.urls;
        const v140Decoded = analysis.v140.urls.map(url => decodeURIComponent(url));
        const minLength = Math.min(v131Decoded.length, v140Decoded.length);
        for (let i = 0; i < minLength; i++) {
            const v131Url = v131Decoded[i];
            const v140Url = v140Decoded[i];
            if (v131Url !== v140Url) {
                analysis.differences.contentDifferences.push(`Game ${i + 1}: URLs differ`);
                // より詳細な比較を追加
                const v131JsonParam = this.extractJsonParam(v131Url);
                const v140JsonParam = this.extractJsonParam(v140Url);
                if (v131JsonParam && v140JsonParam) {
                    try {
                        const v131Data = JSON.parse(v131JsonParam);
                        const v140Data = JSON.parse(v140JsonParam);
                        if (JSON.stringify(v131Data) !== JSON.stringify(v140Data)) {
                            analysis.differences.contentDifferences.push(`Game ${i + 1}: JSON content differs`);
                        }
                        else {
                            analysis.differences.contentDifferences.push(`Game ${i + 1}: URLs differ but JSON content is identical`);
                        }
                    }
                    catch (error) {
                        analysis.differences.contentDifferences.push(`Game ${i + 1}: Failed to parse JSON parameters`);
                    }
                }
            }
        }
    }
    /**
     * URLからJSONパラメーターを抽出
     */
    extractJsonParam(url) {
        try {
            const urlObj = new URL(url);
            const jsonParam = urlObj.hash.replace('#json=', '');
            return jsonParam ? decodeURIComponent(jsonParam) : null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * 個別ファイルレポート出力
     */
    printFileReport(analysis) {
        console.log(`  v1.3.1: JSON=${analysis.v131.jsonExists}, MD=${analysis.v131.mdExists}, URLs=${analysis.v131.urlCount}`);
        console.log(`  v1.4.0: JSON=${analysis.v140.jsonExists}, nagaUrls=${analysis.v140.nagaUrlsExists}, URLs=${analysis.v140.urlCount}`);
        if (analysis.differences.urlCountDiff !== 0) {
            console.log(`  ⚠️  URL count difference: ${analysis.differences.urlCountDiff > 0 ? '+' : ''}${analysis.differences.urlCountDiff}`);
        }
        if (analysis.differences.contentDifferences.length > 0) {
            console.log(`  ⚠️  Content differences found:`);
            analysis.differences.contentDifferences.forEach((diff, index) => {
                if (index < 3) { // 最初の3つのみ表示
                    console.log(`    - ${diff}`);
                }
            });
            if (analysis.differences.contentDifferences.length > 3) {
                console.log(`    ... and ${analysis.differences.contentDifferences.length - 3} more`);
            }
        }
        if (analysis.differences.issues.length > 0) {
            console.log('  🚨 Issues:');
            analysis.differences.issues.forEach(issue => console.log(`    - ${issue}`));
        }
    }
    /**
     * 総合レポート出力
     */
    printSummaryReport(results) {
        console.log('=== SUMMARY REPORT ===');
        const totalFiles = results.length;
        const filesWithIssues = results.filter(r => r.differences.issues.length > 0).length;
        const filesWithUrlCountDiff = results.filter(r => r.differences.urlCountDiff !== 0).length;
        const filesWithContentDiff = results.filter(r => r.differences.contentDifferences.length > 0).length;
        console.log(`Total files analyzed: ${totalFiles}`);
        console.log(`Files with issues: ${filesWithIssues}`);
        console.log(`Files with URL count differences: ${filesWithUrlCountDiff}`);
        console.log(`Files with content differences: ${filesWithContentDiff}`);
        if (filesWithIssues > 0) {
            console.log('\n🚨 Files with issues:');
            results
                .filter(r => r.differences.issues.length > 0)
                .forEach(r => {
                console.log(`  ${r.filename}: ${r.differences.issues.length} issues`);
            });
        }
        console.log('\n📊 Migration Analysis:');
        if (filesWithIssues === 0) {
            console.log('  ✅ All files migrated successfully');
        }
        else {
            console.log(`  ⚠️  ${filesWithIssues}/${totalFiles} files have migration issues`);
        }
    }
    /**
     * 詳細レポートをファイルに出力
     */
    writeDetailedReport(results) {
        const reportLines = [];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = `conversion-diff-report-${timestamp}.md`;
        reportLines.push('# Mahjong Soul Conversion Diff Analysis Report');
        reportLines.push(`Generated at: ${new Date().toISOString()}`);
        reportLines.push('');
        reportLines.push('## Summary');
        reportLines.push(`- Total files: ${results.length}`);
        reportLines.push(`- Files with issues: ${results.filter(r => r.differences.issues.length > 0).length}`);
        reportLines.push(`- Files with URL count differences: ${results.filter(r => r.differences.urlCountDiff !== 0).length}`);
        reportLines.push(`- Files with content differences: ${results.filter(r => r.differences.contentDifferences.length > 0).length}`);
        reportLines.push('');
        reportLines.push('## Detailed Analysis');
        results.forEach(analysis => {
            reportLines.push(`### ${analysis.filename}`);
            reportLines.push(`- v1.3.1: JSON=${analysis.v131.jsonExists}, MD=${analysis.v131.mdExists}, URLs=${analysis.v131.urlCount}`);
            reportLines.push(`- v1.4.0: JSON=${analysis.v140.jsonExists}, nagaUrls=${analysis.v140.nagaUrlsExists}, URLs=${analysis.v140.urlCount}`);
            if (analysis.differences.urlCountDiff !== 0) {
                reportLines.push(`- ⚠️ URL count difference: ${analysis.differences.urlCountDiff}`);
            }
            if (analysis.differences.contentDifferences.length > 0) {
                reportLines.push(`- Content differences (${analysis.differences.contentDifferences.length}):`);
                analysis.differences.contentDifferences.forEach(diff => {
                    reportLines.push(`  - ${diff}`);
                });
            }
            if (analysis.differences.issues.length > 0) {
                reportLines.push(`- Issues:`);
                analysis.differences.issues.forEach(issue => {
                    reportLines.push(`  - ${issue}`);
                });
            }
            reportLines.push('');
        });
        try {
            writeFileSync(reportPath, reportLines.join('\n'));
            console.log(`\n📄 Detailed report written to: ${reportPath}`);
        }
        catch (error) {
            console.error(`\n❌ Failed to write detailed report: ${error}`);
        }
    }
}
// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new ConversionDiffAnalyzer();
    analyzer.analyze();
}
export { ConversionDiffAnalyzer };
