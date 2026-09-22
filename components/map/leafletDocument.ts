/**
 * Self-contained Leaflet page rendered inside a React Native WebView.
 * OpenStreetMap tiles only. All marker data is applied later with updatePulseMap().
 */
export function buildLeafletDocument(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e5e7eb; }
    .leaflet-container { height: 100%; width: 100%; background: #e5e7eb; font-family: sans-serif; }
    .pulse-popup { min-width: 180px; max-width: 230px; }
    .pulse-popup .name { font-weight: 800; font-size: 13px; color: #0f172a; line-height: 1.3; }
    .pulse-popup .meta { margin-top: 4px; font-size: 11px; color: #64748b; }
    .pulse-popup .dist { margin-top: 6px; font-size: 11px; font-weight: 700; color: #1d4ed8; }
    .pulse-popup .beds { margin-top: 2px; font-size: 11px; font-weight: 700; color: #047857; }
    .pulse-popup button {
      margin-top: 8px; width: 100%; border: 0; border-radius: 8px;
      background: #dc2626; color: #fff; font-weight: 800; font-size: 12px; padding: 8px 10px;
    }
    .leaflet-control-attribution { font-size: 10px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function post(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    }
    window.__leafletBootFailed = function () {
      post({ type: 'leaflet-failed' });
    };
  </script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="window.__leafletBootFailed()"></script>
  <script>
    (function () {
      if (!window.L) {
        post({ type: 'leaflet-failed' });
        return;
      }

      var map = L.map('map', {
        zoomControl: false,
        attributionControl: true,
        center: [21.1384, 79.1235],
        zoom: 13
      });
      window.__pulseMap = map;

      var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
        attribution: '&copy; OpenStreetMap contributors'
      });
      var tileOk = 0;
      var tileFail = 0;
      tiles.on('tileload', function () {
        tileOk += 1;
        if (tileOk === 1) post({ type: 'tile-ok' });
      });
      tiles.on('tileerror', function () {
        tileFail += 1;
        if (tileFail >= 3 && tileOk === 0) post({ type: 'tile-error' });
      });
      tiles.addTo(map);
      window.__pulseTiles = tiles;

      var markers = [];
      var routeGlow = null;
      var routeLine = null;

      function markerIcon(html, size, anchor) {
        return L.divIcon({
          className: 'pulse-marker',
          html: html,
          iconSize: [size, size],
          iconAnchor: anchor
        });
      }

      function dot(color, size) {
        return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color +
          ';border:2px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,.35)"></div>';
      }

      function textNode(parent, className, value) {
        var el = document.createElement('div');
        el.className = className;
        el.textContent = value == null ? '' : String(value);
        parent.appendChild(el);
        return el;
      }

      function clearLayers() {
        markers.forEach(function (marker) { map.removeLayer(marker); });
        markers = [];
        if (routeGlow) { map.removeLayer(routeGlow); routeGlow = null; }
        if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
      }

      window.updatePulseMap = function (data) {
        if (!data) return;
        clearLayers();
        var bounds = [];

        if (!data.placesOnly && data.route && data.route.length > 1) {
          routeGlow = L.polyline(data.route, { color: '#0284C7', weight: 8, opacity: 0.45 }).addTo(map);
          routeLine = L.polyline(data.route, { color: '#2563EB', weight: 4, opacity: 0.95 }).addTo(map);
          data.route.forEach(function (point) { bounds.push(point); });
        }

        function plainPopup(text) {
          var el = document.createElement('div');
          el.style.fontWeight = '700';
          el.style.fontSize = '13px';
          el.style.color = '#0f172a';
          el.textContent = text || '';
          return el;
        }

        if (!data.placesOnly && data.vehicle) {
          var vehicle = L.marker([data.vehicle.lat, data.vehicle.lng], {
            icon: markerIcon(dot('#F59E0B', 16), 16, [8, 8]),
            zIndexOffset: 400
          });
          vehicle.bindPopup(plainPopup(data.vehicle.name || 'Ambulance'));
          vehicle.addTo(map);
          markers.push(vehicle);
          bounds.push([data.vehicle.lat, data.vehicle.lng]);
        }

        if (!data.placesOnly && data.origin) {
          var origin = L.marker([data.origin.lat, data.origin.lng], {
            icon: markerIcon(dot('#DC2626', 26), 26, [13, 13]),
            zIndexOffset: 500
          });
          origin.bindPopup(plainPopup(data.origin.name || 'Start'));
          origin.addTo(map);
          markers.push(origin);
          bounds.push([data.origin.lat, data.origin.lng]);
        }

        if (!data.placesOnly && data.destination) {
          var destination = L.marker([data.destination.lat, data.destination.lng], {
            icon: markerIcon(dot('#2563EB', 22), 22, [11, 11]),
            zIndexOffset: 450
          });
          destination.bindPopup(plainPopup(data.destination.name || 'Destination'));
          destination.addTo(map);
          markers.push(destination);
          bounds.push([data.destination.lat, data.destination.lng]);
        }

        (data.hospitals || []).forEach(function (hospital) {
          var pin = hospital.markerTone === 'available' ? '#1F9D62' : hospital.markerTone === 'limited' ? '#F5C518' : hospital.markerTone === 'unavailable' ? '#8B97A6' : '#DC2626';
          var pinText = hospital.markerTone === 'limited' ? '#111' : '#fff';
          var iconHtml = '<div style="width:26px;height:26px;border-radius:50%;background:' + pin + ';border:' +
            (hospital.isTarget ? '3px solid #111' : '2px solid #fff') +
            ';color:' + pinText + ';font-weight:800;font-size:16px;line-height:22px;text-align:center;box-shadow:0 2px 6px rgba(15,23,42,.35)">+</div>';
          var marker = L.marker([hospital.lat, hospital.lng], {
            icon: markerIcon(iconHtml, 26, [13, 13]),
            zIndexOffset: hospital.isTarget ? 600 : 300
          });
          var popup = document.createElement('div');
          popup.className = 'pulse-popup';
          textNode(popup, 'name', hospital.name);
          textNode(popup, 'meta', hospital.address);
          if (hospital.markerNote) {
            textNode(popup, 'dist', hospital.distanceKm + ' km away');
            textNode(popup, 'beds', hospital.markerNote);
            if (hospital.markerUpdated) textNode(popup, 'meta', hospital.markerUpdated);
          } else {
            textNode(popup, 'dist', hospital.distanceKm + ' km · ' + hospital.etaMins + ' min');
            textNode(popup, 'beds', 'Beds free: ' + hospital.generalBedsFree + ' ward / ' + hospital.icuBedsFree + ' ICU');
            var button = document.createElement('button');
            button.type = 'button';
            button.textContent = hospital.isTarget ? 'Assigned hospital' : 'Set as target hospital';
            button.onclick = function () {
              post({ type: 'select-hospital', id: hospital.id });
            };
            popup.appendChild(button);
          }
          marker.bindPopup(popup);
          marker.addTo(map);
          markers.push(marker);
          bounds.push([hospital.lat, hospital.lng]);
        });

        if (data.interactive === false) {
          map.dragging.disable();
          map.touchZoom.disable();
          map.doubleClickZoom.disable();
          map.scrollWheelZoom.disable();
        } else {
          map.dragging.enable();
          map.touchZoom.enable();
          map.doubleClickZoom.enable();
          map.scrollWheelZoom.enable();
        }

        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16, animate: false });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 14, { animate: false });
        }
        setTimeout(function () { map.invalidateSize(); }, 60);
      };

      window.pulseZoom = function (delta) {
        if (!window.__pulseMap) return;
        window.__pulseMap.setZoom(window.__pulseMap.getZoom() + delta);
      };

      window.pulseRecenter = function (lat, lng) {
        if (!window.__pulseMap) return;
        window.__pulseMap.setView([lat, lng], Math.max(window.__pulseMap.getZoom(), 14), { animate: true });
      };

      setTimeout(function () { map.invalidateSize(); post({ type: 'ready' }); }, 40);
    })();
  </script>
</body>
</html>`;
}
