import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, '../strava_test.html');
if (!fs.existsSync(htmlPath)) {
  console.error('strava_test.html does not exist');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

console.log('--- HTML Length:', html.length);

// 1. table タグの検索
const tables = html.match(/<table[\s\S]*?<\/table>/g) || [];
console.log(`Found ${tables.length} tables`);
tables.forEach((t, idx) => {
  console.log(`Table ${idx} (Length: ${t.length}):`, t.substring(0, 400));
});

// 2. "split" や "splits" などのテキストを含む div や section の検索
const divs = html.match(/<div[^>]*class="[^"]*split[^"]*"[\s\S]*?<\/div>/g) || [];
console.log(`Found ${divs.length} divs with split class`);
divs.forEach((d, idx) => {
  console.log(`Div ${idx}:`, d.substring(0, 200));
});

// 3. 数字の羅列（スプリットデータ）の検索
// 1km 5:58 などのテキストのパターンがあるか
const splitsSection = html.match(/class="[^"]*splits[^"]*"[\s\S]*?<\/div>/g) || [];
console.log(`Found ${splitsSection.length} splits sections`);

// 4. NEXT_DATA 内に splits キーがないか再帰的に検索
const matchNext = html.match(/id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
if (matchNext) {
  const data = JSON.parse(matchNext[1]);
  const pageProps = data.props.pageProps;
  
  // pagePropsオブジェクト内の全キーを再帰的にチェックして "splits" または "laps" を探す
  const findKeys = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      if (key.toLowerCase().includes('split') || key.toLowerCase().includes('lap')) {
        console.log(`FOUND KEY IN JSON: ${currentPath} =`, typeof obj[key] === 'object' ? '[Object]' : obj[key]);
      }
      findKeys(obj[key], currentPath);
    });
  };
  
  console.log('Searching JSON properties for split/lap...');
  findKeys(pageProps);
}
