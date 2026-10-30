# 配音員參考聲線：VoxCPM 實際試音

這 10 段為真正生成的聲線試音，尚未通過逐字／聲調聽校，也未取代點讀書架的音訊。轉寫只作內容初篩，不是正音證明；語種標籤亦是識別器的分類，不能單獨用來判定粵語字音或聲調是否正確。

模型：VoxCPM2；版本：voxcpm 2.0.3；原始參考片段：48.36–62.84 秒。模型 revision、官方權重雜湊、參考片段雜湊及實際檔案雜湊保留在每段 JSON 收據。

| 圖書 | 類型 | 原文 | 實際 MP3 | 轉寫初篩（可能有誤） |
| --- | --- | --- | --- | --- |
| 走！去找那朵雲 | sentence | 琪琪加快腳步趕路。 | [播放／下載](lets-find-that-cloud-01.mp3) |  再快就不敢咯 |
| 走！去找那朵雲 | word | 琪琪 | [播放／下載](lets-find-that-cloud-02.mp3) |  Kiki |
| 走！去找那朵雲 | word | 樂樂 | [播放／下載](lets-find-that-cloud-03.mp3) |  ULUH |
| 走！去找那朵雲 | character | 趟 | [播放／下載](lets-find-that-cloud-04.mp3) |  湯 |
| 小狼，換你說！ | sentence | 狐狸抱着一疊故事書，猴子搬來小木椅，獅子掛起布幕。 | [播放／下載](little-wolf-your-turn-01.mp3) | 狐狸抱着一叠故事书猴子搬来小木耳狮子挂起布木 |
| 小狼，換你說！ | word | 狐狸 | [播放／下載](little-wolf-your-turn-02.mp3) | 狐狸 |
| 小狼，換你說！ | character | 狼 | [播放／下載](little-wolf-your-turn-03.mp3) |  Ma? |
| 我們的好老師 | sentence | 瑪麗老師親切又和藹，耐心地教我們說英語，她真是一位好老師。 | [播放／下載](our-good-teacher-01.mp3) | Mari Loci 亲切友好点Nai Xin Li Ga 我们说英语她真是一位好老师 |
| 我們的好老師 | word | 和藹 | [播放／下載](our-good-teacher-02.mp3) |  Haiiii |
| 我們的好老師 | character | 教 | [播放／下載](our-good-teacher-03.mp3) |  GAU! |

## 校音重點

逐句核對是否照原文朗讀，沒有漏字、加字或口語改寫；再核對姓名、生字、詞語和聲調。初篩已有內容差異，例如「琪琪加快腳步趕路。」的轉寫結果相差較大；需聽校判斷是聲音本身問題或辨識失準，不能直接批准。單字「狼」的時長也需檢查。

中大字庫查核結果及語境表見 [校音資料](../../reports/cantonese/README.md)。本輪關鍵字擬定讀法：琪琪 kei4 kei4、樂樂 lok6 lok6、和藹 wo4 oi2、教 gaau3、狐狸 wu4 lei4、狼 long4、趟 tong3。這些讀法已與官方候選列表對照，但未代表試音的實際字音／聲調已通過。

## 改善參考片段

[候選片段二（原錄音 01:28.25–01:43.88）](../../assets/voice-references/mei-school/candidate-02.wav)較多旁白內容，擬用於下一輪音訊續讀試音；需先取得精確粵語逐字稿。現有自動轉寫未經逐字核對，可能改寫口語，不當作已確認的精確稿。
