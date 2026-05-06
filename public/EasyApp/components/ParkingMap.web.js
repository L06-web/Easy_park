import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Car } from 'lucide-react-native';

export default function ParkingMap() {
  return (
    <View style={styles.webMapFallback}>
      <Car color="#2ECC71" size={30} />
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
    backgroundColor: '#1A1D21',
  },
  webMapTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  webMapText: {
    color: '#A9B3BC',
    fontSize: 13,
    textAlign: 'center',
  },
});
