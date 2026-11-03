# 雨天的竹筒樂隊

7–9歲、小二至小三自主閱讀的繁體中文原創繪本。雨天不能出門，祖孫從互相搶快到停下傾聽，合奏自己的音樂。 正文226個漢字、10個故事跨頁；24內頁，加封面封底共26單頁，14閱讀畫面。

核心字：筷、筒、笛、節、等、笑。選定字目使用150%芫茜雅楷粗體；普通部首本形「竹」維持一般字級。人物姓名朵朵每次出現均有連續專名號；公公為親屬稱謂，不作姓名標記。

- [跨頁閱讀PDF｜14畫面](https://angusqaq.github.io/audio-book/books/the-rainy-day-bamboo-band/exports/雨天的竹筒樂隊_跨頁閱讀版.pdf)
- [單頁繪本PDF｜26頁](https://angusqaq.github.io/audio-book/books/the-rainy-day-bamboo-band/exports/雨天的竹筒樂隊_繪本.pdf)
- [可編輯PowerPoint｜14張](https://angusqaq.github.io/audio-book/books/the-rainy-day-bamboo-band/exports/雨天的竹筒樂隊_可編輯排版.pptx)
- [全書縮圖](exports/全書縮圖.png)、[SVG來源](editable)、[原始插畫](assets/illustrations)、[字型與授權](assets/fonts)

## 人物與來源

朵朵是寬方臉、雀斑、小杏眼、高束捲髮及結實身形；公公瘦高，有白側髮、白鬚、長方臉及長方眼鏡。 本書與另一新作不共用角色模型或情節，也不以換衣服代替人物差異。[design-brief.md](design-brief.md)保存參考細讀、人物比較、圖文分工與連貫規則；[brief.json](brief.json)、[story.json](story.json)保存本次需求及全部原稿。原創插畫、模型與修改前版本共13份，精確提示、參考與SHA-256見[artwork-log.json](artwork-log.json)。使用者的參考書未重新公開。部首條目及授權見[sources](sources)。

## 編輯與重建

PDF嵌入實際字型；PPTX／SVG編輯前請安裝assets/fonts的芫荽與芫茜雅楷。PPTX保留原生文字、字型／字級、姓名線、色塊與獨立圖像；SVG保留原生文字與相對圖像路徑，移動時須帶同assets。不透明插圖在PDF／PowerPoint內以完整解像度的高品質JPEG編碼，透明封面維持PNG；全部原始PNG保留於assets，SVG亦連結原圖。插圖可獨立替換，並非可逐筆修改的向量插畫。

在工作區虛擬環境安裝requirements-book.txt，從專案根目錄執行：

```bash
python3 books/the-rainy-day-bamboo-band/build_book.py
```

程式輸出兩份PDF、PowerPoint、14份SVG及全書縮圖，檢查字型缺字、原稿、原圖雜湊、單頁裁切、150%字目、普通部首字級及姓名線幾何。

將PowerPoint以LibreOffice實際另存全部頁面PDF，並以安裝了本書字型的Inkscape渲染editable內的s01、s05、s10及lesson為同名PNG後執行：

```bash
python3 books/the-rainy-day-bamboo-band/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

[validation.json](exports/validation.json)與[render-validation.json](exports/render-validation.json)保存原生及實際Office／SVG檢查結果與成品雜湊。這是數位成品；實測工具為LibreOffice，未作Microsoft PowerPoint或印廠CMYK／出血驗證。本次交付PDF與可編輯檔，沒有新增點讀音訊。
