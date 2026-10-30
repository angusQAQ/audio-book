# 點點書房

保留原書的香港粵語點讀網站：[前往書架](https://angusqaq.github.io/audio-book/)。第一本書是宋詒瑞《我們的好老師》，共 11 頁。原 PDF 不改動，完整書頁與句子／詞語／單字點讀位置沿用已上線版本。

## 書架與跟讀

每本書提供「封存」及「恢復到書架」，由「閱讀中／已封存」切換查看；封存不刪除原書、MP3 或閱讀進度。這項書架偏好保存在目前瀏覽器，換裝置不會自動同步；所有書都封存時，首頁按鈕會改為開啟已封存書架，仍可隨時恢復。

首頁採米白紙張與淡圓點背景，書卡保留書名、作者、頁數、閱讀及封存操作；依要求移除簡介、原 PDF 按鍵及頁尾，原 PDF 檔仍完整保存。朗讀指引採柔和底色、字詞下方細線與低不透明度字形提示，使用 multiply 合成避免亮色蓋住原字；淺／深色實際截圖的像素檢查確認深色筆畫不被提亮。

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

Playwright 驗證 11 頁 × 三種點讀模式的真實 MP3 播放、依語音時間逐詞指引、淺／深色筆畫像素保護、封存／恢復／重新整理及進度保留、播放／暫停／繼續、拖曳跳播與時間顯示、重聽、速度、雙向翻頁動畫與快速翻頁取消、縮放、閱讀記憶、搜尋空狀態、音檔錯誤復原、320–1920px 與 790×730 排版、精簡圖示工具列、鍵盤、深色／高對比、200% 介面字體、減少動態，以及 axe 無障礙檢查。資產檢查核對原 PDF SHA-256、所有圖片、點讀映射及語音字詞時間，並以 ffprobe 解碼檢查全部 MP3。

## 指定粵語 MP3

```sh
/workspace/.venvs/audio-book/bin/python scripts/generate_audio.py --jobs 2
python3 scripts/validate_assets.py --require-edge
npm test
```

指定 `edge-tts==7.3.1`、`zh-HK-HiuMaanNeural`、`rate=-12%`。文字直接來自 `library.json` 的讀音單位，包含原書的英語句子。同時保存服務提供的 `WordBoundary` 時間，播放器依實際音訊進度讓正在讀的字詞發亮；跳播、暫停與改速後仍跟隨音訊，跨頁續句只標亮目前頁面的原字。

《走！去找那朵雲》的「朵」按使用者指定讀 `do2`，規則保存於 `config/pronunciation-overrides.json`。僅在語音輸入以同音字「躲」提示讀音；書稿、PDF、畫面及跟讀仍顯示「朵」。這六段音訊使用獨立快取識別重新生成，時間取自新 MP3 的真實 WordBoundary，其他兩本書維持原音訊。

`.cache/edge-tts/` 可續傳，每個快取都有內容雜湊、時長及字詞時間驗證；整批成功才更新 `assets/audio/` 與資料索引。暫時性服務失敗會退避重試，並限制兩個並行請求。Actions 即使遇到服務中斷，亦保留已驗證快取供下次續傳。舊音檔不會在下載失敗時被取代。網站直接播放已提交的 MP3，預設不使用裝置語音，也不會在點讀時連線語音服務。速度滑桿是相對於預製音檔的播放速度。

GitHub Actions 的 **Prepare and verify Cantonese MP3** 可在工作分支手動啟動，先生成及驗證音檔。它生成 MP3、嚴格驗證指定聲音並跑瀏覽器測試，全部通過才將音檔回存同一分支。執行失敗時不部署，不宣稱已生成指定聲音。

## VoxCPM 與按書配音

已加入獨立 VoxCPM 2.0.3 安裝腳本及逐書聲音設定：`bash scripts/install_voxcpm.sh`；以 `scripts/voxcpm_sample.py --describe` 查看《我們的好老師》的「親切老師・香港粵語女聲」方向。程式與 CPU 檢查已通過，但公開模型下載目前被雲端代理以 403 拒絕，尚未完成實際合成。網站繼續使用已驗證的曉曼 `-12%` MP3，沒有把舊音檔標示成新模型。詳見 [VoxCPM 安裝、網路要求與試音進度](docs/voxcpm.md)。

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

## 原創犬部繪本

《小狼，換你說！》為 7–9 歲、小二至小三的繁體中文故事繪本，以「狗、狐、狸、狼、猴、獅」為核心、延伸「猜、獨」。已完成 15 幅正式插畫、34 頁單頁 PDF、18 畫面跨頁 PDF、18 張可編輯 PowerPoint 與 SVG 排版。故事、設計分析、教學提示、字型授權和重建方法見 [繪本專案](books/little-wolf-your-turn/README.md)。所有原創正式檔案均提交 GitHub；發布檢查另核對三份成品的線上 SHA-256。

粵語點讀版保留 18 個完整跨頁及放大的手寫字，提供句子／詞語／單字、精確逐字位置與真實時間跟讀。發布流程以曉曼女聲、-12% 預製並驗證全部 MP3 後，才註冊到書架；[直接閱讀](https://angusqaq.github.io/audio-book/?book=little-wolf-your-turn&page=1)。原 PDF、PowerPoint 和 SVG 均保留。重建頁圖／點讀映射使用 `python3 books/little-wolf-your-turn/build_reader.py`，音訊原子註冊及部首讀音映射的細節見該專案 README。

## 原創走部繪本

《走！去找那朵雲》為 7–9 歲設計，以「起、趕、超、越、趟、趣」為核心，兼認走、延伸趁。琪琪與樂樂去找天上的雲，在水窪發現腳邊也有天空。364 個漢字、14 個故事跨頁，採原創人物、灰鉛筆與局部淡彩、大留白及放大的手寫楷體。

- [跨頁閱讀 PDF｜18 畫面](https://angusqaq.github.io/audio-book/books/lets-find-that-cloud/exports/走！去找那朵雲_跨頁閱讀版.pdf)
- [單頁繪本 PDF｜34 頁](https://angusqaq.github.io/audio-book/books/lets-find-that-cloud/exports/走！去找那朵雲_繪本.pdf)
- [可編輯 PowerPoint](https://angusqaq.github.io/audio-book/books/lets-find-that-cloud/exports/走！去找那朵雲_可編輯排版.pptx)

[粵語點讀版](https://angusqaq.github.io/audio-book/?book=lets-find-that-cloud&page=1)保留最新姓名及專名號，提供句子／詞語／單字點讀和實際語音時間指引。預製曉曼粵語 MP3，語速 -12%；音訊完整驗證後加入書架。

[完整專案與編輯方法](books/lets-find-that-cloud/README.md)包含兩本參考書的細讀、故事與分鏡、角色模型表、15 幅正式插畫、兩個修改前版本、完整生成提示、字型授權、SVG 與重建程式。PDF 已嵌字；編輯 PowerPoint／SVG 前需安裝附帶字型。發布流程核對三份成品的線上 SHA-256。

## 設計與存檔點

已建立 [電子兒童繪本 skill](.agents/skills/children-picture-book/SKILL.md)。在此專案可使用 `$children-picture-book`，說明本次適讀年齡、主題、內容及成品要求；不會把上一本書的 7–9 歲、部首、角色或頁數當成預設。涵蓋參考分析、故事／分鏡、角色與插畫、PDF／可編輯排版、專名號、實際校稿、另有要求的點讀及 Git／發布驗證。

[下載可移植 skill ZIP](https://angusqaq.github.io/audio-book/downloads/children-picture-book-skill.zip)。解壓後將 `children-picture-book/` 放到目標專案的 `.agents/skills/`；支援 skill 的工具可按其規則發現，若目前工作階段尚未顯示，重新開啟該專案後使用。模板 `templates/book-brief.json` 的年齡／主題等欄位故意留空，填寫後可用附帶的 `scripts/init_book.py --brief 本次需求.json --output 新書目錄` 檢查並建立草稿；不會覆寫既有書。封裝可由 `python3 scripts/package_picture_book_skill.py` 重建。

專案已安裝 [Apple Design skill](https://github.com/dickwu/apple-design-skill)，固定來源與技能檔案位於 `.agents/skills/apple-design/`；設計檢視見 `docs/apple-design-review.md`。`AGENTS.md` 要求每個可審閱更新階段建立 Git commit 並推送 GitHub，完成驗證後自動同步永久網站。
