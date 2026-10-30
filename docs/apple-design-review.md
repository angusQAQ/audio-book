# Design review: 點點書房

## Summary

以原書為核心，保留暖黃繪本書架、專屬 Logo 與粵語點讀，依 Apple Design skill 改善閱讀時的工具層級、觸控、字體放大與外觀。此專案為靜態網站，採用 HIG 的設計及無障礙原則；不宣稱符合原生 App 的工具列、App Store 或系統音訊 API 規則。

技能：`.agents/skills/apple-design/SKILL.md`。來源及固定版本見同目錄 `SOURCE.md`，安裝檔與參考資料均提交 GitHub。

## Improvements

### High — 閱讀空間與漸進式顯示

- **What:** 1111×730 視窗中，原品牌列為 74px、原工具列 78px，書頁視窗只有 451px。
- **Why:** `layout.md › Visual hierarchy`：「Use progressive disclosure to make layouts cleaner and easier to interact with.」書本是主要工作內容，設定在需要時再出現。
- **Fix:** 閱讀時收起品牌列，整合為 58px 符號工具列；頁數與翻頁保持可見，點讀模式、縮放及聲音由標示清楚的圖示開啟。書頁視窗實測增至 533px，增加 82px。首頁仍保留品牌及書架。

Regular / compact 共用結構：

```text
[返回] [點讀模式]        [上一頁 1/11 下一頁]        [設定]
                    原書完整頁面
[播放]          當前文字與可拖曳時間軸          [重聽 停止]
```

### High — 觸控與鍵盤

- **What:** 原進度條操作區高 24px，手機次要播放按鈕高 36px；閱讀模式上按方向鍵會觸發整頁翻頁。
- **Why:** `accessibility.md › Mobility`：「Offer sufficiently sized controls.」`buttons.md › Best practices` 建議 44×44 的操作區；`segmented-controls.md › Best practices` 要求將相關選項維持為一致的單選控制。
- **Fix:** 主要圖示、進度條與次要播放操作皆提供至少 44px 高的操作區。模式選項支援方向鍵、Home/End 及循序焦點。Escape 優先關閉面板並恢復焦點，不因關閉設定而意外停止朗讀。

### Medium — 深色、對比與放大

- **Why:** `color.md › Best practices`：「Make sure all your app’s colors work well in light, dark, and increased contrast contexts.」`typography.md › Supporting Dynamic Type`：「Make sure your app’s layout adapts to all font sizes.」
- **Fix:** 用語意 CSS 變數跟隨系統深色外觀及高對比偏好；加入安全區內距，放大文字時讓工具與頁面適當換行／捲動。原 PDF 頁圖維持原樣，無反相或濾鏡。

| 角色 | 淺色 | 深色 | 實測對比 |
| --- | --- | --- | --- |
| 底色 | `#fff9ec` | `#111f1d` | — |
| 主要文字 | `#183f3b` | `#f4f1e7` | 11.04:1 / 15.02:1 |
| 控制面板 | `#fffcf4` | `#20322d` | — |
| 輔助文字 | `#56665a` | `#b4c6bc` | 面板上 5.95:1 / 7.55:1 |
| 主動作 | 深青底、米白字 | 米白底、深色字 | 11.04:1 / 15.02:1 |
| 閱讀提示 | `#efb837` | `#ffd15c` | 在原字形遮罩上描光，不改寫頁圖 |

保留 Noto Sans TC 字型與既有字級角色，主要操作 16px、一般標籤 14px、輔助文字 12px；可隨文字設定放大。沒有加入裝飾性動態或透明玻璃層。

## Craft notes

特色是直接在原書上點讀、發亮及聆聽，而不是套用原生 iOS 外殼。移除閱讀時重複的品牌與書架文字列，讓已有的原書插圖與閱讀互動承載個性；圖示保持同一筆畫風格並提供名稱。

### 翻頁與朗讀指引

