# VoxCPM：按圖書選擇粵語旁白

2026-10-30（香港時間）。上游：[OpenBMB/VoxCPM](https://github.com/OpenBMB/VoxCPM)。已檢視上游 `cce58a5b59303c9bd63d12f23afe6a49a4a80c59`，實際安裝 PyPI 發布版 `voxcpm==2.0.3`。VoxCPM2 官方列出粵語及以自然語言設計聲音的支援；設定聲音方向不等於已驗證生成品質。

## 目前進度

### 配音員參考聲線與正音要求

使用者提供《梅伊第一天上學》粵語故事 MP3 作配音員聲線參考，並明確要求套用至書架全部三本書。原檔約 501.29 秒、44.1kHz 立體聲；來源雜湊及三個由停頓邊界擷取的 16kHz 單聲道候選片段記錄於 `config/voxcpm-reference.json`。候選尚未經聲線／音質聽校，不稱為已批准聲線；原故事內容不會改成點讀書正文。

粵語正音依香港中文大學《漢語多功能字庫》。`config/cantonese-pronunciation.json` 記錄查核規則；`scripts/fetch_cuhk_readings.py` 從官方頁面擷取候選音、來源網址及雜湊，保留各書上下文，**不會自動批准任何讀音**。三書共 530 個不同漢字；多音字、人名及部首名稱仍須按詞義與實際聲音核對。

`scripts/voxcpm_reference_review.py` 為三書製作 10 段真正的句子／詞語／單字試音，使用 `reference_wav_path`，保存模型 revision、參考片段雜湊、實際 MP3、時長及收據；不把尚未核對的 ASR 文字當成精確 prompt transcript。Whisper 的粵語轉寫另標為假設，不等於聲調正確或點讀對齊完成。新試音只保存 `voice-review/mei-school/`，不修改正式索引。

GitHub 的 **Review narrator reference and CUHK Cantonese readings** 流程在 `voxcpm-reference` 分支執行查音及試音，將真實結果存回同一分支。正式替換仍須完成逐語境正音、全書生成和新音訊對齊。此次本機對模型及中大字庫再次請求均收到代理 `403 Forbidden`；已在環境草稿保留既有目的地並加入 `humanum.arts.cuhk.edu.hk`，儲存草稿不代表目前網路規則已套用。

- 已在 `/workspace/.venvs/voxcpm` 安裝完整依賴，與現有 Edge 生成環境分開。`requirements-voxcpm.txt` 固定此次實際安裝的版本；CPU PyTorch 及 torchaudio 從官方 CPU 套件來源安裝，保留 TLS 與套件雜湊驗證。
- 已通過 VoxCPM/VoxCPM2、torch、torchaudio、torchcodec、soundfile 載入、CPU 矩陣運算、官方 CLI、`pip check`、安裝腳本重跑及圖書聲音設定檢查。
- **未完成模型下載與實際試音。** Hugging Face 模型資料請求被目前雲端代理拒絕：`Tunnel connection failed: 403 Forbidden`。正式試音命令亦回傳 `ProxyError`，沒有產生可用的 VoxCPM MP3。現有環境沒有 NVIDIA GPU，但上游支援 CPU，缺 GPU 不是此次下載失敗的原因。
- 正式網站仍使用已驗證的 `edge-tts`／`zh-HK-HiuMaanNeural`／`-12%` 預製 MP3；沒有把它們重新標示成 VoxCPM，也沒有顯示尚不可用的聲音選項。

## 本書的聲音方向

`config/book-voices.json` 按書本 ID 保存獨立設定。《我們的好老師》使用「親切老師・香港粵語女聲」：成年女老師、溫柔親切、發音清晰、自然香港粵語、舒緩而有耐心，適合小學生聆聽校園故事。試音文字取自原書 `p3-b6` 對應的讀音原文。

這是新的合成聲音描述，並非 VoxCPM 中的「曉曼」聲音；`zh-HK-HiuMaanNeural` 是 Edge 的聲音名稱。VoxCPM 發布版沒有相同的百分比語速參數，試音腳本在生成後以 ffmpeg `atempo=0.88` 放慢 12%。固定隨機種子由 Python／NumPy／PyTorch 設定，沒有向已安裝版本傳入不支援的 `seed` 參數。

新書需要提供自己的聲音描述、選擇原因及原書試音段落；找不到書本或配音設定時明確失敗，不默默套用另一個故事的聲音。完成試音後，應以同一個已選定的合成旁白樣本作為全書參考，避免句、詞、字各自產生不同聲線。

## 可重用命令

```sh
cd /workspace/audio-book
bash scripts/install_voxcpm.sh
/workspace/.venvs/voxcpm/bin/python scripts/voxcpm_sample.py --describe
/workspace/.venvs/voxcpm/bin/python scripts/voxcpm_sample.py --check
# 模型下載可用後：
/workspace/.venvs/voxcpm/bin/python scripts/voxcpm_sample.py --device cpu
# 或使用已完整下載的本機官方模型：
/workspace/.venvs/voxcpm/bin/python scripts/voxcpm_sample.py --model-dir /path/to/VoxCPM2 --device cpu
```

安裝腳本已實際重跑成功；模型合成、VoxCPM WAV 與 MP3 轉換路徑仍待權重可下載後驗證。試音只寫入 `.cache/voxcpm/samples/`，保存聲音描述、文字、版本、解析後的模型 revision、語速、MP3 雜湊及時長。它不改動網站資料、原 PDF、正式音檔或既有字詞時間資料。`--check` 明確回報 `modelLoaded: false`，不能視為模型已完成合成。

## 網路與環境草稿

已在既有環境設定草稿保留 GitHub、網站及 Edge 目的地，加入公開模型下載需要的 `huggingface.co`、`cdn-lfs.huggingface.co`、`cas-bridge.xethub.hf.co`、`cas-server.xethub.hf.co`、`transfer.xethub.hf.co`；另加入之後 Whisper 對齊模型使用的 `openaipublic.azureedge.net`。公開模型不需新增 API 金鑰。

草稿儲存不會更改目前機器的網路規則。需在雲端環境設定套用這些變更，再重試模型請求；不要停用 TLS、改用未驗證模型或透過其他目的地繞過拒絕。

## 正式替換前的檢查

GitHub Pages 僅提供靜態網站，VoxCPM 應在生成環境先產出 MP3，再提交 GitHub。此次尚未替換線上聲音。取得模型後須完成實際粵語試音、核對原文與發音、生成整本書全部點讀單位，再處理每個新音檔的真實對齊時間。

VoxCPM 不會提供 Edge 的 `WordBoundary` 事件。若使用 stable-ts，必須對齊新產生的音訊並檢查字詞覆蓋與時長；不可沿用舊 MP3 的時間，也不可把一個詞的時長平均分配給字來偽造同步。新音源完整驗證後，才更新正式資產、聲音來源、驗證器與發布流程；目前嚴格的 Edge 檢查維持有效。
