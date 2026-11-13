# 餅乾長腳了！

以小一至小二程度為目標的獨立虫部故事。正文218漢字，10故事跨頁、14閱讀畫面、26單頁；採26pt短句正文，核心蜜、蜂、蝴、蝶、螞、蟻為150%手寫體，姓名附完整專名號。孩子發現掉在地上的餅乾會走，蹲下看清螞蟻後，再看牠們繞過樹枝，把點心搬回洞口。

- [跨頁閱讀PDF](https://angusqaq.github.io/audio-book/books/the-biscuit-grew-legs/exports/餅乾長腳了！_跨頁閱讀版.pdf)
- [單頁繪本PDF](https://angusqaq.github.io/audio-book/books/the-biscuit-grew-legs/exports/餅乾長腳了！_繪本.pdf)
- [可編輯PowerPoint](https://angusqaq.github.io/audio-book/books/the-biscuit-grew-legs/exports/餅乾長腳了！_可編輯排版.pptx)

學習頁從蜜蜂、蝴蝶、螞蟻三詞帶出六字，分清部首字形虫與繁體漢字蟲，普通虫／蟲字不放大。安安（安屬宀40部）、元元（元屬儿10部）均避開本書虫142部。

[需求](brief.json)、[故事](story.json)、[分鏡與參考分析](design-brief.md)、[部首來源](sources/radical-check.json)、[生成紀錄](artwork-log.json)及[修訂](revisions.json)保留製作依據。

文字、姓名線及色塊為原生可編輯物件，PNG插圖可以獨立替換，不能逐筆編輯。編輯前安裝[芫荽](https://angusqaq.github.io/audio-book/assets/fonts/print/Iansui-Regular.ttf)與[芫茜雅楷](https://angusqaq.github.io/audio-book/assets/fonts/print/JyunsaiKaai-Bold.ttf)，保留[字型及授權](../../assets/fonts/print)。

已實際以LibreOffice開啟全部14畫面，核對全文、字型、字級、10條姓名線及14項圖文留白；以Inkscape渲染全部10故事SVG與活動頁，部首來源11項及缺字0通過。成品與實際Office輸出雜湊見[原生驗證](exports/validation.json)及[實際渲染驗證](exports/render-validation.json)。已查看全部Office畫面及代表SVG。未做學生試讀，本次沒有新增點讀音訊。

安裝requirements-book.txt後，在repository根目錄執行`python3 books/the-biscuit-grew-legs/build_book.py`。以LibreOffice輸出全書PDF，Inkscape渲染全部故事SVG與活動頁，再用verify_exports.py核對實際字型、文字、字級及姓名線。
