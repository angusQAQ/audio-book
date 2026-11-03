# 這次，你找不到我！

7–9歲，以小二自主閱讀為主要目標的繁體中文原創繪本。依依借戴朋友做的長兔耳帽玩捉迷藏，兩次因露耳而被找到；她留下空帽改藏紙箱，讓朋友多找一會，卻因笑聲被發現，最後交換角色再玩。 正文354漢字，12故事跨頁、16閱讀畫面、30單頁。

提供下列完整插畫PDF及可編輯排版，正式檔案、來源及驗證報告均保存於GitHub並同步永久網站。

- [跨頁PDF](https://angusqaq.github.io/audio-book/books/this-time-you-cant-find-me/exports/這次，你找不到我！_跨頁閱讀版.pdf)
- [單頁PDF](https://angusqaq.github.io/audio-book/books/this-time-you-cant-find-me/exports/這次，你找不到我！_繪本.pdf)
- [可編輯PowerPoint](https://angusqaq.github.io/audio-book/books/this-time-you-cant-find-me/exports/這次，你找不到我！_可編輯排版.pptx)

[需求](brief.json)、[故事與理解證據](story.json)、[設計與分鏡](design-brief.md)、[精確插畫紀錄](artwork-log.json)、[部首條目](sources)保存於本專案。原始PNG獨立保留，PDF嵌字，PPTX／SVG保留原生文字、姓名線及獨立圖像。編輯前安裝共用[Iansui](https://angusqaq.github.io/audio-book/assets/fonts/print/Iansui-Regular.ttf)與[JyunsaiKaai Bold](https://angusqaq.github.io/audio-book/assets/fonts/print/JyunsaiKaai-Bold.ttf)，授權見[共用出版字型](../../assets/fonts/print)。不透明插圖在PDF／PPTX以完整解像度高品質JPEG編碼，原PNG與SVG圖像路徑保持完整。

安裝requirements-book.txt後，從repository根目錄重建：

```bash
python3 books/this-time-you-cant-find-me/build_book.py
```

以LibreOffice實際另存全書PDF，並以Inkscape渲染s03、s04、s07、s08、s10、s12、lesson為同名960×600 PNG後驗證：

```bash
python3 books/this-time-you-cant-find-me/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

成品與渲染雜湊記入exports/validation.json及exports/render-validation.json。實測工具為LibreOffice及Inkscape，未宣稱Microsoft PowerPoint、印廠CMYK／出血或新音訊測試。沒有自動加入點讀書架；本次交付PDF及可編輯檔。真實學生試讀尚未進行。
