// app/map/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/client.legacy";;

// react-leaflet は SSR 不可なので dynamic import
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false },
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false },
);
const Marker = dynamic(
  async () => (await import("react-leaflet")).Marker,
  { ssr: false },
);
const Popup = dynamic(
  async () => (await import("react-leaflet")).Popup,
  { ssr: false },
);

// Leaflet のアイコン定義（ブラウザ側でだけ実行）
// サーバー側では musicPin は null のまま
let musicPin: any = null;
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const L = require("leaflet");

  musicPin = L.icon({
    iconUrl: "/icons/pin-music.png",
    shadowUrl: "/icons/pin-music-shadow.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowSize: [40, 40],
  });
}

type Venue = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  prefecture: string | null;
};

export default function MapPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // ① クライアントであることを示すフラグ
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ② venues を読み込む（これは今まで通り）
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, latitude, longitude, city, prefecture");

      if (error) {
        console.error(error);
        setVenues([]);
      } else {
        setVenues((data ?? []) as Venue[]);
      }
      setLoading(false);
    };

    void load();
  }, []);

  const venuesWithCoords = venues.filter(
    (v) => v.latitude != null && v.longitude != null,
  );

  const center: [number, number] =
    venuesWithCoords.length > 0
      ? [venuesWithCoords[0].latitude!, venuesWithCoords[0].longitude!]
      : [36.394095419227526, 140.5263179917782]; // 水戸駅あたり

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">音楽都市マップ</h1>
        <p className="text-sm text-gray-600">
          座標が登録されている会場を地図上に表示します。
          将来的には、ここから企画中のイベントやストリートポイントも見えるようにしていきます。
        </p>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">読み込み中...</p>
      )}

      <div className="h-[480px] w-full rounded border overflow-hidden bg-gray-200">
        {/* ここがポイント：
            サーバー描画時 & クライアント初回レンダーでは isClient=false → 中身なし
            useEffect 後の2回目レンダーで isClient=true → MapContainer を描画 */}
        {isClient && (
          <MapContainer
            center={center}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {venuesWithCoords.map((v) => (
              <Marker
                key={v.id}
                position={[v.latitude!, v.longitude!]}
                icon={musicPin || undefined}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">{v.name}</div>
                    {(v.prefecture || v.city) && (
                      <div className="text-[11px] text-gray-600">
                        {[v.prefecture, v.city]
                          .filter(Boolean)
                          .join(" ")}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <div className="text-xs text-gray-500">
        ※ 座標が未設定の会場は地図に表示されません。
        venues.csv に latitude / longitude を追加して seed し直すことで、ここにピンが増えていきます。
      </div>
    </main>
  );
}
