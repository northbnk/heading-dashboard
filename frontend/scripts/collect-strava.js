import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1PgHvfRXUPPLRvlhOMPSmm14Xuupx0wOnb4MqVEeoPF0/export?format=csv&gid=0';
const DETAILS_FILE = path.join(__dirname, '../public/data/strava_details.json');
const COOKIE_FILE = path.join(__dirname, '../strava_cookie.txt');
const CONFIG_FILE = path.join(__dirname, '../strava_config.json');

// 保存先ディレクトリの作成
const dir = path.dirname(DETAILS_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// ユーザーがログイン情報を登録するテンプレート構成ファイルを作成 (存在しない場合)
if (!fs.existsSync(CONFIG_FILE)) {
  const defaultConfig = {
    email: "YOUR_STRAVA_EMAIL",
    password: "YOUR_STRAVA_PASSWORD"
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf8');
  console.log(`Created default Strava config template at strava_config.json. Please enter your Strava login credentials there.`);
}

// キャッシュされたCookieを読み込む
let stravaCookie = '';
if (fs.existsSync(COOKIE_FILE)) {
  try {
    stravaCookie = fs.readFileSync(COOKIE_FILE, 'utf8').trim();
  } catch (err) {
    console.warn('Failed to read cached cookie:', err.message);
  }
}

// 自動ログイン処理
const loginToStrava = (email, password) => {
  return new Promise(async (resolve, reject) => {
    console.log('Attempting automatic login to Strava...');
    try {
      // 1. ログインページからCSRFトークン(authenticity_token)を取得
      const loginHtml = await fetchText('https://www.strava.com/login');
      const tokenMatch = loginHtml.match(/name="authenticity_token"\s+value="([^"]+)"/) || 
                         loginHtml.match(/value="([^"]+)"\s+name="authenticity_token"/);
      
      if (!tokenMatch) {
        reject(new Error('Could not find CSRF authenticity_token on Strava login page.'));
        return;
      }
      const token = tokenMatch[1];
      
      // 2. ログインPOSTパラメータを組み立て
      const postData = new URLSearchParams({
        utf8: '✓',
        authenticity_token: token,
        email: email,
        password: password,
        remember_me: 'on'
      }).toString();

      // 3. ログインセッションポストを送信
      const req = https.request('https://www.strava.com/session', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        // ログイン成功時は通常ダッシュボード等にリダイレクトされる (302)
        const cookies = res.headers['set-cookie'] || [];
        const sessionCookie = cookies.find(c => c.startsWith('_strava4_session='));
        
        if (sessionCookie) {
          const cookieVal = sessionCookie.split(';')[0];
          // 新しいCookieをキャッシュファイルに保存
          fs.writeFileSync(COOKIE_FILE, cookieVal, 'utf8');
          console.log('-> Login successful! Cookie cached to strava_cookie.txt.');
          resolve(cookieVal);
        } else {
          reject(new Error('Login request completed but session cookie was not returned. Check email/password.'));
        }
      });

      req.on('error', (err) => reject(err));
      req.write(postData);
      req.end();

    } catch (err) {
      reject(err);
    }
  });
};

// Configファイルから資格情報をロードし、必要に応じて自動ログインを実行
const checkAndAuthorize = async () => {
  if (stravaCookie) {
    return stravaCookie;
  }

  // キャッシュCookieが無い場合は、Configファイルをチェック
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (config.email && config.email !== 'YOUR_STRAVA_EMAIL' && config.password && config.password !== 'YOUR_STRAVA_PASSWORD') {
        stravaCookie = await loginToStrava(config.email, config.password);
        return stravaCookie;
      }
    } catch (err) {
      console.error('Failed to process automatic login config:', err.message);
    }
  }

  console.log('Running in public guest mode (splits & gear will not be collected). to enable splits, please configure strava_config.json.');
  return '';
};

// HTTPSリクエスト取得関数 (Cookie対応 & リダイレクト追従)
const fetchText = (url) => {
  return new Promise((resolve, reject) => {
    const get = (targetUrl) => {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      };

      if (stravaCookie) {
        headers['Cookie'] = stravaCookie;
      }

      https.get(targetUrl, { headers }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let nextUrl = res.headers.location;
          if (nextUrl.startsWith('/')) {
            const urlObj = new URL(targetUrl);
            nextUrl = `${urlObj.protocol}//${urlObj.host}${nextUrl}`;
          }
          get(nextUrl);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch: ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    };
    get(url);
  });
};

