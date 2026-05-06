import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TextInput } from 'react-native';
import { Search, Filter } from 'lucide-react-native';
import ParkingCard from '../../components/ParkingCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import ParkingMap from '../../components/ParkingMap';

export default function TabOneScreen() {
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = 'http://10.0.0.126:3000/api/vagas/status';

    // Coordenada central do seu estacionamento (Exemplo)
    const initialRegion = {
        latitude: -25.742767,
        longitude: -53.056903,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                // console.log("Dados recebidos da API:", data);
                setVagas(data);
                setLoading(false);


            } catch (error) {
                console.error("Erro na API:", error);
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const campos = {
        livres: vagas.filter(v => v.status_atual === 'LIVRE').length,
        ocupadas: vagas.filter(v => v.status_atual === 'OCUPADO').length,
        reservadas: 0,
    }


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Search color="#888" size={20} style={{ marginLeft: 10 }} />
                    <TextInput
                        placeholder="Vagas de Estacionamento"
                        placeholderTextColor="#888"
                        style={styles.searchInput}
                    />
                    <Filter color="#888" size={20} style={{ marginRight: 10 }} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* MAPA REAL SUBSTITUINDO O SIMULADOR */}
                <View style={styles.mapContainer}>
                    <ParkingMap vagas={vagas} loading={loading} initialRegion={initialRegion} />
                </View>

                <Text style={styles.locationTitle}>Centro da Cidade</Text>

                <ParkingCard
                    livres={campos.livres}
                    ocupadas={campos.ocupadas}
                    reservadas={campos.reservadas}
                    valorHora="2,00"
                    onPressStatus={() => { }}
                />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121417' },
    searchSection: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 10 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1D21',
        borderRadius: 12,
        height: 50,
    },
    searchInput: { flex: 1, color: 'white', paddingHorizontal: 10 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    mapContainer: {
        height: 400,
        borderRadius: 20,
        overflow: 'hidden', // Garante que o mapa respeite o border radius
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333'
    },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    locationTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
});
