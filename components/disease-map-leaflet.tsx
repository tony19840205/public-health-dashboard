'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CITY_COORDS: Record<string, [number, number]> = {
  '台北市': [25.0330, 121.5654], '新北市': [25.0116, 121.4648],
  '桃園市': [24.9936, 121.3010], '新竹市': [24.8138, 120.9675],
  '基隆市': [25.1276, 121.7392], '台中市': [24.1477, 120.6736],
  '彰化縣': [24.0518, 120.5161], '南投縣': [23.9609, 120.9719],
  '台南市': [22.9998, 120.2269], '高雄市': [22.6273, 120.3014],
  '屏東縣': [22.5519, 120.5487], '花蓮縣': [23.9871, 121.6015],
  '台東縣': [22.7583, 121.1444],
};

const DISEASE_COLORS: Record<string, string> = {
  covid19: '#ef4444', influenza: '#3b82f6', conjunctivitis: '#f59e0b',
  enterovirus: '#8b5cf6', diarrhea: '#10b981',
};

interface CityData {
  cityTotals: Record<string, number>;
  cityByDisease: Record<string, Record<string, number>>;
  maxCityTotal: number;
}

interface Props {
  cityData: CityData;
}

export default function DiseaseMapLeaflet({ cityData }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [23.7, 120.9],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    // CartoDB dark theme tiles — beautiful dark basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Zoom control on top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer);
    });

    const { cityTotals, cityByDisease, maxCityTotal } = cityData;

    Object.entries(CITY_COORDS).forEach(([city, [lat, lng]]) => {
      const total = cityTotals[city] || 0;
      if (total <= 0) return;

      // Dominant disease for color
      const diseases = cityByDisease[city] || {};
      const dominant = Object.entries(diseases).sort((a, b) => b[1] - a[1])[0];
      const color = dominant ? DISEASE_COLORS[dominant[0]] : '#475569';

      // Radius proportional to cases
      const radius = 10 + (total / maxCityTotal) * 30;

      // Outer glow circle
      L.circleMarker([lat, lng], {
        radius: radius + 8,
        color: 'transparent',
        fillColor: color,
        fillOpacity: 0.15,
        interactive: false,
      }).addTo(map);

      // Main circle
      const marker = L.circleMarker([lat, lng], {
        radius,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.6,
      }).addTo(map);

      // Build popup with per-disease breakdown
      const diseaseRows = Object.entries(diseases)
        .sort((a, b) => b[1] - a[1])
        .map(([dId, count]) => {
          const dColor = DISEASE_COLORS[dId] || '#94a3b8';
          const names: Record<string, string> = {
            covid19: 'COVID-19', influenza: '流感',
            conjunctivitis: '急性結膜炎', enterovirus: '腸病毒', diarrhea: '腹瀉群聚',
          };
          return `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;">
            <span style="width:10px;height:10px;border-radius:50%;background:${dColor};flex-shrink:0;"></span>
            <span style="flex:1;color:#cbd5e1;">${names[dId] || dId}</span>
            <span style="font-weight:700;color:${dColor};">${count}</span>
          </div>`;
        }).join('');

      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:160px;background:#1e293b;color:#f1f5f9;padding:12px;border-radius:12px;border:1px solid #334155;">
          <div style="font-size:15px;font-weight:700;margin-bottom:8px;color:#f8fafc;">
            📍 ${city}
          </div>
          <div style="border-top:1px solid #334155;padding-top:8px;">
            ${diseaseRows}
          </div>
          <div style="border-top:1px solid #334155;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#94a3b8;font-size:13px;">合計</span>
            <span style="font-size:18px;font-weight:800;color:#f8fafc;">${total} 人</span>
          </div>
        </div>
      `, {
        className: 'dark-popup',
        closeButton: false,
      });

      // Hover effect
      marker.on('mouseover', () => {
        marker.setStyle({ fillOpacity: 0.9, weight: 3 });
        marker.openPopup();
      });
      marker.on('mouseout', () => {
        marker.setStyle({ fillOpacity: 0.6, weight: 2 });
      });

      // Add city label
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'city-label',
          html: `<div style="text-align:center;transform:translateY(-${radius + 16}px);">
            <span style="font-size:12px;font-weight:700;color:#e2e8f0;text-shadow:0 1px 4px rgba(0,0,0,0.8);">${city.replace('市', '').replace('縣', '')}</span>
            <br/>
            <span style="font-size:14px;font-weight:800;color:#fff;text-shadow:0 0 8px ${color};">${total}</span>
          </div>`,
          iconSize: [60, 40],
          iconAnchor: [30, 20],
        }),
        interactive: false,
      }).addTo(map);
    });
  }, [cityData]);

  return (
    <>
      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .dark-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .dark-popup .leaflet-popup-tip {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
        }
        .city-label {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-control-zoom a {
          background: #1e293b !important;
          color: #94a3b8 !important;
          border-color: #334155 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #334155 !important;
          color: #f1f5f9 !important;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full rounded-2xl" style={{ minHeight: '500px' }} />
    </>
  );
}
