# 帽子，回來呀！

7–9歲，以小二自主閱讀為主要目標。一陣風把山羊的新帽子吹過岩石、河岸與小島，朋友卻把帽子認作野餐籃；兩個朋友說清誤會，取回帽子，再一起把它變成野餐的小籃子。正文298漢字、10故事跨頁、14閱讀畫面、26單頁。製作中，完成插畫與實際輸出驗證後發布。

- [跨頁PDF](https://angusqaq.github.io/audio-book/books/hat-come-back/exports/帽子，回來呀！_跨頁閱讀版.pdf)
- [單頁PDF](https://angusqaq.github.io/audio-book/books/hat-come-back/exports/帽子，回來呀！_繪本.pdf)
- [可編輯PowerPoint](https://angusqaq.github.io/audio-book/books/hat-come-back/exports/帽子，回來呀！_可編輯排版.pptx)

[需求](brief.json)、[故事](story.json)、[設計與分鏡](design-brief.md)、[生成紀錄](artwork-log.json)、[部首來源](sources/radical-check.json)保存來源。PDF嵌字，PPTX／SVG有原生文字、姓名線、色塊及獨立圖像；PNG可替換而不能逐筆編輯。編輯前安裝[芫荽](https://angusqaq.github.io/audio-book/assets/fonts/print/Iansui-Regular.ttf)及[芫茜雅楷](https://angusqaq.github.io/audio-book/assets/fonts/print/JyunsaiKaai-Bold.ttf)，保留[共用字型及授權](../../assets/fonts/print)。

安裝requirements-book.txt後，在repository根目錄執行 `python3 books/hat-come-back/build_book.py`。以LibreOffice輸出全書PDF，Inkscape把每個故事SVG及lesson實際渲染成960×600 PNG，再執行 `python3 books/hat-come-back/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders PNG目錄`。報告見exports/validation.json及exports/render-validation.json。

沒有冒稱學生試讀、Microsoft PowerPoint或印廠製版測試；本次沒有另製點讀音訊。
