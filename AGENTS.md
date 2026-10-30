# 點點書房：協作與發布規則

- 使用本專案現有 checkout；除非使用者明確要求，勿另建 Git worktree。
- 製作或修訂兒童繪本使用 `.agents/skills/children-picture-book/SKILL.md`。新書的適讀年齡、主題、內容、角色與篇幅均依本次要求設定，不自動沿用前作；修訂既有書則保留該書已確認設定。
- 所有正式網站檔案與增刪修改都必須以 Git commit 保存並推送 GitHub；每個可審閱的更新階段都建立獨立 commit 存檔點，不把工作只留在本機。
- 推送 `main` 會觸發 `Publish and verify permanent website`，驗證通過後自動同步永久網站；確認實際發布及線上檢查成功才宣稱完成。保留歷史，禁止強推。
- 設計優化使用 `.agents/skills/apple-design/SKILL.md`，按其索引讀取相關 HIG 檔案後再引用。此專案為靜態網站，採用適用的設計與無障礙原則，不套用原生 App 專屬規則。
- 保留繪本遊樂園特色、原 PDF、完整頁圖及點讀映射。任何朗讀指引必須對應實際音訊或裝置邊界事件，不偽造時間軸。
- 書籍封存必須可以隨時恢復，保留原檔與閱讀進度。書架不顯示簡介、原 PDF 按鍵或頁尾；移除按鍵不等於刪除 PDF。首頁使用樸素背景；跟讀提示不得以亮色或光暈遮擋原字筆畫。
- 原 PDF 的 SHA-256 固定為 `e185baacc918f1bad825f628611cfbbccfe684acb90398e87539ecfa5bf345bb`。
- 預製粵語使用 `edge-tts`、`zh-HK-HiuMaanNeural`、語速 `-12%`，完整生成並驗證後才取代已提交的音訊。
- 使用者另要求安裝 VoxCPM 並依圖書選擇合適聲音；設定與進度見 `config/book-voices.json`、`docs/voxcpm.md`。VoxCPM 新音源必須完成實際粵語試音、全書生成及新音訊對齊後才發布；未完成時保留原 Edge MP3，不把舊音訊重新標示成 VoxCPM，不以均分時長偽造逐字同步。
- 重要檢查：`npm test`、`python3 scripts/validate_assets.py --require-edge`，以及部署流程中的實際網站驗證。不要以安裝、埠開啟或 Git 推送成功代替功能驗證。
