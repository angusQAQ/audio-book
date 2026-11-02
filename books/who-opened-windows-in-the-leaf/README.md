# 誰在葉子上開窗？

7–9歲、小二至小三自主閱讀的繁體中文原創繪本。恩恩與豆豆從葉子上的小洞開始觀察，找到毛毛蟲，再留意新芽與新葉的變化。249個漢字、10個故事跨頁；24內頁，加封面封底共26單頁。人物、情節、場景及配色與另一冊新作獨立。

核心字：花、草、葉、苗、芽、藏。人物採疊字名恩恩、豆豆；全部人名均有連續專名號。

- [跨頁閱讀PDF｜14畫面](https://angusqaq.github.io/audio-book/books/who-opened-windows-in-the-leaf/exports/誰在葉子上開窗？_跨頁閱讀版.pdf)
- [單頁繪本PDF｜26頁](https://angusqaq.github.io/audio-book/books/who-opened-windows-in-the-leaf/exports/誰在葉子上開窗？_繪本.pdf)
- [可編輯PowerPoint｜14張](https://angusqaq.github.io/audio-book/books/who-opened-windows-in-the-leaf/exports/誰在葉子上開窗？_可編輯排版.pptx)
- [全書縮圖](exports/全書縮圖.png)、[SVG來源](editable)、[字型及授權](assets/fonts)

正文芫荽Iansui；六核心與草字頭採芫茜雅楷JyunsaiKaai Bold、正文150%。部首本形「艸」維持所在文字的一般字級；活動頁並列「艸」與「艹」，字形及部首歸屬已有固定Unicode來源核對。

PDF嵌入實際字型。編輯PPTX／SVG前請安裝assets/fonts內的兩份字型；PPTX保留原生文字、可編輯字級／字型、姓名線、色塊及獨立圖像，姓名線與文字編組。SVG保留原生文字與線條，圖片使用相對路徑，搬移時須一併保留assets。PNG可以獨立替換，並非可逐筆修改的向量插畫。

## 來源與重建

[brief.json](brief.json)保存本次已確認需求；[story.json](story.json)保存完整故事、分鏡、圖文分工、人物及道具設定；[design-brief.md](design-brief.md)保存參考細讀與轉化。[artwork-log.json](artwork-log.json)記錄角色表、道具模型、封面、10幅故事圖及1份修改前版本，共14個原圖的精確提示、參考與SHA-256。部首資料、實際條目與授權見[sources](sources)。

在獨立Python虛擬環境安裝requirements-book.txt，從專案根目錄執行：

```bash
python3 books/who-opened-windows-in-the-leaf/build_book.py
```

程式重建兩份PDF、PPTX、14份SVG、全書縮圖及validation.json，核對原稿、原圖、字型／字級、缺字、單頁裁切、完整句子與引語的左右頁邊界，以及全部人名專名號的幾何。

使用LibreOffice將PPTX實際另存PDF，使用已安裝字型的Inkscape將editable/s10.svg及lesson.svg各渲染為同名PNG，再執行：

```bash
python3 books/who-opened-windows-in-the-leaf/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

實際渲染逐頁核對文字、字型／字級、姓名線及圖文留白，保存[render-validation.json](exports/render-validation.json)；原生檢查見[validation.json](exports/validation.json)。已查看原PDF與Office全書縮圖及代表頁高解析。此為數位成品；Office實測工具為LibreOffice，未作印廠出血／CMYK製版。本次沒有製作或註冊點讀音訊。
