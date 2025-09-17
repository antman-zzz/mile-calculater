import csv
import json

# --- 設定 ---
AIRPORTS_CSV_PATH = 'airports.csv'
COUNTRIES_CSV_PATH = 'countries.csv'
OUTPUT_JS_PATH = 'airports.js'

CONTINENT_MAP = {
    'AS': 'アジア', 'EU': 'ヨーロッパ', 'NA': '北米',
    'SA': '南米', 'AF': 'アフリカ', 'OC': 'オセアニア', 'AN': '南極'
}
COUNTRY_NAME_JA_MAP = {
    "Japan": "日本", "United States": "アメリカ合衆国", "China": "中華人民共和国",
    "South Korea": "大韓民国", "Taiwan": "台湾", "Hong Kong": "香港",
    "United Kingdom": "イギリス", "France": "フランス", "Germany": "ドイツ",
    "Italy": "イタリア", "Spain": "スペイン", "Netherlands": "オランダ",
    "Canada": "カナダ", "Australia": "オーストラリア", "New Zealand": "ニュージーランド",
    "Singapore": "シンガポール", "Thailand": "タイ", "Malaysia": "マレーシア",
    "India": "インド", "United Arab Emirates": "アラブ首長国連邦", "Brazil": "ブラジル",
    "Mexico": "メキシコ", "Argentina": "アルゼンチン", "South Africa": "南アフリカ共和国",
    "Egypt": "エジプト", "Russia": "ロシア"
}
TARGET_AIRPORT_TYPES = {'large_airport', 'medium_airport', 'small_airport'}

# --- メイン処理 ---
def main():
    print("処理を開始します...")

    try:
        with open(COUNTRIES_CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)
            country_map = {row[1]: row[2] for row in reader if len(row) > 2}
    except FileNotFoundError:
        print(f"エラー: '{COUNTRIES_CSV_PATH}' が見つかりません。")
        return
    except Exception as e:
        print(f"エラー: '{COUNTRIES_CSV_PATH}' の読み込み中にエラー: {e}")
        return

    airport_list = []
    try:
        with open(AIRPORTS_CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            col_indices = {name: i for i, name in enumerate(header)}

            for row in reader:
                if row[col_indices['type']] in TARGET_AIRPORT_TYPES and row[col_indices['iata_code']]:
                    english_country_name = country_map.get(row[col_indices['iso_country']], row[col_indices['iso_country']])

                    airport_data = {
                        'iata': row[col_indices['iata_code']],
                        'name': row[col_indices['name']],
                        'city': row[col_indices['municipality']],
                        'country': english_country_name,
                        'continent': CONTINENT_MAP.get(row[col_indices['continent']], row[col_indices['continent']]),
                        'lat': float(row[col_indices['latitude_deg']]) if row[col_indices['latitude_deg']] else 0.0,
                        'lon': float(row[col_indices['longitude_deg']]) if row[col_indices['longitude_deg']] else 0.0
                    }
                    airport_list.append(airport_data)

    except FileNotFoundError:
        print(f"エラー: '{AIRPORTS_CSV_PATH}' が見つかりません。")
        return
    except Exception as e:
        print(f"エラー: '{AIRPORTS_CSV_PATH}' の処理中にエラー: {e}")
        return

    print(f"{len(airport_list)} 件の空港データを '{OUTPUT_JS_PATH}' に書き出します...")
    try:
        with open(OUTPUT_JS_PATH, 'w', encoding='utf-8') as f:
            f.write("const airports = ")
            json.dump(airport_list, f, ensure_ascii=False, indent=2)
            f.write(";")
    except Exception as e:
        print(f"エラー: ファイルの書き込みに失敗しました: {e}")
        return

    print("処理が完了しました！")

if __name__ == '__main__':
    main()
