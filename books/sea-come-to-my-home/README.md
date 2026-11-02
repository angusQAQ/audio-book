# 大海，來我家！

7–9歲、小二至小三自主閱讀的繁體中文氵／水部原創繪本。310個漢字、12個故事跨頁；28內頁，加封面封底共30單頁。完整插畫與原生文字排版已完成驗證。

核心海、洗、泡、浮、沉、濕；延伸流；兼認水／氵。全新人物小安、圓圓，以雨天水盆遊戲、紙船浮沉與合作造船推進情節。

- [跨頁閱讀PDF｜16畫面](https://angusqaq.github.io/audio-book/books/sea-come-to-my-home/exports/大海，來我家！_跨頁閱讀版.pdf)
- [單頁繪本PDF｜30頁](https://angusqaq.github.io/audio-book/books/sea-come-to-my-home/exports/大海，來我家！_繪本.pdf)
- [可編輯PowerPoint｜16張](https://angusqaq.github.io/audio-book/books/sea-come-to-my-home/exports/大海，來我家！_可編輯排版.pptx)
- [全書縮圖](exports/全書縮圖.png)、[SVG來源](editable)、[字型及授權](assets/fonts)

正文芫荽Iansui；氵字目芫茜雅楷JyunsaiKaai Bold、150%；「水」維持一般字級，不放大。全部小安／圓圓人名下附連續專名號。PDF嵌入實際字型；編輯PPTX與SVG前安裝assets/fonts中的兩份字型。PPTX保留原生文字框、可編輯字級／字型、姓名線與獨立插畫，SVG保留文字、線條和相對路徑圖片。PNG可以獨立替換，並非可逐筆編輯向量；SVG搬移時一併保留assets。

## 來源與重建

需求見brief.json；完整故事、分鏡、圖文分工、人物及道具設定見story.json；兩本參考書的細讀見design-brief.md。角色模型表、封面、12幅故事圖的原圖、精確提示、參考與SHA-256見artwork-log.json。部首歸屬的固定Unicode來源、相關條目與授權見sources。本次交付為繪本成品，未新增音訊或變更既有點讀書。

在獨立Python虛擬環境安裝requirements-book.txt後，從專案根目錄執行：

```bash
python3 books/sea-come-to-my-home/build_book.py
```

程式重建兩份PDF、PPTX、16份SVG、全書縮圖及validation.json，核對原稿、原圖、字型、字級、裁切、專名號及可編輯文字。

使用LibreOffice將PPTX實際另存PDF；使用已安裝字型的Inkscape將editable/s10.svg及lesson.svg各渲染為同名PNG，再執行：

```bash
python3 books/sea-come-to-my-home/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

渲染驗證逐頁核對文字、實際字型／字級、12條姓名線及圖文留白，保存render-validation.json。已查看全書原PDF與Office縮圖、封面、沉船、造船與活動頁高解析；沒有以僅檔案存在代替實際開啟。此為數位版，未另作印廠出血／CMYK製版；實際Office驗證為LibreOffice。
