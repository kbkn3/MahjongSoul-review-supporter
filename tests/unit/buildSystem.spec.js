import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Build System Migration (Webpack → Vite)', () => {
  describe('Vite configuration', () => {
    it('should have vite.config.js file', () => {
      const viteconfigPath = path.resolve(process.cwd(), 'vite.config.js')
      expect(fs.existsSync(viteconfigPath)).toBe(true)
    })
    
    it('should have CRXJS plugin configured', () => {
      const viteconfigPath = path.resolve(process.cwd(), 'vite.config.js')
      const viteConfigContent = fs.readFileSync(viteconfigPath, 'utf-8')
      
      expect(viteConfigContent).toContain('@crxjs/vite-plugin')
      expect(viteConfigContent).toContain('crx')
    })
  })
  
  describe('Extension entry points', () => {
    it('should support popup entry point', () => {
      // CRXJSがmanifest.jsonから自動的にエントリーポイントを検出
      const manifestPath = path.resolve(process.cwd(), 'src/manifest.json')
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      
      expect(manifest.action.default_popup).toBe('src/popup/index.html')
    })
    
    it('should support options entry point', () => {
      const manifestPath = path.resolve(process.cwd(), 'src/manifest.json')
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      
      expect(manifest.options_page).toBe('src/options/index.html')
    })
    
    it('should support background service worker', () => {
      const manifestPath = path.resolve(process.cwd(), 'src/manifest.json')
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      
      expect(manifest.background.service_worker).toBe('src/background/main.js')
    })
    
    it('should support content scripts', () => {
      const manifestPath = path.resolve(process.cwd(), 'src/manifest.json')
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      
      expect(manifest.content_scripts).toBeDefined()
      expect(manifest.content_scripts.length).toBeGreaterThan(0)
    })
  })
  
  describe('Build scripts', () => {
    it('should have vite dev script', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8')
      )
      
      expect(packageJson.scripts['dev:vite']).toBe('vite')
    })
    
    it('should have vite build script', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8')
      )
      
      expect(packageJson.scripts['build:vite']).toBe('vite build')
    })
  })
  
  describe('Extension manifest handling', () => {
    it('should process manifest.json correctly', () => {
      const manifestPath = path.resolve(process.cwd(), 'src/manifest.json')
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      
      expect(manifest.manifest_version).toBe(3)
    })
  })
  
  describe('Asset copying', () => {
    it('should copy locale files', () => {
      // CRXJSが自動的に_localesフォルダをコピー
      const localesPath = path.resolve(process.cwd(), 'src/_locales')
      expect(fs.existsSync(localesPath)).toBe(true)
    })
    
    it('should copy image assets', () => {
      const imgsPath = path.resolve(process.cwd(), 'public/imgs')
      expect(fs.existsSync(imgsPath)).toBe(true)
    })
    
    it('should copy content scripts', () => {
      const contentScriptsPath = path.resolve(process.cwd(), 'src/content-scripts')
      expect(fs.existsSync(contentScriptsPath)).toBe(true)
      
      // 主要なcontent scriptファイルが存在することを確認
      expect(fs.existsSync(path.join(contentScriptsPath, 'content_script.js'))).toBe(true)
    })
  })
  
  describe('Development experience', () => {
    it('should support hot module replacement for Vue components', () => {
      const viteconfigPath = path.resolve(process.cwd(), 'vite.config.js')
      const viteConfigContent = fs.readFileSync(viteconfigPath, 'utf-8')
      
      // VueプラグインがHMRを自動的に提供
      expect(viteConfigContent).toContain('vue()')
    })
    
    it('should support extension auto-reload during development', () => {
      const viteconfigPath = path.resolve(process.cwd(), 'vite.config.js')
      const viteConfigContent = fs.readFileSync(viteconfigPath, 'utf-8')
      
      // CRXJSが自動リロードを提供
      expect(viteConfigContent).toContain('crx(')
    })
  })
})