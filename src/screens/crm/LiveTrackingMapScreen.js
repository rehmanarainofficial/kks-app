import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@config/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGetLiveTrackingMutation } from '@api/portalApi';

const LiveTrackingMapScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { employee } = route.params || {};
  const webViewRef = useRef(null);

  const [getLiveTracking, { isLoading }] = useGetLiveTrackingMutation();
  const [currentEmpData, setCurrentEmpData] = useState(employee);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fallback initial coordinates
  const initialLat = parseFloat(currentEmpData?.latitude);
  const initialLon = parseFloat(currentEmpData?.longitude);

  // Leaflet map HTML content with smooth sliding animation
  const getMapHtml = (lat, lon) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          background-color: #f8fafc;
        }
        /* Custom animated marker styling */
        .pin-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 44px;
          height: 44px;
        }
        .pin-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background-color: #0284c7; /* Sky blue primary */
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2;
        }
        .pin-pulse {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(2, 132, 199, 0.4);
          animation: pulse 1.6s infinite ease-out;
          z-index: 1;
        }
        @keyframes pulse {
          0% { transform: scale(0.4); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lon}], 16);
        
        // Voyager map tiles for clean, modern look (similar to Bykea/Yango)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap, © CARTO',
          maxZoom: 20
        }).addTo(map);

        // Custom div icon with pulse effect
        var driverIcon = L.divIcon({
          className: 'custom-driver-icon',
          html: '<div class="pin-container"><div class="pin-pulse"></div><div class="pin-avatar"><svg width="13" height="13" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div></div>',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        // Initialize driver marker
        var marker = L.marker([${lat}, ${lon}], { icon: driverIcon }).addTo(map);

        var animFrameId = null;

        // Smooth linear interpolation animation (glides the marker like Bykea/Yango)
        function animateMarker(startLatLng, endLatLng, durationMs) {
          var startTime = performance.now();
          if (animFrameId) cancelAnimationFrame(animFrameId);

          function tick(now) {
            var elapsed = now - startTime;
            var progress = Math.min(elapsed / durationMs, 1);

            // Lerp calculations
            var lat = startLatLng[0] + (endLatLng[0] - startLatLng[0]) * progress;
            var lng = startLatLng[1] + (endLatLng[1] - startLatLng[1]) * progress;

            marker.setLatLng([lat, lng]);
            map.panTo([lat, lng], { animate: true, duration: 0.1 });

            if (progress < 1) {
              animFrameId = requestAnimationFrame(tick);
            }
          }
          animFrameId = requestAnimationFrame(tick);
        }

        // Message receiver from React Native
        window.addEventListener('message', function(event) {
          try {
            var message = JSON.parse(event.data);
            if (message.type === 'UPDATE_COORDS') {
              var start = [marker.getLatLng().lat, marker.getLatLng().lng];
              var end = [parseFloat(message.latitude), parseFloat(message.longitude)];
              
              // Glide marker smoothly over 5 seconds (matching our 5-second poll)
              animateMarker(start, end, 5000);
            } else if (message.type === 'CENTER_MAP') {
              map.setView([marker.getLatLng().lat, marker.getLatLng().lng], 16, { animate: true });
            }
          } catch (e) {
            console.error('Error handling message from App:', e);
          }
        });
      </script>
    </body>
    </html>
  `;

  // Fetch coordinates of this specific employee
  const fetchDriverCoords = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await getLiveTracking({
        emp_code: currentEmpData?.EmployeeCode || '',
        date: todayStr,
      }).unwrap();

      if (res && res.status === 'true' && Array.isArray(res.data)) {
        // Find matching record
        const matchingRecord = res.data.find(
          emp => emp.EmployeeCode === currentEmpData?.EmployeeCode,
        );

        if (
          matchingRecord &&
          matchingRecord.latitude &&
          matchingRecord.longitude
        ) {
          setCurrentEmpData(matchingRecord);

          // Post coordinates to WebView for smooth marker transition
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: 'UPDATE_COORDS',
                latitude: matchingRecord.latitude,
                longitude: matchingRecord.longitude,
              }),
            );
          }
        }
      }
    } catch (error) {
      console.log('Error polling employee position:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [currentEmpData, getLiveTracking]);

  // Initial fetch and poll position every 5 seconds (gives real-time driving feeling)
  useEffect(() => {
    fetchDriverCoords();
    const interval = setInterval(fetchDriverCoords, 5000);
    return () => clearInterval(interval);
  }, [fetchDriverCoords]);

  const handleCenterMap = () => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'CENTER_MAP' }));
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Live Track Driver
        </Text>
        <TouchableOpacity style={styles.centerBtn} onPress={handleCenterMap}>
          <Icon name="navigate-circle" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: getMapHtml(initialLat, initialLon) }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadEnd={() => setInitialLoading(false)}
        />

        {initialLoading && (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[styles.loaderText, { color: theme.colors.textSecondary }]}
            >
              Initializing map viewport...
            </Text>
          </View>
        )}
      </View>

      {/* Glassmorphic Driver Info Overlay HUD */}
      <View
        style={[
          styles.hudCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.hudHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {(currentEmpData?.name || 'EMP')
                .split(' ')
                .slice(0, 2)
                .map(x => x[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.driverMeta}>
            <Text
              style={[styles.driverName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {currentEmpData?.name || 'Loading Employee...'}
            </Text>
            {currentEmpData?.father_name ? (
              <Text
                style={[styles.driverSO, { color: theme.colors.textSecondary }]}
              >
                S/O: {currentEmpData?.father_name}
              </Text>
            ) : null}
            <Text
              style={[styles.driverCode, { color: theme.colors.textSecondary }]}
            >
              Employee Code: {currentEmpData?.EmployeeCode || 'N/A'}
            </Text>
          </View>
          <View
            style={[
              styles.timeBadge,
              { backgroundColor: theme.colors.success + '15' },
            ]}
          >
            <Icon
              name="time-outline"
              size={13}
              color={theme.colors.success}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.timeText, { color: theme.colors.success }]}>
              {currentEmpData?.ActivityTime || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Location Row */}
        <View
          style={[
            styles.locRow,
            { borderTopColor: theme.colors.border + '30' },
          ]}
        >
          <Icon
            name="location-outline"
            size={16}
            color={theme.colors.secondary}
            style={{ marginTop: 2 }}
          />
          <Text
            style={[styles.locText, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {currentEmpData?.current_location || 'GPS location streaming...'}
          </Text>
        </View>

        {/* Coordinate Badges */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.badgeLabel, { color: theme.colors.textSecondary }]}
            >
              LAT:{' '}
            </Text>
            <Text style={[styles.badgeValue, { color: theme.colors.text }]}>
              {parseFloat(currentEmpData?.latitude || '0').toFixed(6)}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                marginLeft: 8,
              },
            ]}
          >
            <Text
              style={[styles.badgeLabel, { color: theme.colors.textSecondary }]}
            >
              LON:{' '}
            </Text>
            <Text style={[styles.badgeValue, { color: theme.colors.text }]}>
              {parseFloat(currentEmpData?.longitude || '0').toFixed(6)}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backBtn: {
    padding: 4,
  },
  centerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  hudCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  driverMeta: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverSO: {
    fontSize: 12,
    marginTop: 1,
  },
  driverCode: {
    fontSize: 11,
    marginTop: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    paddingTop: 10,
    marginBottom: 12,
  },
  locText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeValue: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default LiveTrackingMapScreen;
