import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ParkingCardProps {
    livres: number;
    ocupadas: number;
    reservadas: number;
    valorHora: string;
    onPressReservar: () => void;
}

export default function ParkingCard({ 
    livres, 
    ocupadas, 
    reservadas, 
    valorHora, 
    onPressReservar 
}) {
    const total = livres + ocupadas + reservadas;
  const porcentagemDisponivel = Math.round((livres / total) * 100);

    return (
    <View style={styles.card}>
        <View style={styles.header}>
        <Text style={styles.title}>Estacionamento Zona Sul</Text>
        <View style={styles.badgeAberto}>
            <Text style={styles.badgeText}>ABERTO</Text>
        </View>
        </View>

        <View style={styles.statsRow}>
        <View style={styles.statItem}>
            <Text style={styles.statNumberGreen}>{livres}</Text>
            <Text style={styles.statLabel}>Livres</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
            <Text style={styles.statNumberRed}>{ocupadas}</Text>
            <Text style={styles.statLabel}>Ocupadas</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
            <Text style={styles.statNumberOrange}>{reservadas}</Text>
            <Text style={styles.statLabel}>Reservadas</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
            <Text style={styles.statNumberWhite}>{total}</Text>
            <Text style={styles.statLabel}>Total</Text>
        </View>
        </View>

        <View style={styles.footer}>
        <Text style={styles.footerText}>{porcentagemDisponivel}% disponível</Text>
        <Text style={styles.priceText}>R$ {valorHora}/hora</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={onPressReservar}>
        <Text style={styles.buttonText}>Reservar Vaga</Text>
        </TouchableOpacity>
    </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1A1D21',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    badgeAberto: {
        backgroundColor: '#1B3A29',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: { color: '#2ECC71', fontSize: 12, fontWeight: 'bold' },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    statItem: { alignItems: 'center', flex: 1 },
    divider: { width: 1, height: 30, backgroundColor: '#333' },
    statNumberGreen: { color: '#2ECC71', fontSize: 24, fontWeight: 'bold' },
    statNumberRed: { color: '#E74C3C', fontSize: 24, fontWeight: 'bold' },
    statNumberOrange: { color: '#F39C12', fontSize: 24, fontWeight: 'bold' },
    statNumberWhite: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
    statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    footerText: { color: '#888', fontSize: 14 },
    priceText: { color: '#5DADE2', fontSize: 14, fontWeight: 'bold' },
    button: {
        backgroundColor: '#5DADE2',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});