const run = async () => {
  // クロール開始前にCookieのチェック・自動ログインを実行
  await checkAndAuthorize();

  console.log('Fetching workouts CSV to check Strava links...');
  let csvText = '';
  try {
    csvText = await fetchText(SPREADSHEET_CSV_URL);
  } catch (err) {
    console.error('Failed to fetch CSV from Google Sheets:', err.message);
    process.exit(1);
  }

  // CSVからStravaリンク情報を抽出
  const lines = csvText.split('\n');
  const stravaLinks = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;
    const columns = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
    if (columns.length < 19) continue;
    
    let link = columns[18] ? columns[18].trim() : '';
    if (link.startsWith('"') && link.endsWith('"')) {
      link = link.substring(1, link.length - 1).trim();
    }
    
    if (link && link.includes('strava.com/activities/')) {
      const match = link.match(/activities\/(\d+)/);
      if (match) {
        const id = match[1];
        stravaLinks.push({ id, url: link });
      }
    }
  }

  console.log(`Found ${stravaLinks.length} Strava links in spreadsheet.`);

  // 既存の蓄積詳細データを読み込み
  let details = {};
  if (fs.existsSync(DETAILS_FILE)) {
    try {
      details = JSON.parse(fs.readFileSync(DETAILS_FILE, 'utf8'));
      console.log(`Loaded ${Object.keys(details).length} existing Strava records from local DB.`);
    } catch (err) {
      console.warn('Failed to parse existing details file, starting fresh:', err.message);
    }
  }

  // クローラー処理 (新しく見つかったID、またはCookieがありスプリットが未取得のIDを更新収集)
  let newlyAdded = 0;
  for (const item of stravaLinks) {
    const hasCachedMap = details[item.id] && details[item.id].mapUrl;
    const hasCachedSplits = details[item.id] && details[item.id].splits && details[item.id].splits.length > 0;
    
    if (hasCachedMap && (!stravaCookie || hasCachedSplits)) {
      continue;
    }

    console.log(`Fetching Strava HTML for activity ${item.id} -> ${item.url}...`);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const html = await fetchText(item.url);
      const match = html.match(/id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
      
      if (match) {
        const nextData = JSON.parse(match[1]);
        const activity = nextData.props?.pageProps?.activity;
        if (activity) {
          const mapUrl = activity.mapImages && activity.mapImages[0] ? activity.mapImages[0].url : null;
          const media = activity.media || [];
          
          const splits = activity.splits || [];
          const gearName = activity.gear?.name || activity.gearName || null;
          const deviceName = activity.deviceName || null;
          const description = activity.description || null;

          details[item.id] = {
            id: item.id,
            name: activity.name || '',
            startLocal: activity.startLocal || '',
            mapUrl: mapUrl,
            media: media.map(m => m.url),
            splits: splits,
            gearName: gearName,
            deviceName: deviceName,
            description: description,
            updatedAt: new Date().toISOString()
          };
          newlyAdded++;
          console.log(`-> Successfully collected details for ${item.id} (Has Map: ${!!mapUrl}, Splits: ${splits.length}, Gear: ${gearName || 'None'})`);
        } else {
          console.warn(`-> No activity properties in NEXT_DATA props for ${item.id}`);
        }
      } else {
        // もしセッションが切れてリダイレクトされていた場合はCookieをクリアして次回再ログインを試みる
        if (html.includes('/login') && stravaCookie) {
          console.warn('-> Session expired. Clearing cached cookie to force re-login next run.');
          stravaCookie = '';
          if (fs.existsSync(COOKIE_FILE)) fs.unlinkSync(COOKIE_FILE);
        }
        console.warn(`-> NEXT_DATA script tag not found in HTML for ${item.id}`);
      }
    } catch (err) {
      console.error(`-> Failed to get details for activity ${item.id}:`, err.message);
    }

    fs.writeFileSync(DETAILS_FILE, JSON.stringify(details, null, 2), 'utf8');
  }

  console.log(`Processing completed. Newly added/updated: ${newlyAdded} items. Total accumulated: ${Object.keys(details).length}`);
};

// デーモンモード（--watch / -w）の解析
const args = process.argv.slice(2);
const isWatchMode = args.includes('--watch') || args.includes('-w');

if (isWatchMode) {
  console.log('Starting Strava sync in DAEMON/WATCH mode (runs every 30 minutes)...');
  const loop = async () => {
    await run();
    console.log('Sleeping for 30 minutes before next sync...');
    setTimeout(loop, 1800000); // 30分 = 1800000ms
  };
  loop();
} else {
  run();
}
