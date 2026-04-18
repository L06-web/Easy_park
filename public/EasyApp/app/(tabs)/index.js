import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TextInput, ActivityIndicator } from 'react-native';
import { Search, MapPin, Filter, Car } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // Adicionado PROVIDER_GOOGLE
import ParkingCard from '../../components/ParkingCard';
import { COLORS } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabOneScreen() {
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = 'http://172.18.0.202:3000/api/vagas/status';

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
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={initialRegion}
                        userInterfaceStyle="dark"
                    >
                        {vagas.map((vaga) => {
                            // Só renderiza o marcador se a vaga tiver coordenadas válidas
                            // console.log(vaga);
                            if (!vaga.latitude || !vaga.longitude) return null;

                            const pinColor = vaga.status_atual === 'LIVRE' ? "#2ECC71" : "#E74C3C";

                            return (
                                <Marker
                                    key={vaga.id_vaga}
                                    coordinate={{
                                        latitude: parseFloat(vaga.latitude),
                                        longitude: parseFloat(vaga.longitude),
                                    }}
                                    title={`Vaga ${vaga.id_vaga}`}
                                    description={`Status: ${vaga.status_atual}`}
                                    pinColor={pinColor}
                                >
                                    {/* Opcional: Customizar o ícone como no Figma */}
                                    <View style={[styles.customMarker, { borderColor: pinColor }]}>
                                        <Car color={pinColor} size={14} /> 
                                    </View>

                                </Marker>
                            );
                        })}
                    </MapView>
                </View>
''
                <View style={styles.filterRow}>
                    <View style={[styles.badge, { backgroundColor: '#1B3A29' }]}>
                        <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                        <Text style={[styles.badgeText, { color: COLORS.success }]}>Livre</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#3A1B1B' }]}>
                        <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
                        <Text style={[styles.badgeText, { color: COLORS.error }]}>Ocupada</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#3A2A1B' }]}>
                        <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
                        <Text style={[styles.badgeText, { color: COLORS.warning }]}>Reservada</Text>
                    </View>
                </View>

                <Text style={styles.locationTitle}>Centro da Cidade</Text>

                <ParkingCard
                    livres={campos.livres}
                    ocupadas={campos.ocupadas}
                    reservadas={campos.reservadas}
                    valorHora="5,00"
                    onPressStatus={() => { }}
                />

            </ScrollView>
        </SafeAreaView>
    );
}

// Estilo Dark para o Google Maps (opcional, deixa o mapa preto/cinza)
const mapDarkStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
    // ... adicione mais estilos se desejar o mapa totalmente Black
];

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
        height: 250,
        borderRadius: 24,
        overflow: 'hidden', // Garante que o mapa respeite o border radius
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333'
    },
    map: {
        width: '100%',
        height: '100%',
    },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    locationTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },

    customMarker: {
        backgroundColor: '#1A1D21',
        padding: 5,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});