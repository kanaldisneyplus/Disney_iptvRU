const fs = require('fs');
const path = require('path');

const VK_LIVE_URL = 'https://live.vkvideo.ru/disney';

// Список записей эфиров с VK Live
const VK_RECORDINGS = [
  'https://live.vkvideo.ru/disney/record/08cc7a20-dd4d-4ae6-a8d7-97615fa91309/records',
  'https://live.vkvideo.ru/disney/record/ad5ad370-9d89-4326-bc23-338837ad272b',
  'https://live.vkvideo.ru/disney/record/872763d6-2ae4-484f-ae81-299e81922328',
  'https://live.vkvideo.ru/disney/record/8e9f0a5a-5b36-4234-925d-3532b699bb0c',
  'https://live.vkvideo.ru/disney/record/1f7e1e26-2729-4208-924f-22236cc5c4cb'
];

const OUTPUT_DIR = path.join(__dirname, 'disney_channel');
const INDEX_M3U8 = path.join(OUTPUT_DIR, 'index.m3u8');

// Парсер HLS-ссылок из страниц VK
async function getVkHlsStream(url) {
  try {
    const response = await fetch(url, {
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
    console.error(`Ошибка парсинга ${url}:`, err.message);
  }
  return null;
}

async function update() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Проверяем прямой эфир
  let targetStreamUrl = await getVkHlsStream(VK_LIVE_URL);

  if (targetStreamUrl) {
    console.log(' [ONLINE] Прямой эфир VK активен:', targetStreamUrl);
  } else {
    console.log(' [OFFLINE] Прямой эфир недоступен. Выбираем одну из 5 записей VK...');
    
    // Выбираем случайную запись из вашего списка
    const selectedRecordUrl = VK_RECORDINGS[Math.floor(Math.random() * VK_RECORDINGS.length)];
    console.log(' Пробуем загрузить запись:', selectedRecordUrl);
    
    targetStreamUrl = await getVkHlsStream(selectedRecordUrl);

    // Если вдруг не удалось распарсить запись, в качестве аварийного варианта берем локальный offline.ts
    if (!targetStreamUrl) {
      console.log(' [FALLBACK] Не удалось достать поток записи VK. Подключаем offline.ts');
      targetStreamUrl = 'https://raw.githubusercontent.com/kanaldisneyplus/Disney_iptvRU/main/offline.ts';
    }
  }

  // Записываем итоговый файл index.m3u8
  const m3u8Content = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=2000000\n${targetStreamUrl}\n`;

  fs.writeFileSync(INDEX_M3U8, m3u8Content, 'utf8');
  console.log(' [DONE] Плейлист обновлен!');
}

update();
