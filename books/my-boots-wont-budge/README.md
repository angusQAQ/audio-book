# 我的雨靴不肯走！

7–9歲，以小二自主閱讀為主要目標。雨後踢球時，孩子的雨靴陷在淺軟泥裏；媽媽拉出了孩子，雨靴卻留在原處。母子再各拔一靴，孩子繞草邊拿回球，把空雨靴放成球門，完成最初踢球的願望。正文274漢字、12故事跨頁、16閱讀畫面、30單頁。已完成完整插畫、原生PDF／PPTX／SVG及實際LibreOffice／Inkscape驗證。

- [跨頁PDF](https://angusqaq.github.io/audio-book/books/my-boots-wont-budge/exports/我的雨靴不肯走！_跨頁閱讀版.pdf)
- [單頁PDF](https://angusqaq.github.io/audio-book/books/my-boots-wont-budge/exports/我的雨靴不肯走！_繪本.pdf)
- [可編輯PowerPoint](https://angusqaq.github.io/audio-book/books/my-boots-wont-budge/exports/我的雨靴不肯走！_可編輯排版.pptx)

[需求](brief.json)、[故事](story.json)、[設計與分鏡](design-brief.md)、[生成紀錄](artwork-log.json)、[部首來源](sources/radical-check.json)保存來源。PDF嵌字，PPTX／SVG有原生文字、姓名線、色塊及獨立圖像；PNG可替換而不能逐筆編輯。編輯前安裝[芫荽](https://angusqaq.github.io/audio-book/assets/fonts/print/Iansui-Regular.ttf)及[芫茜雅楷](https://angusqaq.github.io/audio-book/assets/fonts/print/JyunsaiKaai-Bold.ttf)，保留[共用字型及授權](../../assets/fonts/print)。

安裝requirements-book.txt後，在repository根目錄執行 `python3 books/my-boots-wont-budge/build_book.py`。以LibreOffice輸出全書PDF，Inkscape把每個故事SVG及lesson實際渲染成960×600 PNG，再執行 `python3 books/my-boots-wont-budge/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders PNG目錄`。報告見exports/validation.json及exports/render-validation.json。

沒有冒稱學生試讀、Microsoft PowerPoint或印廠製版測試；本次沒有另製點讀音訊。

本次實測：LibreOffice全書16畫面、姓名線13條；Inkscape渲染全部故事跨頁及活動頁。逐頁文字、實際字型／字級、專名號及17項圖文留白檢查通過，普通力字不放大。原圖存檔點84a559a；[修訂紀錄](revisions.json)保留前後雜湊。
