const fs = require('fs');
const path = require('path');

const VK_LIVE_URL = 'https://live.vkvideo.ru/disney';
const OFFLINE_FALLBACK = 'https://raw.githubusercontent.com/kanaldisneyplus/Disney_iptvRU/main/offline.ts';

const OUTPUT_DIR = path.join(__dirname, 'disney_channel');
const INDEX_M3U8 = path.join(OUTPUT_DIR, 'index.m3u8');

async function getVkLiveStream() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(VK_LIVE_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      const match = html.match(/(https?:\\?\/\\?[^"]+?\.m3u8[^"]*)/i);
      if (match) {
        return match[1].replace(/\\/g, '');
      }
    }
  } catch (err) {
    console.error('Эфир VK не обнаружен:', err.message);
  }
  return null;
}

async function update() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const liveStreamUrl = await getVkLiveStream();
  let m3u8Content = '';

  if (liveStreamUrl) {
    console.log(' [ONLINE] Найдена прямая трансляция VK:', liveStreamUrl);
    m3u8Content = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=2000000\n${liveStreamUrl}\n`;
  } else {
    console.log(' [OFFLINE] Эфир выключен. Подключаем оффлайн-резерв.');
    m3u8Content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
${OFFLINE_FALLBACK}
#EXTINF:10.0,
${OFFLINE_FALLBACK}
`;
  }

  fs.writeFileSync(INDEX_M3U8, m3u8Content, 'utf8');
  console.log(' [SUCCESS] Файл disney_channel/index.m3u8 успешно сформирован.');
}

update();
