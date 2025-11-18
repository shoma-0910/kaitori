// JIS X0401/0402 municipality codes mapping
// This is a subset for major cities and wards - can be expanded
export const municipalityCodes: Record<string, { code: string; prefecture: string; fullName: string }> = {
  // Tokyo 23 wards
  "千代田区": { code: "13101", prefecture: "東京都", fullName: "東京都千代田区" },
  "中央区": { code: "13102", prefecture: "東京都", fullName: "東京都中央区" },
  "港区": { code: "13103", prefecture: "東京都", fullName: "東京都港区" },
  "新宿区": { code: "13104", prefecture: "東京都", fullName: "東京都新宿区" },
  "文京区": { code: "13105", prefecture: "東京都", fullName: "東京都文京区" },
  "台東区": { code: "13106", prefecture: "東京都", fullName: "東京都台東区" },
  "墨田区": { code: "13107", prefecture: "東京都", fullName: "東京都墨田区" },
  "江東区": { code: "13108", prefecture: "東京都", fullName: "東京都江東区" },
  "品川区": { code: "13109", prefecture: "東京都", fullName: "東京都品川区" },
  "目黒区": { code: "13110", prefecture: "東京都", fullName: "東京都目黒区" },
  "大田区": { code: "13111", prefecture: "東京都", fullName: "東京都大田区" },
  "世田谷区": { code: "13112", prefecture: "東京都", fullName: "東京都世田谷区" },
  "渋谷区": { code: "13113", prefecture: "東京都", fullName: "東京都渋谷区" },
  "中野区": { code: "13114", prefecture: "東京都", fullName: "東京都中野区" },
  "杉並区": { code: "13115", prefecture: "東京都", fullName: "東京都杉並区" },
  "豊島区": { code: "13116", prefecture: "東京都", fullName: "東京都豊島区" },
  "北区": { code: "13117", prefecture: "東京都", fullName: "東京都北区" },
  "荒川区": { code: "13118", prefecture: "東京都", fullName: "東京都荒川区" },
  "板橋区": { code: "13119", prefecture: "東京都", fullName: "東京都板橋区" },
  "練馬区": { code: "13120", prefecture: "東京都", fullName: "東京都練馬区" },
  "足立区": { code: "13121", prefecture: "東京都", fullName: "東京都足立区" },
  "葛飾区": { code: "13122", prefecture: "東京都", fullName: "東京都葛飾区" },
  "江戸川区": { code: "13123", prefecture: "東京都", fullName: "東京都江戸川区" },
  
  // Major Tokyo cities
  "八王子市": { code: "13201", prefecture: "東京都", fullName: "東京都八王子市" },
  "立川市": { code: "13202", prefecture: "東京都", fullName: "東京都立川市" },
  "武蔵野市": { code: "13203", prefecture: "東京都", fullName: "東京都武蔵野市" },
  "三鷹市": { code: "13204", prefecture: "東京都", fullName: "東京都三鷹市" },
  "町田市": { code: "13209", prefecture: "東京都", fullName: "東京都町田市" },
  
  // Osaka
  "大阪市": { code: "27100", prefecture: "大阪府", fullName: "大阪府大阪市" },
  "堺市": { code: "27140", prefecture: "大阪府", fullName: "大阪府堺市" },
  "豊中市": { code: "27203", prefecture: "大阪府", fullName: "大阪府豊中市" },
  "吹田市": { code: "27205", prefecture: "大阪府", fullName: "大阪府吹田市" },
  "高槻市": { code: "27207", prefecture: "大阪府", fullName: "大阪府高槻市" },
  "枚方市": { code: "27210", prefecture: "大阪府", fullName: "大阪府枚方市" },
  "茨木市": { code: "27211", prefecture: "大阪府", fullName: "大阪府茨木市" },
  "八尾市": { code: "27212", prefecture: "大阪府", fullName: "大阪府八尾市" },
  "東大阪市": { code: "27227", prefecture: "大阪府", fullName: "大阪府東大阪市" },
  
  // Kyoto
  "京都市": { code: "26100", prefecture: "京都府", fullName: "京都府京都市" },
  "宇治市": { code: "26204", prefecture: "京都府", fullName: "京都府宇治市" },
  
  // Aichi
  "名古屋市": { code: "23100", prefecture: "愛知県", fullName: "愛知県名古屋市" },
  "豊田市": { code: "23211", prefecture: "愛知県", fullName: "愛知県豊田市" },
  "岡崎市": { code: "23202", prefecture: "愛知県", fullName: "愛知県岡崎市" },
  
  // Fukuoka
  "福岡市": { code: "40130", prefecture: "福岡県", fullName: "福岡県福岡市" },
  "北九州市": { code: "40100", prefecture: "福岡県", fullName: "福岡県北九州市" },
  "久留米市": { code: "40203", prefecture: "福岡県", fullName: "福岡県久留米市" },
  
  // Hokkaido
  "札幌市": { code: "01100", prefecture: "北海道", fullName: "北海道札幌市" },
  "函館市": { code: "01202", prefecture: "北海道", fullName: "北海道函館市" },
  "旭川市": { code: "01204", prefecture: "北海道", fullName: "北海道旭川市" },
  
  // Miyagi
  "仙台市": { code: "04100", prefecture: "宮城県", fullName: "宮城県仙台市" },
  
  // Kanagawa
  "横浜市": { code: "14100", prefecture: "神奈川県", fullName: "神奈川県横浜市" },
  "川崎市": { code: "14130", prefecture: "神奈川県", fullName: "神奈川県川崎市" },
  "相模原市": { code: "14150", prefecture: "神奈川県", fullName: "神奈川県相模原市" },
  "横須賀市": { code: "14201", prefecture: "神奈川県", fullName: "神奈川県横須賀市" },
  
  // Saitama
  "さいたま市": { code: "11100", prefecture: "埼玉県", fullName: "埼玉県さいたま市" },
  "川越市": { code: "11201", prefecture: "埼玉県", fullName: "埼玉県川越市" },
  "川口市": { code: "11203", prefecture: "埼玉県", fullName: "埼玉県川口市" },
  
  // Chiba
  "千葉市": { code: "12100", prefecture: "千葉県", fullName: "千葉県千葉市" },
  "市川市": { code: "12203", prefecture: "千葉県", fullName: "千葉県市川市" },
  "船橋市": { code: "12204", prefecture: "千葉県", fullName: "千葉県船橋市" },
  
  // Hyogo
  "神戸市": { code: "28100", prefecture: "兵庫県", fullName: "兵庫県神戸市" },
  "姫路市": { code: "28201", prefecture: "兵庫県", fullName: "兵庫県姫路市" },
  "西宮市": { code: "28204", prefecture: "兵庫県", fullName: "兵庫県西宮市" },
  
  // Hiroshima
  "広島市": { code: "34100", prefecture: "広島県", fullName: "広島県広島市" },
  
  // Shizuoka
  "静岡市": { code: "22100", prefecture: "静岡県", fullName: "静岡県静岡市" },
  "浜松市": { code: "22130", prefecture: "静岡県", fullName: "静岡県浜松市" },
  
  // Niigata
  "新潟市": { code: "15100", prefecture: "新潟県", fullName: "新潟県新潟市" },
  
  // Kumamoto
  "熊本市": { code: "43100", prefecture: "熊本県", fullName: "熊本県熊本市" },
  
  // Okayama
  "岡山市": { code: "33100", prefecture: "岡山県", fullName: "岡山県岡山市" },
};

export function resolveMunicipalityCode(region: string): { code: string; prefecture: string; fullName: string } | null {
  // Direct match
  if (municipalityCodes[region]) {
    return municipalityCodes[region];
  }
  
  // Try matching without suffixes like 市, 区, 町, 村
  const regionWithoutSuffix = region.replace(/[市区町村]$/, '');
  for (const [key, value] of Object.entries(municipalityCodes)) {
    if (key.startsWith(regionWithoutSuffix)) {
      return value;
    }
  }
  
  return null;
}
