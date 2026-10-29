# 點點書房

保留原書的香港粵語點讀網站：[前往書架](https://angusqaq.github.io/audio-book/)。第一本書是宋詒瑞《我們的好老師》，共 11 頁。原 PDF 不改動，書頁、字形發光與句子／詞語／單字點讀位置沿用已上線版本。

## 本機開發

需要 Node.js 24、Python 3.12、Chromium 與 ffmpeg（包含 ffprobe）。網站是純靜態 HTML/CSS/JavaScript，沒有資料庫或伺服器端金鑰。

```sh
npm ci
python3 -m venv /workspace/.venvs/audio-book
/workspace/.venvs/audio-book/bin/pip install -r requirements.txt
npm start
```

安裝於其他機器可自行指定虛擬環境位置。`npm start` 在 8000 埠提供網站。測試預設使用系統 `/usr/bin/chromium`；沒有系統 Chromium 時執行 `npx playwright install --with-deps chromium`，或設定 `CHROMIUM_PATH`。雲端工作使用現有 checkout，不建立額外 Git worktree。

## 驗證

```sh
npm test
python3 scripts/validate_assets.py
```

Playwright 驗證 11 頁 × 三種點讀模式的真實 MP3 播放、發光、暫停／繼續、重聽、速度、翻頁、縮放、閱讀記憶、搜尋空狀態、音檔錯誤復原、320–1920px 排版、鍵盤、減少動態，以及 axe 無障礙檢查。資產檢查核對原 PDF SHA-256、所有圖片和點讀映射，並以 ffprobe 解碼檢查全部 MP3。

## 指定粵語 MP3

```sh
/workspace/.venvs/audio-book/bin/python scripts/generate_audio.py --jobs 3
python3 scripts/validate_assets.py --require-edge
npm test
```

指定 `edge-tts==7.3.1`、`zh-HK-HiuMaanNeural`、`rate=-12%`。文字直接來自 `library.json` 的讀音單位，包含原書的英語句子。`.cache/edge-tts/` 可續傳，每個快取都有內容雜湊與時長驗證；整批成功才更新 `assets/audio/` 與資料索引。舊音檔不會在下載失敗時被取代。網站直接播放已提交的 MP3，預設不使用裝置語音，也不會在點讀時連線語音服務。速度滑桿是相對於預製音檔的播放速度。

GitHub Actions 的 **Prepare and verify Cantonese MP3** 在 `main` 或 `storybook-playground` 的相關資料／生成流程變更後執行，也可手動啟動。它生成 MP3、嚴格驗證指定聲音並跑瀏覽器測試，全部通過才將音檔回存同一分支。執行失敗時不部署，不宣稱已生成指定聲音。

## GitHub 與網站同步

所有新增、修改、刪除的正式檔案均以 Git 提交保存於 `angusQAQ/audio-book`。發布前必須完成 `validate_assets.py --require-edge` 與 `npm test`，將生成的 MP3 一併提交，然後同步 `main` 與網站既有的 `gh-pages` 分支。保留兩者歷史，禁止強制推送。更新後檢查 GitHub Pages 的實際 HTTP 回應與點讀功能，不以推送成功代替部署成功。

## 檔案

- `index.html`、`app.js`、`styles.css`：網站介面與點讀操作。
- `tokens.css`、`base.css`：Hallmark Hum 衍生的紙張配色和可用性基礎。
- `library.json`：書本、句詞字映射與音檔的唯一編輯來源；`library.js` 是對應的靜態瀏覽器索引。
- `assets/pdf/〈我們的好老師〉.pdf`：上傳的原檔，SHA-256 `e185baacc918f1bad825f628611cfbbccfe684acb90398e87539ecfa5bf345bb`。
- `assets/pages/`：原網站的完整原書頁圖，從既有內嵌資產逐位元組拆出，無重製教材。
- `assets/glow/`：原書字形發光遮罩。
- `assets/audio/`：已提交的內置 MP3；`library.json` 的 `voice` 記錄實際引擎。
- `assets/fonts/`：自託管 Noto Sans TC 字型子集與 OFL 授權。
- `PRODUCT.md`、`DESIGN.md`、`.impeccable/`、`.hallmark/`：設計依據與驗證紀錄。

設計依據：[nutlope/hallmark](https://github.com/nutlope/hallmark)（8f6969f）與 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（5e745ac）。童書原文與插圖沿用使用者提供的 PDF，沒有新增授權宣稱。
