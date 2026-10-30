# 驗證紀錄

2026-10-29。範圍：繪本遊樂園書架、《我們的好老師》原書點讀、Audio Play UI、Logo、Apple Design skill、精簡閱讀工具列、真實語音逐詞指引、翻頁動畫、可恢復封存與簡化首頁。

- `npm test`：12 個測試通過。實際播放 11 頁 × 句子／詞語／單字共 33 組點讀；另測搜尋、原 PDF、閱讀記憶、暫停／繼續、重聽、速度、縮放、鍵盤翻頁、音檔錯誤復原、320–1920px、使用者的 790×730 視窗、減少動態及 axe 無障礙。播放器測試確認可直接播放、拖曳跳播、已播／總時間及停止後重新播放。新增精簡工具列與鍵盤焦點、深色／高對比／200% 介面字體、真實字詞時間跳播／改速／跨頁指引／播放結束清除，以及前後翻頁動畫／快速取消／減少動態測試。另驗證封存／恢復／重新整理、全書封存後的入口、搜尋與進度保留，以及淺／深色跟讀截圖像素保護：提示保持可見，深色原筆畫沒有被提亮遮蓋。
- `python3 scripts/validate_assets.py --require-edge`：通過。11 頁、764 個映射音訊單位、749 個去重後的 MP3、2,406 個詞語／單字映射。所有音檔可解碼，雜湊符合索引；全部指定 `edge-tts 7.3.1`、`zh-HK-HiuMaanNeural`、`rate=-12%`，帶有 schema 1 的實際 WordBoundary 時間資料。GitHub [修復後生成流程](https://github.com/angusQAQ/audio-book/actions/runs/40867187041) 已成功，音檔與時間由機器人以 `c99df7b` 提交回原工作分支。
- 原 PDF SHA-256：`e185baacc918f1bad825f628611cfbbccfe684acb90398e87539ecfa5bf345bb`。與上傳原檔及舊網站來源記錄一致；11 張頁圖均與 PDF 影像串流逐位元組相同。
- 本機 MP3 Range 請求回傳 `206`，可用實際播放器跳至中段。開發與測試改用支援 Range 的鎖版 `http-server`；Python 的簡易 HTTP 伺服器不作跳播驗證依據。
- Hallmark render sweep：0 FAIL、2 個提示（黃色紙張色域、選擇控制的填色）、2 個已記錄例外（大尺寸可操作書封、進度滑塊光學對齊）。使用 HTTP 渲染，沒有把受限的 file:// 檢查當成通過。
- Impeccable：新 Logo 與播放器已由獨立 finish reviewer 審閱桌面、手機及 790×730 實際截圖，結論 `ship`，無需修正的視覺／操作問題。Detector 無非提示層級問題；22 個提示為設計文件字級／圓角對應，包含既有覆寫規則，不作未授權的全站修整。沒有遠端品質參考板或經批准的 comp，不宣稱完成此類比較。
- Logo 使用 imagegen 生成；透明底圖形結合閱讀者圓點、書本和播放符號，精確生成提示已嵌入 PNG，中文品牌文字保留為清晰 HTML 字樣。
- 可重用安裝腳本已實際重跑：虛擬環境、Python 依賴、`npm ci`、JavaScript 語法檢查通過。安裝及支援 Range 的啟動指引已儲存為雲端環境設定草稿。
- Apple Design skill 已固定來源提交；適用的 HIG 引文、對比值、閱讀視窗增加 82px、44px 操作區及動態取捨記錄於 `docs/apple-design-review.md`。實際截圖檢查淺色桌面／手機、深色書架／閱讀與翻頁中段；原頁圖無濾鏡或修改。上述為 Chromium 證據，未宣稱 Safari 或實體 VoiceOver 測試。

## VoxCPM 安裝檢查（2026-10-30）

`voxcpm==2.0.3` 與獨立環境已安裝；官方 CLI、VoxCPM2／torchcodec 等載入、CPU 計算、`pip check`、安裝腳本重跑、真實原書段落及缺失書本錯誤檢查均通過。模型下載被雲端代理以 403 拒絕，實際試音命令回傳 `ProxyError`；**模型合成、試音聆聽與新 MP3 尚未通過驗證**。原網站的 PDF、資料索引與 MP3 均未變更。詳見 `docs/voxcpm.md`。

## 正式網站

已建立每次 `main` 推送自動執行的 **Publish and verify permanent website** 工作流程：驗證或生成 MP3、跑完整測試、將所有追蹤檔案同步 `gh-pages`、要求並等待該提交的 Pages 建置，最後驗證實際網站。另保留可獨立執行的 **Verify published reading website**。它等待線上 HTML、JS、CSS（含 tokens/base）、圖書資料與 Logo 的 SHA-256 與已提交版本完全一致，再以實際網站的手機視窗核對原 PDF 雜湊、三種 MP3 點讀、真實時間逐詞發光、播放器拖曳／時間／重播、精簡工具列、翻頁、封存及重新整理後恢復。本機對完整相同驗證程式的執行已通過；正式發布結果以對應 GitHub Actions 實際執行結果為準。設計文件更新已在本輪直接核對 YAML、token 引用與 sidecar v2 結構。
