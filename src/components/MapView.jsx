// src/components/MapView.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  LayersControl,
  ZoomControl
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { config } from '../config';

// 修复 Leaflet 默认图标
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

/** 根据 isRed 的布尔值创建红色/蓝色图标 */
function createCustomIcon(isRed) {
  return new L.Icon({
    iconUrl: `https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-${
      isRed ? "red" : "blue"
    }.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

/**
 * MapView组件
 *
 * @param {number[]} selectedIds - 多店ID (来自Chatbox或用户点击toggle)
 * @param {function} onToggleId - Marker点击 => toggle
 * @param {boolean} show5kmRadius - 是否显示5KM半径（由父组件App.jsx控制）
 */
export default function MapView({ 
  selectedIds = [], 
  onToggleId, 
  show5kmRadius = false 
}) {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 用户手动点击并且打开popup的店铺ID列表
  const [openPopupIds, setOpenPopupIds] = useState([]);
  
  // 地图实例
  const mapRef = useRef(null);
  // 每个Marker实例 => 方便 openPopup
  const markerRefs = useRef({});
  // 记录chatbox搜索是否已执行过居中
  const hasZoomedRef = useRef(false);
  // 跟踪上一次selectedIds，用于检测新的搜索结果
  const prevSelectedIdsRef = useRef([]);

  // 初始
  const defaultCenter = [3.139, 101.6869];
  const defaultZoom = 12;
  const radiusKM = 5;
  const radiusMeters = radiusKM * 1000;
  const zoomLevel = 14; // 搜索结果的缩放级别

  // ================ 1) fetch 数据 ================
  useEffect(() => {
    setLoading(true);
    fetch(`${config.API_URL}/outlets`)
      .then((response) => response.json())
      .then((data) => {
        setOutlets(data);
        // 如果需要保存所有数据，取消下一行的注释
        // setAllOutlets(data);
      })
      .catch((err) => {
        console.error("Error fetching outlets:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ================ 2) 计算距离 5KM ================
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ============= 3) 是否在指定ID店铺的5KM范围内 =============
  function isWithinRadius(o, targetId) {
    if (o.id === targetId) return false; // 跳过自己
    
    const targetStore = outlets.find(s => s.id === targetId);
    if (!targetStore) return false;
    
    const dist = getDistance(
      parseFloat(targetStore.latitude),
      parseFloat(targetStore.longitude),
      parseFloat(o.latitude),
      parseFloat(o.longitude)
    );
    
    return dist <= radiusKM;
  }

  // ============ 4) 点击 Marker 处理逻辑 ============
  function handleMarkerClick(store) {
    const storeId = store.id;
    
    // 检查Popup状态
    if (openPopupIds.includes(storeId)) {
      // 关闭Popup
      closePopup(storeId);
      // 同时从openPopupIds中移除
      setOpenPopupIds(prev => prev.filter(id => id !== storeId));
    } else {
      // 打开Popup
      openPopup(storeId);
      // 添加到openPopupIds
      setOpenPopupIds(prev => [...prev, storeId]);
    }
    
    // 通知父组件
    if (onToggleId) {
      onToggleId(storeId);
    }
  }

  // ============ 5) Popup 管理 ============
  // 打开指定ID的popup
  function openPopup(id) {
    const marker = markerRefs.current[id];
    if (marker) {
      marker.openPopup();
    }
  }

  // 关闭指定ID的popup
  function closePopup(id) {
    const marker = markerRefs.current[id];
    if (marker) {
      marker.closePopup();
    }
  }

  // 处理popup关闭事件
  function handlePopupClose(id) {
    // 当Popup关闭时，将ID从openPopupIds中移除
    setOpenPopupIds(prev => prev.filter(popupId => popupId !== id));
    
    // 从selectedIds中也移除该ID（通知父组件）
    if (onToggleId && selectedIds.includes(id)) {
      onToggleId(id);
    }
  }

  // ============ 6) 清除所有操作 ============
  // 用于响应父组件的清除操作
  useEffect(() => {
    if (selectedIds.length === 0 && openPopupIds.length > 0) {
      // 关闭所有弹窗
      Object.values(markerRefs.current).forEach(mk => mk.closePopup());
      // 清空所有状态
      setOpenPopupIds([]);
      // 重置缩放状态
      hasZoomedRef.current = false;
    }
  }, [selectedIds, openPopupIds.length]);

  // ============ 7) 检测新的搜索结果 ============
  // 当selectedIds变化时，检测是否为新的搜索结果
  useEffect(() => {
    const prevIds = prevSelectedIdsRef.current;
    const currentIds = selectedIds;
    
    // 检查是否为不同的搜索结果
    const isDifferentSearch = 
      prevIds.length !== currentIds.length || 
      currentIds.some(id => !prevIds.includes(id));
    
    // 如果是新的搜索结果，重置缩放状态
    if (isDifferentSearch && currentIds.length > 0) {
      hasZoomedRef.current = false;
    }
    
    // 更新上一次的搜索结果
    prevSelectedIdsRef.current = currentIds;
  }, [selectedIds]);

  // ============ 8) 监听 selectedIds => 自动居中 + 弹窗 ============
  useEffect(() => {
    if (!mapRef.current || !outlets.length) return;
    
    // 如果没有搜索结果，不处理
    if (!selectedIds || selectedIds.length === 0) {
      return;
    }

    const selectedOutletsArr = outlets.filter((o) =>
      selectedIds.includes(o.id)
    );
    if (selectedOutletsArr.length === 0) return;

    // 执行缩放和居中
    if (!hasZoomedRef.current) {
      // 标记已执行过缩放
      hasZoomedRef.current = true;
      
      // 检查是否是通过用户点击选择的（而不是通过Chatbox搜索）
      // 如果openPopupIds为空，说明这是一个新的Chatbox搜索结果
      const isChatboxSearch = openPopupIds.length === 0 || 
                              !selectedIds.some(id => openPopupIds.includes(id));
      
      // 只有Chatbox搜索结果才需要居中和放大
      if (isChatboxSearch) {
        // 居中
        const latlngs = selectedOutletsArr.map((o) => [
          parseFloat(o.latitude),
          parseFloat(o.longitude)
        ]);
        const bounds = L.latLngBounds(latlngs);

        // 多店铺时使用fitBounds并放大
        if (selectedOutletsArr.length > 1) {
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { 
              padding: [50, 50],
              animate: true,
              duration: 1 // 动画时长1秒
            });
          }
        } else if (selectedOutletsArr.length === 1) {
          // 单店铺时居中并放大
          const [lat, lng] = latlngs[0];
          if (!isNaN(lat) && !isNaN(lng)) {
            mapRef.current.setView([lat, lng], zoomLevel, { 
              animate: true,
              duration: 1 // 动画时长1秒
            });
          }
        }
      }

      // 打开初始的popup（仅对Chatbox搜索结果）
      if (isChatboxSearch) {
        selectedOutletsArr.forEach((o) => {
          openPopup(o.id);
          // 添加到打开的popup列表
          setOpenPopupIds(prev => {
            if (!prev.includes(o.id)) {
              return [...prev, o.id];
            }
            return prev;
          });
        });
      }
    }
  }, [selectedIds, outlets, openPopupIds]);

  // ============ 9) 判断是否显示红色图标 ============
  function isMarkerRed(o) {
    // 1. 如果是chatbox搜索结果，变红
    if (selectedIds.includes(o.id)) return true;
    
    // 2. 如果popup正在打开状态，变红
    if (openPopupIds.includes(o.id)) return true;
    
    // 3. 如果显示5KM模式，且在某个店铺的5KM范围内，变红
    if (show5kmRadius) {
      // 对于搜索结果，检查是否在其5KM范围内
      for (const searchId of selectedIds) {
        if (isWithinRadius(o, searchId)) return true;
      }
      
      // 对于已打开popup的店铺，检查是否在其5KM范围内
      for (const popupId of openPopupIds) {
        if (isWithinRadius(o, popupId)) return true;
      }
    }
    
    return false;
  }

  // ============ 10) 判断是否显示圆圈 ============
  function shouldShowCircle(o) {
    // 只在开启5KM模式时显示圆圈
    if (!show5kmRadius) return false;
    
    // 搜索结果或已打开popup的店铺显示圆圈
    return selectedIds.includes(o.id) || openPopupIds.includes(o.id);
  }

  return (
    <div className="h-full w-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
          <div className="text-gray-700 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span>Loading map data...</span>
          </div>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        zoomControl={false}
        whenReady={(ev) => {
          mapRef.current = ev.target;
        }}
      >
        <ZoomControl position="bottomright" />

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy;OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy;Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {outlets.map((o) => {
          if (!o.latitude || !o.longitude) return null;
          const lat = parseFloat(o.latitude);
          const lng = parseFloat(o.longitude);

          const markerIsRed = isMarkerRed(o);
          const showCircle = shouldShowCircle(o);

          return (
            <div key={o.id}>
              {showCircle && (
                <Circle
                  center={[lat, lng]}
                  radius={radiusMeters}
                  pathOptions={{
                    fillColor: "#f87171",
                    color: "#ef4444",
                    fillOpacity: 0.4,
                    weight: 3
                  }}
                />
              )}

              <Marker
                position={[lat, lng]}
                icon={createCustomIcon(markerIsRed)}
                ref={(mk) => {
                  if (mk) markerRefs.current[o.id] = mk;
                  else delete markerRefs.current[o.id];
                }}
                eventHandlers={{
                  click: () => handleMarkerClick(o)
                }}
              >
                <Popup 
                  autoClose={false} 
                  closeOnClick={false}
                  onClose={() => handlePopupClose(o.id)}
                  className="custom-popup"
                >
                  <div className="text-center p-1">
                    <h3
                      className={`font-bold text-lg ${
                        markerIsRed ? "text-red-600" : "text-blue-600"
                      } mb-1`}
                    >
                      {o.name}
                    </h3>
                    <div className="text-gray-700 mb-2">{o.address}</div>
                    <div className="text-gray-600 mb-2">
                      ⏰ {o.operating_hours}
                    </div>
                    {/* Icons */}
                    <div className="flex items-center justify-center space-x-4 mt-2">
                      {o.google_maps_link && (
                        <a
                          href={o.google_maps_link}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:opacity-80 transition-opacity"
                          title="Open in Google Maps"
                        >
                          <img
                            src="/map.png"
                            alt="Google Maps"
                            className="w-10 h-10"
                          />
                        </a>
                      )}
                      {o.waze_link && (
                        <a
                          href={o.waze_link}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:opacity-80 transition-opacity"
                          title="Open in Waze"
                        >
                          <img
                            src="/waze.png"
                            alt="Waze"
                            className="w-10 h-10"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
