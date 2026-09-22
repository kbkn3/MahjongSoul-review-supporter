import { defineConfig } from "wxt";

export default defineConfig({
    srcDir: "src",
    modules: ["@wxt-dev/module-vue"],
    manifest: ({ mode }) => ({
        name: "__MSG_appName__",
        version: "1.6.0",
        description: "__MSG_appDesc__",
        author: "kbkn",
        default_locale: "en",
        icons: {
            48: "imgs/extension_icon48.png",
            128: "imgs/extension_icon128.png",
        },
        permissions: ["storage"],
        content_security_policy: {
            // 開発モードは Vite が CSS を <style> タグとして inline 注入するため
            // style-src に 'unsafe-inline' が必要(本番ビルドは別ファイルに抽出されるため不要)
            extension_pages:
                mode === "development"
                    ? "script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com"
                    : "script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com",
        },
        host_permissions: [
            "https://game.mahjongsoul.com/*",
            "https://mahjongsoul.game.yo-star.com/*",
            "https://game.maj-soul.net/*",
            "https://game.maj-soul.com/*",
            "https://naga.dmv.nico/naga_report/order_form/",
            "https://mjai.ekyu.moe/",
        ],
    }),
});
