# 小木橋，通車了！

7–9歲，以小二自主閱讀為主要目標的繁體中文原創繪本。兩個動物伙伴搭玩具橋送花，從木板太短、接合處下垂，到以木杯代替手指托住橋面，讓小車成功送花並載客回來。 正文340漢字，10故事跨頁、14閱讀畫面、26單頁。

目前為製作草稿，完成插畫與實際成品驗證後才發布下列下載。

- [跨頁PDF](https://angusqaq.github.io/audio-book/books/little-wooden-bridge/exports/小木橋，通車了！_跨頁閱讀版.pdf)
- [單頁PDF](https://angusqaq.github.io/audio-book/books/little-wooden-bridge/exports/小木橋，通車了！_繪本.pdf)
- [可編輯PowerPoint](https://angusqaq.github.io/audio-book/books/little-wooden-bridge/exports/小木橋，通車了！_可編輯排版.pptx)

[需求](brief.json)、[故事與理解證據](story.json)、[設計與分鏡](design-brief.md)、[精確插畫紀錄](artwork-log.json)、[部首條目](sources)保存於本專案。原始PNG獨立保留，PDF嵌字，PPTX／SVG保留原生文字、姓名線及獨立圖像。編輯前安裝共用[Iansui](https://angusqaq.github.io/audio-book/assets/fonts/print/Iansui-Regular.ttf)與[JyunsaiKaai Bold](https://angusqaq.github.io/audio-book/assets/fonts/print/JyunsaiKaai-Bold.ttf)，授權見[共用出版字型](../../assets/fonts/print)。不透明插圖在PDF／PPTX以完整解像度高品質JPEG編碼，原PNG與SVG圖像路徑保持完整。

安裝requirements-book.txt後，從repository根目錄重建：

```bash
python3 books/little-wooden-bridge/build_book.py
```

以LibreOffice實際另存全書PDF，並以Inkscape渲染s02、s04、s05、s06、s08、s10、lesson為同名960×600 PNG後驗證：

```bash
python3 books/little-wooden-bridge/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

成品與渲染雜湊記入exports/validation.json及exports/render-validation.json。實測工具為LibreOffice及Inkscape，未宣稱Microsoft PowerPoint、印廠CMYK／出血或新音訊測試。沒有自動加入點讀書架；本次交付PDF及可編輯檔。真實學生試讀尚未進行。