`motion.md › Providing feedback`：「Aim for brevity and precision in feedback animations.」「Let people cancel motion.」翻頁以原頁圖副本沿左側書脊轉動 420ms，前後方向相反；快速連按可取消上一個動畫，停止舊朗讀並確保最後頁圖與點讀位置一致。依 `motion.md › Best practices` 的「Make motion optional.」，減少動態效果時直接換頁。420ms、書脊位置及曲線是本專案的設計判斷，並非 Apple 規定數值。

句子、詞語及單字以 Edge 真實 WordBoundary 資料跟隨音訊；發亮保持穩定，不閃爍。跳播與改速仍以媒體時間計算，跨頁續句不標亮下一頁尚未出現的字。播放結束後清除發光。

### 後續修正 — 封存、筆畫清晰度與首頁

- **High / 可讀性：** 使用者指出滿不透明度字形疊色與兩重 drop-shadow 遮住原字。依 `accessibility.md › Vision` 的「Strive to meet color contrast minimum standards.」及「Convey information with more than color alone.」，改用 #ffd85b3d 柔和底色、字詞下方 2px #946b16 細線、.16 不透明度字形提示，移除模糊光暈，以 multiply 合成避免提亮原筆畫。這些配色與合成方法屬專案設計判斷；原書是影像，不以單一介面文字對比值代替驗證。淺／深色各比較相同頁面有／無提示截圖，原 RGB 最大值小於 125 的筆畫像素均未提高超過 3 的捨入容差，提示仍可見。
- **可恢復的整理：** 依 `undo-and-redo.md › Best practices` 的「Show the results of an undo or redo.」，提供持續可見的「閱讀中／已封存」入口、具書名的封存／恢復標籤及操作結果訊息，並將焦點留在可繼續操作的分類鍵。所有書都封存時仍可進入已封存清單。這是網頁的可逆書架分類，不套用原生 App 的撤銷手勢。狀態保存在目前瀏覽器，閱讀進度與所有原檔保留。
- **首頁取捨：** 按使用者要求加入 22px 間距的淡圓點紙張背景；原本暖黃書本邀請區仍是視覺重心。移除書籍簡介、原 PDF 按鍵及整個頁尾，減少選書時的次要內容。閱讀頁沒有圓點背景。

## What works

原 PDF、11 頁完整書頁、句詞字映射、閱讀記憶、翻頁、縮放、預製粵語與 Audio Play UI 均保留。首屏仍可直接選書，閱讀頁預設不自動發聲。

## Platform notes

翻頁修正沿用 `motion.md › Best practices` 的「Make motion optional.」與 `motion.md › Providing feedback` 的「Let people cancel motion.」：圖片已載入後，翻頁功能不再無限等待動畫完成；仍保留正常動畫與減少動態選項，快速連翻會取消舊動畫。850ms 復原上限與 56px 水平滑動門檻是專案實作判斷。放大後保留橫向捲動，普通點字不觸發翻頁。

在 Chromium 實測跨 320–1920px、790×730 與 1111×730；另檢查深色／高對比、減少動態與 200% 介面文字。這些證據不等同實體 iPhone、VoiceOver 或 Safari 全平台認證。

## Speech pipeline diagnosis

失敗執行回傳 `NoAudioReceived`；安裝工具均通過。edge-tts 上游在 [#512](https://github.com/rany2/edge-tts/issues/512) 有相同的近期間歇性服務回報，不因此判定缺少憑證或改用其他聲音。

修復：並行量降為 2；暫時性失敗最多七次並退避 2／5／10／20／30／45 秒；401／403 及確定的資料錯誤不盲目重試。服務對照探測會分別檢查句子及字詞邊界。有效 MP3 與字詞時間快取在工作失敗時仍保存，下一次可續傳。只有整批音檔與真實時間資料驗證成功，才更新圖書索引並取代網站資產。

[修復後的 GitHub 執行](https://github.com/angusQAQ/audio-book/actions/runs/40867187041) 已完成全部生成、嚴格音訊驗證及瀏覽器測試；機器人提交 `c99df7b` 保存全部 764 個帶時間映射與 749 個去重 MP3。
