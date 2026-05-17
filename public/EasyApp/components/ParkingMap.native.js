import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

function normalizeStatus(status) {
  const statusMap = {
    L: 'L',
    LIVRE: 'L',
    O: 'O',
    OCUPADO: 'O',
    R: 'R',
    RESERVADO: 'R',
  };

  return statusMap[status] || status;
}

function getStatusStyles(status, isSelected) {
  if (status === 'L') {
    return {
      markerStyle: isSelected ? styles.freeSelectedMarker : styles.freeMarker,
      iconColor: isSelected ? '#ffffff' : '#519b6d',
    };
  }

  if (status === 'O') {
    return {
      markerStyle: isSelected ? styles.occupiedSelectedMarker : styles.occupiedMarker,
      iconColor: isSelected ? '#ffffff' : '#E74C3C',
    };
  }

  return {
    markerStyle: isSelected ? styles.reservedSelectedMarker : styles.reservedMarker,
    iconColor: isSelected ? '#ffffff' : '#F39C12',
  };
}

function CarMarkerIcon({ color }) {
  return (
    <View style={styles.carIcon}>
      {/* Topo do carro - Cabine */}
      <View style={[styles.carCabin, { backgroundColor: color }]} />
      {/* Corpo principal do carro */}
      <View style={[styles.carBody, { backgroundColor: color }]}>
        <View style={styles.carWindow} />
      </View>
      {/* Rodas */}
      <View style={styles.wheelRow}>
        <View style={[styles.carWheel, { borderColor: color }]} />
        <View style={[styles.carWheel, { borderColor: color }]} />
      </View>
    </View>
  );
}

export default function ParkingMap({
  vagas,
  loading,
  initialRegion,
  selectedVagaId,
  onSelectVaga,
  onDeselectVaga,
}) {
  if (loading) {
    return (
      <View style={styles.loadingMap}>
        <ActivityIndicator color="#519b6d" />
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={initialRegion}
      onPress={onDeselectVaga}
      userInterfaceStyle="dark">
      {vagas.map(vaga => {
        if (!vaga.latitude || !vaga.longitude) return null;

        const status = normalizeStatus(vaga.status_atual);
        const isSelected = selectedVagaId === vaga.id_vaga;
        const { markerStyle, iconColor } = getStatusStyles(status, isSelected);

        return (
          <Marker
            key={`${vaga.id_vaga}-${isSelected ? 'selected' : 'normal'}`}
            onPress={event => {
              event.stopPropagation?.();
              onSelectVaga?.(vaga);
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={isSelected ? 3 : 1}
            coordinate={{
              latitude: parseFloat(vaga.latitude),
              longitude: parseFloat(vaga.longitude),
            }}>
            <View collapsable={false} style={styles.markerRoot}>
              <View collapsable={false} style={[styles.customMarker, markerStyle]}>
                <CarMarkerIcon color={iconColor} />
                {isSelected ? (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                ) : null}
              </View>
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
    backgroundColor: '#f4f8fc',
  },
  customMarker: {
    width: 30,
    height: 30,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#101b23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'visible',
  },
  markerRoot: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 0.5,
  },
  carCabin: {
    width: 9,
    height: 4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  carBody: {
    width: 15,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    marginTop: -2,
  },
  carWindow: {
    width: 5,
    height: 0.8,
    borderRadius: 0.5,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  wheelRow: {
    width: 14,
    height: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 1,
    marginTop: 0.5,
  },
  carWheel: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  freeMarker: {
    borderColor: '#519b6d',
  },
  freeSelectedMarker: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#519b6d',
    backgroundColor: '#519b6d',
    shadowColor: '#519b6d',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 9,
  },
  occupiedMarker: {
    borderColor: '#E74C3C',
  },
  occupiedSelectedMarker: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#E74C3C',
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 9,
  },
  reservedMarker: {
    borderColor: '#F39C12',
  },
  reservedSelectedMarker: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#F39C12',
    backgroundColor: '#F39C12',
    shadowColor: '#F39C12',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 9,
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -9,
    width: 15,
    height: 15,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: '#101b23',
  },
  checkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
});
