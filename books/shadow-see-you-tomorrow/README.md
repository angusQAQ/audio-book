# 今天，換我當爸爸！

7–9歲，以小二自主閱讀為主要目標的繁體中文原創繪本。平平和爸爸互換角色玩一天；早餐開瓶、出門裝小熊和回家時都出現小意外，父子一起想辦法，結尾回扣開果醬瓶的笑點。 正文441個漢字、12個故事跨頁；28內頁，加封面封底共30單頁，16閱讀畫面。

核心字：早、晴、時、晚、明、星。選定字目以150%手寫楷體呈現，普通部首本形不放大；姓名加連續專名號。

- [跨頁閱讀PDF](https://angusqaq.github.io/audio-book/books/shadow-see-you-tomorrow/exports/今天，換我當爸爸！_跨頁閱讀版.pdf)
- [單頁繪本PDF](https://angusqaq.github.io/audio-book/books/shadow-see-you-tomorrow/exports/今天，換我當爸爸！_繪本.pdf)
- [可編輯PowerPoint](https://angusqaq.github.io/audio-book/books/shadow-see-you-tomorrow/exports/今天，換我當爸爸！_可編輯排版.pptx)
- [全書縮圖](exports/全書縮圖.png)、[SVG來源](editable)、[原始插畫](assets/illustrations)、[字型與授權](assets/fonts)

## 人物與來源

平平，八歲男孩；瘦長身形、長窄臉、大耳朵、長鼻、小杏眼、紫色長方眼鏡、黑色短平頭；群青短袖黃邊領衫、石灰短褲、白長襪、淡黃球鞋。 爸爸，三十八歲；寬肩結實、長方臉；與平平相似的大耳朵、長鼻、杏眼、弧眉與微笑嘴形；紫色長方眼鏡、黑色短平頭及短方鬍鬚；珊瑚短袖、暖灰長褲、深藍鞋。爸爸是稱謂。

[設計與理解證據](design-brief.md)、[需求](brief.json)、[故事](story.json)保存完整來源。[研究分析](../../docs/picturebook-research-20261103.md)區分學術資料、實讀摘要及研究筆記，沒有假稱已讀不可取得的論文全文。尚未進行真實學生試讀。

本次修訂前原稿、需求、精確提示和說明的位元組快照見[revisions/2026-11-03](revisions/2026-11-03)。原始插畫及舊版PDF／PPTX完整保存在[修訂前Git存檔點3c20ead](https://github.com/angusQAQ/audio-book/tree/3c20ead69eaf5ef079533682fde9018badf3d64f/books/shadow-see-you-tomorrow)，大型舊圖不在目前網站重複存放。當前原始PNG、精確生成提示、參考和SHA-256見[artwork-log.json](artwork-log.json)。參考書附件未重新公開。部首逐字核對及授權見[sources](sources)。

## 編輯與重建

PDF嵌入實際字型；PPTX／SVG編輯前請安裝assets/fonts的芫荽與芫茜雅楷。PPTX保留原生文字、字型／字級、姓名線、色塊與獨立圖像；SVG保留原生文字與相對圖像路徑，移動時須帶同assets。不透明插圖在PDF／PowerPoint內以完整解像度的高品質JPEG編碼，透明封面維持PNG；本版全部原始PNG保留於assets；舊版原圖保存在上述Git歷史，SVG亦連結原圖。插圖可獨立替換，並非可逐筆修改的向量插畫。

在工作區虛擬環境安裝requirements-book.txt，從專案根目錄執行：

```bash
python3 books/shadow-see-you-tomorrow/build_book.py
```

程式輸出兩份PDF、PowerPoint、16份SVG及全書縮圖，檢查字型缺字、原稿、原圖雜湊、單頁裁切、150%字目、普通部首字級及姓名線幾何。

將PowerPoint以LibreOffice實際另存全部頁面PDF，並以安裝了本書字型的Inkscape渲染editable內的s01、s03、s06、s09、s10、s11、s12及lesson為同名PNG後執行：

```bash
python3 books/shadow-see-you-tomorrow/verify_exports.py --office-pdf 實際Office輸出.pdf --svg-renders SVG渲染目錄
```

[validation.json](exports/validation.json)與[render-validation.json](exports/render-validation.json)保存原生及實際Office／SVG檢查結果與成品雜湊。這是數位成品；實測工具為LibreOffice，未作Microsoft PowerPoint或印廠CMYK／出血驗證。本次交付PDF與可編輯檔，沒有新增點讀音訊。

目前沿用舊的內部目錄識別shadow-see-you-tomorrow；成品及故事已改用新書名《今天，換我當爸爸！》。
