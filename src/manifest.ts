import type { PlasmoChromeManifest } from "plasmo"

const manifest: PlasmoChromeManifest = {
  // ...既存の設定
  content_scripts: [
    {
      matches: ["https://naga.dmv.nico/naga_report/order_form/*"],
      js: ["src/contents/naga.ts"]
    }
  ],
  permissions: [
    "storage",
    "tabs"
  ],
  host_permissions: [
    "https://naga.dmv.nico/*"
  ]
}

export default manifest 