import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "__MSG_appName__",
  version: "1.1.3",
  description: "__MSG_appDesc__",
  author: "kbkn",
  icons: {
    48: "imgs/extension_icon48.png",
    128: "imgs/extension_icon128.png",
  },
  default_locale: "en",
  content_scripts: [
    {
      matches: [
        "https://game.mahjongsoul.com/*",
        "https://mahjongsoul.game.yo-star.com/*",
        "https://game.maj-soul.net/*",
        "https://game.maj-soul.com/*",
      ],
      js: ["src/content-scripts/content_script.js"],
    },
    {
      matches: ["https://naga.dmv.nico/naga_report/order_form/"],
      js: ["src/content-scripts/content_script_naga.js"],
    },
    {
      matches: ["https://mjai.ekyu.moe/"],
      js: ["src/content-scripts/content_script_mjai.js"],
    },
  ],
  action: {
    default_popup: "src/popup/popup.html",
  },
  background: { service_worker: "src/background/main.js" },
  permissions: ["storage"],
  host_permissions: [
    "https://game.mahjongsoul.com/*",
    "https://mahjongsoul.game.yo-star.com/*",
    "https://game.maj-soul.net/*",
    "https://game.maj-soul.com/*",
    "https://naga.dmv.nico/naga_report/order_form/",
    "https://mjai.ekyu.moe/",
  ],
  options_page: "src/options/options.html",
  web_accessible_resources: [
    {
      resources: ["src/content-scripts/dd.js", "src/content-scripts/event.js"],
      matches: [
        "https://game.mahjongsoul.com/*",
        "https://mahjongsoul.game.yo-star.com/*",
        "https://game.maj-soul.net/*",
        "https://game.maj-soul.com/*",
      ],
      use_dynamic_url: true,
    },
  ],
});
