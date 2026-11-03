# 紅鉛筆去哪裏了？

全新竹字頭校園尋物故事，7–9歲，以小二自主閱讀為主要目標。彤彤想畫完紅恐龍，卻找不到借給老師的紅鉛筆；她依紅色和兩條白線辨認，最後自己發現答案。正文332漢字，10故事跨頁，14閱讀畫面，24內頁加封面封底共26單頁。

目前製作中；完成插畫、原生檔及實際渲染驗證後才發布下列成品。

- [跨頁PDF](https://angusqaq.github.io/audio-book/books/where-is-the-red-pencil/exports/紅鉛筆去哪裏了？_跨頁閱讀版.pdf)
- [單頁PDF](https://angusqaq.github.io/audio-book/books/where-is-the-red-pencil/exports/紅鉛筆去哪裏了？_繪本.pdf)
- [可編輯PowerPoint](https://angusqaq.github.io/audio-book/books/where-is-the-red-pencil/exports/紅鉛筆去哪裏了？_可編輯排版.pptx)

[需求](brief.json)、[故事與理解問題](story.json)、[設計及逐跨頁連貫](design-brief.md)、[人物與原圖精確提示](artwork-log.json)、[字型及授權](assets/fonts)、[部首條目](sources)均保存於本專案。來源的兩份參考PDF不重新公開。

PDF嵌入字型；PPTX與SVG保留原生文字、150%手寫字、完整姓名線及獨立圖像。編輯前安裝assets/fonts內兩份TTF。PNG可獨立替換，不是可逐筆修改的向量插畫。PDF／PPTX的不透明圖像以完整解像度高品質JPEG編碼，透明封面保留PNG；原始PNG與SVG連結來源均保留。

從repository根目錄安裝requirements-book.txt後重建：

```bash
python3 books/where-is-the-red-pencil/build_book.py
```

實際以LibreOffice開啟並另存全書PDF；以Inkscape渲染s02、s04、s06、s07、s10及lesson為同名960×600 PNG，再驗證：

```bash
python3 books/where-is-the-red-pencil/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

驗證報告保存於exports/validation.json與exports/render-validation.json。實測工具為LibreOffice及Inkscape，未聲稱Microsoft PowerPoint或印廠CMYK／出血測試。本次交付PDF及可編輯檔，沒有另加點讀音訊。實際兒童試讀尚未進行。
