// 日本の主要駅（緯度経度付き）
export interface Station {
  name: string;
  latitude: number;
  longitude: number;
  prefectures: string[];
}

export const majorStations: Station[] = [
  // 東京周辺
  { name: "東京駅", latitude: 35.6762, longitude: 139.7674, prefectures: ["東京都"] },
  { name: "新宿駅", latitude: 35.6895, longitude: 139.7004, prefectures: ["東京都"] },
  { name: "渋谷駅", latitude: 35.6595, longitude: 139.7004, prefectures: ["東京都"] },
  { name: "横浜駅", latitude: 35.4437, longitude: 139.6380, prefectures: ["神奈川県"] },
  { name: "川崎駅", latitude: 35.5307, longitude: 139.7029, prefectures: ["神奈川県"] },
  
  // 大阪周辺
  { name: "大阪駅", latitude: 34.7024, longitude: 135.4937, prefectures: ["大阪府"] },
  { name: "梅田駅", latitude: 34.7041, longitude: 135.4948, prefectures: ["大阪府"] },
  { name: "心斎橋駅", latitude: 34.6711, longitude: 135.5034, prefectures: ["大阪府"] },
  { name: "京都駅", latitude: 34.7648, longitude: 135.7555, prefectures: ["京都府"] },
  { name: "神戸駅", latitude: 34.6901, longitude: 135.1868, prefectures: ["兵庫県"] },
  
  // 名古屋
  { name: "名古屋駅", latitude: 35.1708, longitude: 136.8825, prefectures: ["愛知県"] },
  
  // 福岡
  { name: "博多駅", latitude: 33.8891, longitude: 130.4204, prefectures: ["福岡県"] },
  
  // 札幌
  { name: "札幌駅", latitude: 43.0642, longitude: 141.3469, prefectures: ["北海道"] },
];

// 2点間の距離（Haversine公式）を計算（km単位）
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球の半径（km）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 最寄り駅を見つける
export function findNearestStations(latitude: number, longitude: number, count: number = 3): Array<Station & { distance: number }> {
  const stationsWithDistance = majorStations
    .map(station => ({
      ...station,
      distance: calculateDistance(latitude, longitude, station.latitude, station.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
  
  return stationsWithDistance;
}

// スコアリング関数
export interface StationInfo {
  name: string;
  distance: number;
}

export function calculateAccessibilityScore(stationInfo: StationInfo | null, hasParking: boolean): { score: number; stationInfo: StationInfo | null } {
  let distanceScore = 0;
  
  if (stationInfo) {
    const distance = stationInfo.distance;
    if (distance <= 0.5) {
      distanceScore = 20;
    } else if (distance <= 1) {
      distanceScore = 15;
    } else if (distance <= 2) {
      distanceScore = 8;
    } else if (distance < 3) {
      distanceScore = 3;
    } else {
      distanceScore = 0;
    }
  }
  
  const parkingScore = hasParking ? 80 : 0;
  const totalScore = Math.min(distanceScore + parkingScore, 100);
  
  return {
    score: totalScore,
    stationInfo,
  };
}
