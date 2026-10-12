# JaiJai Travel

依「目的地 → 區域 → 分類」整理公開旅遊資訊與地圖。花蓮與曼谷在相同層级，沒有國家層。花蓮目前42筆資料；曼谷是標示「資料整理中」的空狀態，沒有虛構店家。

## 使用

Node.js 22+，無須安裝套件。

```sh
npm run check
npm test
npm run build
npm run dev
```

預覽 http://127.0.0.1:8765 。`PORT=8877 npm run dev` 可改連接埠。正式網站使用 GitHub Pages；相對路徑支援 `/JaiJai-Travel/` 子路徑。

## 資料結構

- `data/destinations.json`：同層目的地清單與預設目的地。
- `data/hualien/destination.json`：花蓮名稱、天氣位置、時區、照片及攜帶用品。
- `data/hualien/areas.json`：旅遊區域名稱與固定代號。
- `data/hualien/attractions.json`：景點。
- `data/hualien/activities.json`：活動，`parentId` 指向所屬景點或交通集合點。
- `data/hualien/restaurants.json`：餐廳、小吃、點心。
- `data/hualien/stays.json`、`transport.json`：住宿與交通。

每筆以 `areaId` 關聯區域。區域是旅遊分組，不宣稱行政邊界。資料不重複巢狀保存；畫面按區域分組，景點內可展開相關活動，同一活動也能在活動分類查詢。

## 編號

`區域代號-類型序號`，例如 `CT-P1`、`CT-A1`、`CT-F1`。P景點、A活動、F餐飲、S住宿、T交通。選定單一區域時簡寫 `P1`；完整代號仍留在地圖彈窗。`number` 是手動固定值，不依排序計算，新增資料用該區域／類型尚未使用的下一號，不重編舊資料、不回收舊號。資料的穩定識別是目的地ID＋記錄ID；展示編號不能用作外部關聯。

## 新增目的地

1. 在 catalog 加入與花蓮同層的條目。準備中用 `status: planned`，毋須建立空資料檔。
2. 啟用時建立 `data/<destination-id>/`，加入 destination、areas 與五種 collections，將 status 改為 ready。
3. 目的地內 ID 唯一，跨目的地可同名；所有 areaId、parentId 與展示編號都由驗證器检查。
4. 執行 check、test、build。一般新增目的地不需更動 UI 或天氣程式。

## 發布

Settings → Pages → GitHub Actions。PR只驗證，main合併後部署。正式網址：https://li1ycoris.github.io/JaiJai-Travel/ 。來源專案：https://github.com/Li1ycoris/hualien-travel 。原網站保留。

本次遷移正式分支42筆已上線資料（基準 a2b7d141fc6c760e889162a9a414087370907392），保留資料來源、價格、營業時間、座標與活動關係，不代表重新核實所有店家。原repo未合併PR#5的六家餐廳仍有座標問題，不納入本次遷移。

照片及 Leaflet 授權保留。地圖使用OpenStreetMap圖磚；天氣使用Open-Meteo（CC BY 4.0）。
