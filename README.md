# 點點書房

保留原書的香港粵語點讀網站：[前往書架](https://angusqaq.github.io/audio-book/)。第一本書是宋詒瑞《我們的好老師》，共 11 頁。原 PDF 不改動，書頁、字形發光與句子／詞語／單字點讀位置沿用已上線版本。

## 本機開發

需要 Node.js 24、Python 3.12、Chromium 與 ffmpeg（包含 ffprobe）。開發伺服器使用已鎖版的 http-server，支援 MP3 拖曳跳播所需的 HTTP Range。網站是純靜態 HTML/CSS/JavaScript，沒有資料庫或伺服器端金鑰。

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

Playwright 驗證 11 頁 × 三種點讀模式的真實 MP3 播放、發光、播放／暫停／繼續、拖曳跳播與時間顯示、重聽、速度、翻頁、縮放、閱讀記憶、搜尋空狀態、音檔錯誤復原、320–1920px 與 790×730 排版、鍵盤、減少動態，以及 axe 無障礙檢查。資產檢查核對原 PDF SHA-256、所有圖片和點讀映射，並以 ffprobe 解碼檢查全部 MP3。

## 指定粵語 MP3

```sh
/workspace/.venvs/audio-book/bin/python scripts/generate_audio.py --jobs 3
python3 scripts/validate_assets.py --require-edge
npm test
```

指定 `edge-tts==7.3.1`、`zh-HK-HiuMaanNeural`、`rate=-12%`。文字直接來自 `library.json` 的讀音單位，包含原書的英語句子。`.cache/edge-tts/` 可續傳，每個快取都有內容雜湊與時長驗證；整批成功才更新 `assets/audio/` 與資料索引。舊音檔不會在下載失敗時被取代。網站直接播放已提交的 MP3，預設不使用裝置語音，也不會在點讀時連線語音服務。速度滑桿是相對於預製音檔的播放速度。

GitHub Actions 的 **Prepare and verify Cantonese MP3** 可在工作分支手動啟動，先生成及驗證音檔。它生成 MP3、嚴格驗證指定聲音並跑瀏覽器測試，全部通過才將音檔回存同一分支。執行失敗時不部署，不宣稱已生成指定聲音。

## GitHub 與網站同步

所有新增、修改、刪除的正式檔案均以 Git 提交保存於 `angusQAQ/audio-book`，包括 PDF、頁圖、MP3、Logo、字型、程式、測試和設定。

每次推送 `main`，**Publish and verify permanent website** 都會自動驗證或生成指定 MP3、核對原 PDF、執行完整瀏覽器測試，再將所有已追蹤檔案同步至永久網站的 `gh-pages` 分支並要求 GitHub Pages 建置。必要的生成音檔先提交回 `main`；全程保留歷史，禁止強制推送。若 `gh-pages` 含有 `main` 未包含的修改，流程會停止並提示先合併，避免覆寫工作。

流程等待 GitHub Pages 回報該提交已建置，再執行實際網站驗證：線上 HTML、JS、CSS、資料和 Logo 必須與提交的雜湊相同，原 PDF、三種 MP3 點讀、播放器跳播／時間、字形發光和翻頁亦必須正常。發布完成與否以此流程實際結果為準。後續一般修改只需提交並推送 `main`，毋須另外手動更新永久網站。

**Verify published reading website** 可另行手動啟動，或在直接推送 `gh-pages` 時作獨立線上檢查。

## 檔案

- `index.html`、`app.js`、`styles.css`：網站介面與點讀操作。
- `tokens.css`、`base.css`：Hallmark Hum 衍生的紙張配色和可用性基礎。
- `library.json`：書本、句詞字映射與音檔的唯一編輯來源；`library.js` 是對應的靜態瀏覽器索引。
- `assets/pdf/〈我們的好老師〉.pdf`：上傳的原檔，SHA-256 `e185baacc918f1bad825f628611cfbbccfe684acb90398e87539ecfa5bf345bb`。
- `assets/pages/`：原網站的完整原書頁圖，從既有內嵌資產逐位元組拆出，無重製教材。
- `assets/glow/`：原書字形發光遮罩。
- `assets/audio/`：已提交的內置 MP3；`library.json` 的 `voice` 記錄實際引擎。
- `assets/brand/diandian-logo.png`：專屬透明底 Logo，圖形包含兩個閱讀者圓點、打開的書和播放符號，生成提示已嵌入檔案。
- `assets/fonts/`：自託管 Noto Sans TC 字型子集與 OFL 授權。
- `PRODUCT.md`、`DESIGN.md`、`.impeccable/`、`.hallmark/`：設計依據與驗證紀錄。

設計依據：[nutlope/hallmark](https://github.com/nutlope/hallmark)（8f6969f）與 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（5e745ac）。童書原文與插圖沿用使用者提供的 PDF，沒有新增授權宣稱。
