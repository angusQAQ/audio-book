# 恐龍同學，請坐好！

7–9歲，以小二自主閱讀為主要目標的原創繁體中文繪本。玩具上學日，多多想與小恐龍拍同桌合照；先因玩具坐得太低而拍不到，再因湊得太近而擋住自己，最後主動抱在胸前，兩個一起入鏡。正文370漢字、12故事跨頁、16閱讀畫面、30單頁。

已完成完整插畫、單頁及跨頁PDF、原生文字PowerPoint／SVG，並以LibreOffice及Inkscape實際開啟驗證。

- [跨頁PDF](https://angusqaq.github.io/audio-book/books/dinosaur-classmate/exports/恐龍同學，請坐好！_跨頁閱讀版.pdf)
- [單頁PDF](https://angusqaq.github.io/audio-book/books/dinosaur-classmate/exports/恐龍同學，請坐好！_繪本.pdf)
- [可編輯PowerPoint](https://angusqaq.github.io/audio-book/books/dinosaur-classmate/exports/恐龍同學，請坐好！_可編輯排版.pptx)

[需求](brief.json)、[原稿及理解證據](story.json)、[設計與分鏡](design-brief.md)、[精確插畫紀錄](artwork-log.json)、[部首資料](sources/radical-check.json)保存完整來源。PNG可替換，PDF嵌字，PPTX／SVG文字及姓名線為原生物件。編輯前安裝[芫荽](https://angusqaq.github.io/audio-book/assets/fonts/print/Iansui-Regular.ttf)及[芫茜雅楷](https://angusqaq.github.io/audio-book/assets/fonts/print/JyunsaiKaai-Bold.ttf)，授權見[共用字型](../../assets/fonts/print)。

安裝requirements-book.txt後，從repository根目錄執行：

```bash
python3 books/dinosaur-classmate/build_book.py
```

以LibreOffice另存全部頁面為PDF，Inkscape實際渲染s01、s03、s04、s06、s07、s09、s10、s11、s12、lesson為960×600 PNG後檢查：

```bash
python3 books/dinosaur-classmate/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

驗證報告見exports/validation.json及exports/render-validation.json。不以LibreOffice冒稱Microsoft PowerPoint測試，不宣稱已做印廠製版或學生試讀。本次交付PDF及可編輯檔，沒有自動新增點讀音訊。
