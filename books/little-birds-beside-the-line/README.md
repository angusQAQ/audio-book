# 黑線旁的小鳥

7–9歲、小二至小三自主閱讀的繁體中文心部原創繪本。小宇不小心在阿琳的畫上劃出黑線，從害怕、逃避，到承認、傾聽與再次合作。272個漢字、12個故事跨頁；28內頁，加封面封底共30單頁。完整插畫與原生文字排版已完成驗證。

核心字為急、忘、怕、悄、想、慢，兼認心／忄；部首歸屬已逐字核對。全新人物與教室畫畫情節，與同期火部繪本獨立。

- [跨頁閱讀PDF｜16畫面](https://angusqaq.github.io/audio-book/books/little-birds-beside-the-line/exports/黑線旁的小鳥_跨頁閱讀版.pdf)
- [單頁繪本PDF｜30頁](https://angusqaq.github.io/audio-book/books/little-birds-beside-the-line/exports/黑線旁的小鳥_繪本.pdf)
- [可編輯PowerPoint｜16張](https://angusqaq.github.io/audio-book/books/little-birds-beside-the-line/exports/黑線旁的小鳥_可編輯排版.pptx)
- [全書縮圖](exports/全書縮圖.png)、[SVG來源](editable)、[字型及授權](assets/fonts)

正文使用芫荽Iansui；六字使用芫茜雅楷JyunsaiKaai Bold、正文150%，說明中的「心」維持一般字級。小宇、阿琳每次完整人名下附連續專名號。活動頁辨識「怕、願、眼」；繁體「願」屬頁部，不能只憑意思判定心部。

PDF已嵌入實際字型；編輯PPTX／SVG前請安裝assets/fonts中的兩份字型。PPTX保留原生文字框、可編輯字級／字型、姓名線與獨立插畫；SVG保留文字、線條和相對路徑圖片。PNG可獨立替換，並非可逐筆編輯向量；移動SVG時須一併保留assets。

## 來源與重建

需求見[brief.json](brief.json)，完整故事、分鏡和角色／道具設定見[story.json](story.json)，參考細讀及情緒路線見[design-brief.md](design-brief.md)。[artwork-log.json](artwork-log.json)保存角色表、畫中畫道具模型、封面、12幅故事圖及一份修改前道具模型的精確提示、參考與SHA-256，共16個圖檔。Unicode17.0部首資料的固定來源、相關條目及授權見[sources](sources)。

在獨立Python虛擬環境安裝requirements-book.txt後，從專案根目錄執行：

```bash
python3 books/little-birds-beside-the-line/build_book.py
```

程式重建兩份PDF、PPTX、16份SVG、全書縮圖及validation.json，核對原稿、原圖、字型／字級、單頁裁切、專名號及可編輯文字。使用LibreOffice將PPTX另存PDF，並以已安裝字型的Inkscape將editable/s10.svg與lesson.svg各渲染為同名PNG，再執行：

```bash
python3 books/little-birds-beside-the-line/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

實際LibreOffice全部16頁文字、兩種字型、放大字級與16條姓名線均相符；29個文字／底圖留白檢查通過。已查看原PDF及Office全書縮圖、SVG添小鳥與活動頁；黑線持續保留、先添兩鳥後添兩葉、結尾掛畫與新空紙的時序逐頁核對。結果見[原生檢查](exports/validation.json)與[實際渲染檢查](exports/render-validation.json)。此為數位版；未作印廠出血／CMYK製版，Office驗證工具為LibreOffice。本次未製作點讀音訊。
