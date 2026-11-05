# 妹妹的大灰狼

7–9歲，以小二自主閱讀為主要目標。姐妹想演木偶戲給奶奶看；妹妹不肯讓灰狼吃朋友，姐姐接納她的新點子，把追逐故事改成分享餅乾的喜劇。正文319漢字、12故事跨頁、16閱讀畫面、30單頁。已完成完整插畫、原生文字排版及實際輸出驗證。

- [跨頁PDF](https://angusqaq.github.io/audio-book/books/little-sisters-wolf/exports/妹妹的大灰狼_跨頁閱讀版.pdf)
- [單頁PDF](https://angusqaq.github.io/audio-book/books/little-sisters-wolf/exports/妹妹的大灰狼_繪本.pdf)
- [可編輯PowerPoint](https://angusqaq.github.io/audio-book/books/little-sisters-wolf/exports/妹妹的大灰狼_可編輯排版.pptx)

[需求](brief.json)、[故事](story.json)、[設計與分鏡](design-brief.md)、[生成紀錄](artwork-log.json)、[部首來源](sources/radical-check.json)保存重建來源。PDF嵌字；PowerPoint／SVG為原生文字、獨立圖像、姓名線與色塊。PNG插圖可替換，不能逐筆編輯。編輯前安裝[芫荽](https://angusqaq.github.io/audio-book/assets/fonts/print/Iansui-Regular.ttf)及[芫茜雅楷](https://angusqaq.github.io/audio-book/assets/fonts/print/JyunsaiKaai-Bold.ttf)，保留[共用字型授權](../../assets/fonts/print)。

安裝requirements-book.txt後，由repository根目錄執行 `python3 books/little-sisters-wolf/build_book.py`。以LibreOffice實際另存全書PDF、Inkscape渲染s01、s03、s04、s06、s07、s09、s10、s11、s12、lesson為960×600 PNG後執行 `python3 books/little-sisters-wolf/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders PNG目錄`。原生及渲染檢查見exports/validation.json與exports/render-validation.json。

尚未做學生試讀、Microsoft PowerPoint或印廠製版；本次沒有另製點讀音訊。
