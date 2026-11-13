# 餅乾長腳了！

以小一至小二程度為目標的獨立虫部故事。正文218漢字，10故事跨頁、14閱讀畫面、26單頁；核心蜜、蜂、蝴、蝶、螞、蟻，字目150%手寫體，姓名附專名號。製作中，完成插畫及實際輸出驗證後發布。

[需求](brief.json)、[故事](story.json)、[分鏡與參考分析](design-brief.md)、[部首來源](sources/radical-check.json)、[生成紀錄](artwork-log.json)及[修訂](revisions.json)保留製作依據。

文字、姓名線及色塊為原生可編輯物件，PNG插圖可以獨立替換，不能逐筆編輯。編輯前安裝[芫荽](https://angusqaq.github.io/audio-book/assets/fonts/print/Iansui-Regular.ttf)與[芫茜雅楷](https://angusqaq.github.io/audio-book/assets/fonts/print/JyunsaiKaai-Bold.ttf)，保留[字型及授權](../../assets/fonts/print)。

安裝requirements-book.txt後，在repository根目錄執行`python3 books/the-biscuit-grew-legs/build_book.py`。以LibreOffice輸出全書PDF，Inkscape渲染全部故事SVG與活動頁，再用verify_exports.py核對實際字型、文字、字級及姓名線。未做學生試讀，本次沒有新增點讀音訊。
