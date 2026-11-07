import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

// Auto sync generated assets directly on config evaluation and on build/dev start
function syncAssetsNow() {
  try {
    const brainDir = 'C:/Users/Forgeindiaconnect/.gemini/antigravity/brain/fb582fb9-2b2b-411c-ac43-40149f4c94a9'
    const assetsDir = path.resolve(__dirname, 'src/assets')
    const publicDir = path.resolve(__dirname, 'public')
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true })
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

    const syncList = [
      { src: path.join(brainDir, 'sidebar_abstract_blue_waves_1794046512095.jpg'), names: ['sidebar-waves-bg.jpg', 'sidebar_abstract_blue_waves.jpg'] },
      { src: path.join(brainDir, 'grocery_basket_3d_1794046555765.jpg'), names: ['grocery-basket-3d.jpg', 'grocery_basket_3d.jpg'] },
      { src: path.join(brainDir, 'storefront_3d_supermarket_1794046532029.jpg'), names: ['storefront-3d.jpg', 'storefront_3d.jpg'] },
      { src: path.join(brainDir, 'dashboard_hero_banner_art_1794046675903.jpg'), names: ['hero-banner-art.jpg', 'dashboard_hero_banner_art.jpg'] },
      { src: path.join(brainDir, 'dashboard_hero_fresh_cart_aisle_1794053392050.jpg'), names: ['dashboard-hero-fresh-cart.jpg', 'hero-aisle-cart.jpg'] },
      { src: path.join(brainDir, 'blue_shopping_bag_3d_1794053871902.jpg'), names: ['blue-shopping-bag-3d.jpg'] },
      { src: path.join(brainDir, 'gift_box_3d_icon_1794053425724.jpg'), names: ['gift-box-3d.jpg'] },
    ]

    for (const item of syncList) {
      if (fs.existsSync(item.src)) {
        for (const name of item.names) {
          fs.copyFileSync(item.src, path.join(assetsDir, name))
          fs.copyFileSync(item.src, path.join(publicDir, name))
        }
      }
    }
  } catch (err) {
    console.warn('Asset copy warning:', err.message)
  }
}

syncAssetsNow()

function syncAssetsPlugin() {
  return {
    name: 'auto-sync-assets',
    buildStart() {
      syncAssetsNow()
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), syncAssetsPlugin()],
  server: {
    fs: {
      strict: false,
      allow: ['..', 'C:/Users/Forgeindiaconnect/.gemini'],
    },
  },
})

