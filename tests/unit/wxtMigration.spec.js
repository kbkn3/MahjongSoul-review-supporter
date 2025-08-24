import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('WXT Framework Migration (CRXJS → WXT)', () => {
  describe('WXT configuration', () => {
    it('should have wxt.config.ts file', () => {
      const wxtConfigPath = path.resolve(process.cwd(), 'wxt.config.ts')
      expect(fs.existsSync(wxtConfigPath)).toBe(true)
    })
    
    it('should have WXT dependencies in package.json', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8')
      )
      
      expect(packageJson.devDependencies?.wxt).toBeDefined()
    })
    
    it('should have WXT development scripts', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8')
      )
      
      expect(packageJson.scripts['dev']).toBe('wxt')
      expect(packageJson.scripts['build']).toBe('wxt build')
      expect(packageJson.scripts['prepare']).toBe('wxt prepare')
    })
  })
  
  describe('File-based entrypoints', () => {
    it('should have popup entrypoint structure', () => {
      const popupEntryPath = path.resolve(process.cwd(), 'entrypoints/popup')
      expect(fs.existsSync(popupEntryPath)).toBe(true)
      
      const popupHtmlPath = path.resolve(popupEntryPath, 'index.html')
      const popupMainPath = path.resolve(popupEntryPath, 'main.ts')
      expect(fs.existsSync(popupHtmlPath)).toBe(true)
      expect(fs.existsSync(popupMainPath)).toBe(true)
    })
    
    it('should have options entrypoint structure', () => {
      const optionsEntryPath = path.resolve(process.cwd(), 'entrypoints/options')
      expect(fs.existsSync(optionsEntryPath)).toBe(true)
      
      const optionsHtmlPath = path.resolve(optionsEntryPath, 'index.html')
      const optionsMainPath = path.resolve(optionsEntryPath, 'main.ts')
      expect(fs.existsSync(optionsHtmlPath)).toBe(true)
      expect(fs.existsSync(optionsMainPath)).toBe(true)
    })
    
    it('should have background entrypoint', () => {
      const backgroundEntryPath = path.resolve(process.cwd(), 'entrypoints/background.ts')
      expect(fs.existsSync(backgroundEntryPath)).toBe(true)
    })
    
    it('should have content script entrypoints', () => {
      const entrypointsPath = path.resolve(process.cwd(), 'entrypoints')
      expect(fs.existsSync(entrypointsPath)).toBe(true)
      
      const mjSoulContentPath = path.resolve(entrypointsPath, 'majsoul.content.ts')
      const nagaContentPath = path.resolve(entrypointsPath, 'naga.content.ts')
      const mjaiContentPath = path.resolve(entrypointsPath, 'mjai.content.ts')
      
      expect(fs.existsSync(mjSoulContentPath)).toBe(true)
      expect(fs.existsSync(nagaContentPath)).toBe(true)
      expect(fs.existsSync(mjaiContentPath)).toBe(true)
    })
  })
  
  describe('WXT auto-imports', () => {
    it('should have TypeScript types configuration', () => {
      const tsConfigPath = path.resolve(process.cwd(), 'tsconfig.json')
      expect(fs.existsSync(tsConfigPath)).toBe(true)
      
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'))
      expect(tsConfig.compilerOptions?.paths?.['#imports']).toBeDefined()
    })
  })
  
  describe('TypeScript integration', () => {
    it('should have TypeScript configuration for WXT', () => {
      const tsConfigPath = path.resolve(process.cwd(), 'tsconfig.json')
      expect(fs.existsSync(tsConfigPath)).toBe(true)
      
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'))
      // WXT uses .wxt/wxt.d.ts for type definitions instead of wxt/client-types
      expect(tsConfig.include).toContain('.wxt/wxt.d.ts')
    })
  })
  
  describe('WXT configuration', () => {
    it('should have manifest configuration in wxt.config.ts', () => {
      const wxtConfigPath = path.resolve(process.cwd(), 'wxt.config.ts')
      expect(fs.existsSync(wxtConfigPath)).toBe(true)
      
      // wxt.config.tsが読み込めることを確認
      const configContent = fs.readFileSync(wxtConfigPath, 'utf-8')
      expect(configContent).toContain('manifest')
      expect(configContent).toContain('defineConfig')
    })
    
    it('should have outDir configuration for WXT', () => {
      const wxtConfigPath = path.resolve(process.cwd(), 'wxt.config.ts')
      const configContent = fs.readFileSync(wxtConfigPath, 'utf-8')
      expect(configContent).toContain('outDir')
    })
  })
})