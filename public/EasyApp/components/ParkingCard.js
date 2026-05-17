import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock3 } from 'lucide-react-native';

// interface ParkingCardProps {
//     livres: number;
//     ocupadas: number;
//     reservadas: number;
//     valorHora: string;
//     onPressReservar: () => void;
// }

export default function ParkingCard({ 
    livres, 
    ocupadas, 
    reservadas, 
    valorHora, 
    onPressReservar,
    actionLabel = 'Reservar Vaga',
    actionVariant = 'reserve',
    selectionSummary,
    disabled = false,
}) {

    const total = livres + ocupadas + reservadas;
    const porcentagemDisponivel = total > 0 ? Math.round((livres / total) * 100) : 0;

    return (
    <View style={styles.card}>
        <View style={styles.header}>
        <Text style={styles.title}>Estacionamento Centro Norte</Text>
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
        <Text style={styles.footerText}>{selectionSummary || `${porcentagemDisponivel}% disponivel`}</Text>
        <View style={styles.priceBadge}>
            <Clock3 color="#42596a" size={16} />
            <Text style={styles.priceText}>R$ {valorHora}/hora</Text>
        </View>
        </View>

        <TouchableOpacity
            style={[
                styles.button,
                actionVariant === 'release' ? styles.releaseButton : null,
                disabled || actionVariant === 'disabled' ? styles.disabledButton : null,
            ]}
            disabled={disabled || actionVariant === 'disabled'}
            onPress={onPressReservar}>
        <Text
            style={[
                styles.buttonText,
                disabled || actionVariant === 'disabled' ? styles.disabledButtonText : null,
            ]}>
            {actionLabel}
        </Text>
        </TouchableOpacity>
    </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#f4f8fc',
        borderRadius: 6,
        padding: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: '#caddea',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: { color: '#101b23', fontSize: 18, fontWeight: '800', flex: 1, paddingRight: 12 },
    badgeAberto: {
        backgroundColor: '#e5f0e8',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: { color: '#4d9a67', fontSize: 12, fontWeight: '800' },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    statItem: { alignItems: 'center', flex: 1 },
    divider: { width: 1, height: 30, backgroundColor: '#cbdce8' },
    statNumberGreen: { color: '#519b6d', fontSize: 24, fontWeight: '800' },
    statNumberRed: { color: '#E74C3C', fontSize: 24, fontWeight: 'bold' },
    statNumberOrange: { color: '#F39C12', fontSize: 24, fontWeight: 'bold' },
    statNumberWhite: { color: '#10212d', fontSize: 24, fontWeight: '800' },
    statLabel: { color: '#43596b', fontSize: 12, marginTop: 4 },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 15,
    },
    footerText: { flex: 1, color: '#43596b', fontSize: 14, fontWeight: '600' },
    priceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#caddea',
        backgroundColor: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    priceText: { color: '#10212d', fontSize: 14, fontWeight: '800' },
    button: {
        backgroundColor: '#519b6d',
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
    },
    releaseButton: {
        backgroundColor: '#F39C12',
    },
    disabledButton: {
        backgroundColor: '#d7e1e8',
    },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    disabledButtonText: {
        color: '#6b7d89',
    },
});
