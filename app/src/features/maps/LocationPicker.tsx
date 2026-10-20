import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Search, MapPin, Building, Plane, Train } from 'lucide-react-native';
import { TextField, Card, ListRow } from '../../components/ui';
import { mapsService, LocationItem } from './mapsService';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export interface LocationPickerProps {
  onSelect: (location: LocationItem) => void;
  selectedLocation?: LocationItem | null;
  placeholder?: string;
  label?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onSelect,
  selectedLocation,
  placeholder = 'Search destination or transit hub',
  label = 'Destination',
}) => {
  const [query, setQuery] = useState(selectedLocation?.name || '');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [curatedLocations, setCuratedLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    mapsService.fetchCuratedLocations().then((locs) => {
      setCuratedLocations(locs.filter((l) => !l.isCampus));
    });
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await mapsService.searchPlaces(query);
      setPredictions(results);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPrediction = async (prediction: any) => {
    setLoading(true);
    const details = await mapsService.getPlaceDetails(prediction.placeId);
    setLoading(false);

    if (details) {
      setQuery(details.name);
      setPredictions([]);
      onSelect(details);
    } else {
      // Fallback with name
      const fallback: LocationItem = {
        name: prediction.mainText || prediction.description,
        latitude: 28.55616,
        longitude: 77.08638,
      };
      setQuery(fallback.name);
      setPredictions([]);
      onSelect(fallback);
    }
  };

  const handleSelectCurated = (location: LocationItem) => {
    setQuery(location.name);
    setPredictions([]);
    onSelect(location);
  };

  const renderIconForType = (type?: string) => {
    switch (type) {
      case 'airport':
        return <Plane size={18} color={colors.textSecondary} />;
      case 'metro':
      case 'railway':
        return <Train size={18} color={colors.textSecondary} />;
      default:
        return <MapPin size={18} color={colors.textSecondary} />;
    }
  };

  return (
    <View style={styles.container}>
      <TextField
        label={label}
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
        leadingIcon={<Search size={18} color={colors.textSecondary} />}
        trailingIcon={
          loading ? <ActivityIndicator size="small" color={colors.textPrimary} /> : undefined
        }
      />

      {/* Autocomplete Predictions */}
      {predictions.length > 0 ? (
        <Card variant="outlined" style={styles.resultsCard}>
          {predictions.map((p) => (
            <ListRow
              key={p.placeId}
              title={p.mainText}
              subtitle={p.secondaryText}
              leading={<MapPin size={18} color={colors.textSecondary} />}
              onPress={() => handleSelectPrediction(p)}
            />
          ))}
        </Card>
      ) : null}

      {/* Curated transit suggestions if search is empty */}
      {!query && curatedLocations.length > 0 ? (
        <View style={styles.curatedSection}>
          <Text style={styles.sectionTitle}>Curated Campus Transit Hubs</Text>
          <Card variant="outlined" style={styles.resultsCard}>
            {curatedLocations.slice(0, 6).map((loc) => (
              <ListRow
                key={loc.id || loc.name}
                title={loc.name}
                subtitle={loc.type?.toUpperCase()}
                leading={renderIconForType(loc.type)}
                onPress={() => handleSelectCurated(loc)}
              />
            ))}
          </Card>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  resultsCard: {
    padding: 0,
    overflow: 'hidden',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  curatedSection: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
});
