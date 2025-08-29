document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const airportAInput = document.getElementById('airportA');
    const airportBInput = document.getElementById('airportB');
    const calculateBtn = document.getElementById('calculate');
    const distanceEl = document.getElementById('distance');
    const percentageInput = document.getElementById('percentage');
    const calculatePercentageBtn = document.getElementById('calculate-percentage');
    const percentageResultEl = document.getElementById('percentage-result');
    const airportListEl = document.getElementById('airport-list');

    let airports = [];
    let routeLayer;

    // 空港データの読み込みとUIの初期化
    fetch('airports.json')
        .then(response => response.json())
        .then(data => {
            airports = data;
            displayAirportList(airports);
        });

    // 国と地域のマッピング
    const countryToRegion = {
        'Japan': 'アジア',
        'United States': '北米',
        'United Kingdom': 'ヨーロッパ',
        'France': 'ヨーロッパ',
        'Singapore': 'アジア',
        'Australia': 'オセアニア'
    };

    // 地域 > 国 > 空港 の階層でデータをグループ化し、リストを表示
    function displayAirportList(airports) {
        const regions = airports.reduce((acc, airport) => {
            const region = countryToRegion[airport.country] || 'その他';
            if (!acc[region]) {
                acc[region] = {};
            }
            if (!acc[region][airport.country]) {
                acc[region][airport.country] = [];
            }
            // 重複を避けてIATAコードを追加
            if (!acc[region][airport.country].includes(airport.iata)) {
                acc[region][airport.country].push(airport.iata);
            }
            return acc;
        }, {});

        let html = '';
        for (const region in Object.keys(regions).sort()) { // 地域名をソート
            const regionName = Object.keys(regions).sort()[region];
            html += `<details class="region-details">`;
            html += `<summary class="region-summary">${regionName}</summary>`;
            html += '<ul class="country-list">';
            for (const country in regions[regionName]) {
                const iataCodes = regions[regionName][country]
                    .map(iata => `<span class="airport-code">${iata}</span>`)
                    .join(', ');
                html += `<li>${country}（${iataCodes}）</li>`;
            }
            html += '</ul>';
            html += `</details>`;
        }
        // airport-list の h2 タグの後に内容を追加
        airportListEl.querySelector('h2').insertAdjacentHTML('afterend', html);
    }

    // 空港コードクリックで入力欄に自動入力
    airportListEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('airport-code')) {
            const code = e.target.textContent;
            if (airportAInput.value === '') {
                airportAInput.value = code;
            } else if (airportBInput.value === '') {
                airportBInput.value = code;
            } else {
                airportBInput.value = code; // 両方埋まっている場合はBを上書き
            }
        }
    });

    // ハバーサイン公式による距離計算
    function haversineDistance(coords1, coords2) {
        const toRad = (x) => x * Math.PI / 180;
        const R = 3958.8; // マイル単位の地球の半径

        const dLat = toRad(coords2.lat - coords1.lat);
        const dLon = toRad(coords2.lon - coords1.lon);
        const lat1 = toRad(coords1.lat);
        const lat2 = toRad(coords2.lat);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // 計算ボタンのイベントリスナー
    calculateBtn.addEventListener('click', () => {
        const iataA = airportAInput.value.toUpperCase();
        const iataB = airportBInput.value.toUpperCase();

        const airportA = airports.find(a => a.iata === iataA);
        const airportB = airports.find(a => a.iata === iataB);

        if (airportA && airportB) {
            const distance = haversineDistance(airportA, airportB);
            distanceEl.textContent = `距離: ${distance.toFixed(2)} miles`;
            distanceEl.dataset.distance = distance; // パーセンテージ計算用に距離を保存

            // 地図の更新
            updateMap(airportA, airportB);
        } else {
            alert('有効な空港コードを2つ入力してください。');
        }
    });

    // パーセンテージ計算ボタンのイベントリスナー
    calculatePercentageBtn.addEventListener('click', () => {
        const baseDistance = parseFloat(distanceEl.dataset.distance);
        const percentage = parseFloat(percentageInput.value);

        if (!isNaN(baseDistance) && !isNaN(percentage)) {
            const result = baseDistance * (percentage / 100);
            percentageResultEl.textContent = `結果: ${result.toFixed(2)} miles`;
        } else {
            alert('まず距離を計算し、有効なパーセンテージを入力してください。');
        }
    });

    // 地図上にルートを表示
    function updateMap(airportA, airportB) {
        if (routeLayer) {
            map.removeLayer(routeLayer);
        }

        const latlngs = [
            [airportA.lat, airportA.lon],
            [airportB.lat, airportB.lon]
        ];

        const polyline = L.polyline(latlngs, { color: 'blue' });
        const markers = L.layerGroup([
            L.marker(latlngs[0]).bindPopup(`${airportA.iata}<br>${airportA.name}`),
            L.marker(latlngs[1]).bindPopup(`${airportB.iata}<br>${airportB.name}`)
        ]);

        routeLayer = L.layerGroup([polyline, markers]).addTo(map);
        map.fitBounds(polyline.getBounds().pad(0.1));
    }
});