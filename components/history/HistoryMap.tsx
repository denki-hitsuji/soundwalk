"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MapPoint } from "@/lib/utils/history";

// react-leaflet は SSR 不可なので dynamic import（app/map/page.tsx と同パターン）
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

type Props = {
  points: MapPoint[];
};

export default function HistoryMap({ points }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const center: [number, number] =
    points.length > 0
      ? [points[0].lat, points[0].lng]
      : [36.394095419227526, 140.5263179917782]; // 水戸駅あたり

  return (
    <section id="history-map" className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-700">あなたが立った場所</h2>
      <p className="text-xs text-gray-500">
        点と点をつないだ分だけ、あなたの音は移動してきました。
      </p>

      <div className="relative z-0 h-[360px] w-full overflow-hidden rounded-xl border bg-gray-200">
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
            {points.map((p) => (
              <Marker key={p.name} position={[p.lat, p.lng]} icon={musicPin || undefined}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-[11px] text-gray-600">ここへ {p.count} 回</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <div className="text-xs text-gray-500">
        ※ 座標が未設定の会場は地図に表示されません。
      </div>
    </section>
  );
}
