const fs = require('fs');
const path = require('path');

const VK_CHANNEL_URL = 'https://live.vkvideo.ru/disney';

// Прямая ссылка на ваш готовый HLS-плейлист с кусочками .ts
const OFFLINE_HLS_URL = 'https://raw.githubusercontent.com/kanaldisneyplus/Disney_iptvRU/main/hls/playlist.m3u8';

const OUTPUT_DIR = path.join(__dirname, 'disney_channel');
const INDEX_M3U8 = path.join(OUTPUT_DIR, 'index.m3u8');

async function getVkLiveStream() {
  try {
    const response = await fetch(VK_CHANNEL_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9'
      }
    });

    if (response.ok) {
      const html = await response.text();
      const match = html.match(/(https?:\\?\/\\?[^"]+?\.m3u8[^"]*)/i);
      if (match) {
        return match[1].replace(/\\/g, '');
      }
    }
  } catch (err) {
    console.error('Ошибка запроса VK:', err.message);
  }
  return null;
}

async function update() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const activeStreamUrl = await getVkLiveStream();
  const streamUrl = activeStreamUrl ? activeStreamUrl : OFFLINE_HLS_URL;

  const m3u8Content = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=2000000\n${streamUrl}\n`;

  fs.writeFileSync(INDEX_M3U8, m3u8Content, 'utf8');
  console.log(' [DONE] Плейлист обновлен!');
}

update();
