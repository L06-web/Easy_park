import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Car } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function ParkingMap({ vagas, loading, initialRegion }) {
  if (loading) {
    return (
      <View style={styles.loadingMap}>
        <ActivityIndicator color="#2ECC71" />
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={initialRegion}
      userInterfaceStyle="dark">
      {vagas.map(vaga => {
        if (!vaga.latitude || !vaga.longitude) return null;

        const pinColor = vaga.status_atual === 'LIVRE' ? '#2ECC71' : '#E74C3C';

        return (
          <Marker
            key={vaga.id_vaga}
            coordinate={{
              latitude: parseFloat(vaga.latitude),
              longitude: parseFloat(vaga.longitude),
            }}
            title={`Vaga ${vaga.id_vaga}`}
            description={`Status: ${vaga.status_atual}`}
            pinColor={pinColor}>
            <View style={[styles.customMarker, { borderColor: pinColor }]}>
              <Car color={pinColor} size={14} />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  loadingMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1D21',
  },
  customMarker: {
    backgroundColor: '#1A1D21',
    padding: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
