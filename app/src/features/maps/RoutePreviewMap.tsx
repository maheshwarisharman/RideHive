import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { mutedLightMapStyle } from './mapStyle';
import { colors, radii } from '../../theme/tokens';

export interface RoutePreviewMapProps {
  origin: { latitude: number; longitude: number; name?: string };
  destination: { latitude: number; longitude: number; name?: string };
  coordinates?: { latitude: number; longitude: number }[];
  height?: number;
}

export const RoutePreviewMap: React.FC<RoutePreviewMapProps> = ({
  origin,
  destination,
  coordinates,
  height = 220,
}) => {
  const mapRef = useRef<MapView | null>(null);

  const polylineCoords =
    coordinates && coordinates.length > 0
      ? coordinates
      : [
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ];

  useEffect(() => {
    if (mapRef.current && polylineCoords.length > 0) {
      mapRef.current.fitToCoordinates(polylineCoords, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  }, [origin, destination, polylineCoords]);

  // Initial region centered between points
  const initialRegion = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta: Math.max(Math.abs(origin.latitude - destination.latitude) * 1.5, 0.05),
    longitudeDelta: Math.max(Math.abs(origin.longitude - destination.longitude) * 1.5, 0.05),
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={mutedLightMapStyle}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* Route line: Solid black 4px */}
        <Polyline
          coordinates={polylineCoords}
          strokeColor={colors.black}
          strokeWidth={4}
        />

        {/* Pickup marker: Solid black circle with white outline */}
        <Marker
          coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
          title={origin.name || 'Pickup (Campus)'}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.originMarker}>
            <View style={styles.originInner} />
          </View>
        </Marker>

        {/* Dropoff marker: Solid black square with white outline */}
        <Marker
          coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
          title={destination.name || 'Drop-off'}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.destinationMarker} />
        </Marker>
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  originMarker: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.black,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  originInner: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.black,
  },
  destinationMarker: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.black,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
