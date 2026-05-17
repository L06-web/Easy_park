import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Car } from 'lucide-react-native';

export default function ParkingMap() {
  return (
    <View style={styles.webMapFallback}>
      <Car color="#519b6d" size={30} />
      <Text style={styles.webMapTitle}>Mapa disponivel no app mobile</Text>
      <Text style={styles.webMapText}>Use esta tela web para validar login e cadastro.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    backgroundColor: '#f4f8fc',
  },
  webMapTitle: {
    color: '#101b23',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  webMapText: {
    color: '#43596b',
    fontSize: 13,
    textAlign: 'center',
  },
});
