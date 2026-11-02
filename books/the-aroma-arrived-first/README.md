# 香味先到了

7–9歲、小二至小三自主閱讀的繁體中文火部原創繪本。米米幫婆婆準備街坊小聚會，空着的桌子、被紙袋擋住的小燈和先飄進巷子的香氣，帶出等待、參與和相聚。313個漢字、12個故事跨頁；28內頁，加封面封底共30單頁。完整插畫與原生文字排版已完成驗證。

核心字為炒、煮、烤、燈、照、熱，兼認火／灬；部首歸屬已逐字核對。原創人物、情節及配色與同期心部繪本獨立。

- [跨頁閱讀PDF｜16畫面](https://angusqaq.github.io/audio-book/books/the-aroma-arrived-first/exports/香味先到了_跨頁閱讀版.pdf)
- [單頁繪本PDF｜30頁](https://angusqaq.github.io/audio-book/books/the-aroma-arrived-first/exports/香味先到了_繪本.pdf)
- [可編輯PowerPoint｜16張](https://angusqaq.github.io/audio-book/books/the-aroma-arrived-first/exports/香味先到了_可編輯排版.pptx)
- [全書縮圖](exports/全書縮圖.png)、[SVG來源](editable)、[字型及授權](assets/fonts)

正文使用芫荽Iansui；六字使用芫茜雅楷JyunsaiKaai Bold、正文150%，說明中的「火」維持一般字級。全部米米人名下附連續專名號；婆婆為稱謂。活動頁辨識「煮、魚、想」的部首，也說明現代電燈不必有明火，不能只看四點便判定火部。

PDF已嵌入實際字型；編輯PPTX／SVG前請安裝assets/fonts中的兩份字型。PPTX保留原生文字框、可編輯字級／字型、姓名線與獨立插畫；SVG保留文字、線條和相對路徑圖片。PNG可獨立替換，並非可逐筆編輯向量；移動SVG時須一併保留assets。

## 來源與重建

需求見[brief.json](brief.json)，完整故事、分鏡和角色／道具設定見[story.json](story.json)，兩本參考書的細讀與轉化見[design-brief.md](design-brief.md)。[artwork-log.json](artwork-log.json)保存角色表、封面、12幅正式故事圖及兩份修改前版本的精確提示、參考與SHA-256，共16個圖檔。Unicode17.0部首資料的固定來源、相關條目及授權見[sources](sources)。

在獨立Python虛擬環境安裝requirements-book.txt後，從專案根目錄執行：

```bash
python3 books/the-aroma-arrived-first/build_book.py
```

程式重建兩份PDF、PPTX、16份SVG、全書縮圖及validation.json，核對原稿、原圖、字型／字級、單頁裁切、專名號及可編輯文字。使用LibreOffice將PPTX另存PDF，並以已安裝字型的Inkscape將editable/s10.svg與lesson.svg各渲染為同名PNG，再執行：

```bash
python3 books/the-aroma-arrived-first/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

實際LibreOffice全部16頁文字、兩種字型、放大字級與7條姓名線均相符；28個文字／底圖留白檢查通過。已查看原PDF及Office全書縮圖、SVG搬桌布與活動頁；食物、燈的遮擋與移動、桌布出現時序及成人操作熱食逐頁核對。結果見[原生檢查](exports/validation.json)與[實際渲染檢查](exports/render-validation.json)。此為數位版；未作印廠出血／CMYK製版，Office驗證工具為LibreOffice。本次未製作點讀音訊。
