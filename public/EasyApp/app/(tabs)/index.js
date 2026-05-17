import React, { useState, useEffect } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
    ScrollView,
    Text,
    TextInput,
} from 'react-native';
import { Filter, LogOut, MapPin, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ParkingCard from '../../components/ParkingCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import ParkingMap from '../../components/ParkingMap';
import { getUser, logout } from '../../services/authService';

const STATUS = {
    LIVRE: 'L',
    OCUPADO: 'O',
    RESERVADO: 'R',
};

function normalizeStatus(status) {
    const statusMap = {
        L: STATUS.LIVRE,
        LIVRE: STATUS.LIVRE,
        O: STATUS.OCUPADO,
        OCUPADO: STATUS.OCUPADO,
        R: STATUS.RESERVADO,
        RESERVADO: STATUS.RESERVADO,
    };

    return statusMap[status] || status;
}

function getStatusLabel(status) {
    const labelMap = {
        [STATUS.LIVRE]: 'LIVRE',
        [STATUS.OCUPADO]: 'OCUPADO',
        [STATUS.RESERVADO]: 'RESERVADO',
    };

    return labelMap[normalizeStatus(status)] || status;
}

export default function TabOneScreen() {
    const router = useRouter();
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [selectedVaga, setSelectedVaga] = useState(null);
    const [vagaSelecionadaId, setVagaSelecionadaId] = useState(null);
    const API_BASE_URL = 'http://10.0.0.126:3000/api/vagas';

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
                const response = await fetch(`${API_BASE_URL}/status`);
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

    useEffect(() => {
        const loadUser = async () => {
            const user = await getUser();
            const fullName = user?.nome_completo?.trim() || user?.nome?.trim() || '';
            const firstName = fullName.split(' ')[0];

            setUserName(firstName);
        };

        loadUser();
    }, []);

    useEffect(() => {
        if (!vagaSelecionadaId) return;

        const updatedVaga = vagas.find(vaga => vaga.id_vaga === vagaSelecionadaId);
        if (updatedVaga) {
            setSelectedVaga(updatedVaga);
        } else {
            setSelectedVaga(null);
            setVagaSelecionadaId(null);
        }
    }, [vagas, vagaSelecionadaId]);

    const campos = {
        livres: vagas.filter(v => normalizeStatus(v.status_atual) === STATUS.LIVRE).length,
        ocupadas: vagas.filter(v => normalizeStatus(v.status_atual) === STATUS.OCUPADO).length,
        reservadas: vagas.filter(v => normalizeStatus(v.status_atual) === STATUS.RESERVADO).length,
    }

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const handleSelectVaga = vaga => {
        setSelectedVaga(vaga);
        setVagaSelecionadaId(vaga.id_vaga);
    };

    const handleDeselectVaga = () => {
        setSelectedVaga(null);
        setVagaSelecionadaId(null);
    };

    const handleReservarVaga = async () => {
        if (!selectedVaga) {
            Alert.alert('Selecione uma vaga', 'Toque em uma vaga livre no mapa antes de reservar.');
            return;
        }

        const selectedStatus = normalizeStatus(selectedVaga.status_atual);
        const isReleaseAction = selectedStatus === STATUS.RESERVADO;
        const isReserveAction = selectedStatus === STATUS.LIVRE;

        if (!isReleaseAction && !isReserveAction) {
            Alert.alert('Vaga indisponivel', 'Escolha uma vaga livre ou reservada para continuar.');
            return;
        }

        try {
            const actionPath = isReleaseAction ? 'liberar' : 'reservar';
            const response = await fetch(`${API_BASE_URL}/${selectedVaga.id_vaga}/${actionPath}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const fallbackMessage =
                    response.status === 404
                        ? 'Rota não encontrada. Reinicie o backend para carregar a nova rota.'
                        : 'Nao foi possivel concluir a ação.';

                throw new Error(data.erro || data.error || fallbackMessage);
            }

            setVagas(current =>
                current.map(vaga =>
                    vaga.id_vaga === data.vaga.id_vaga ? data.vaga : vaga
                )
            );
            setSelectedVaga(data.vaga);

            Alert.alert(
                isReleaseAction ? 'Reserva desfeita' : 'Reserva realizada',
                isReleaseAction
                    ? `Vaga ${data.vaga.id_vaga} liberada com sucesso.`
                    : `Vaga ${data.vaga.id_vaga} reservada com sucesso.`
            );
        } catch (error) {
            Alert.alert('Erro na reserva', error.message);
        }
    };

    const selectedStatus = normalizeStatus(selectedVaga?.status_atual);
    const selectedStatusLabel = selectedVaga ? getStatusLabel(selectedVaga.status_atual) : null;
    const selectedVagaSummary = selectedVaga
        ? `Vaga ${selectedVaga.id_vaga} selecionada • ${selectedStatusLabel}`
        : null;
    const actionLabel =
        selectedStatus === STATUS.RESERVADO
            ? 'Desfazer Reserva'
            : selectedStatus === STATUS.OCUPADO
                ? 'Vaga Ocupada'
                : 'Reservar Vaga';
    const actionVariant =
        selectedStatus === STATUS.RESERVADO
            ? 'release'
            : selectedStatus === STATUS.OCUPADO
                ? 'disabled'
                : 'reserve';


    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}>
                <View style={styles.headerSection}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerTextGroup}>
                            <Text style={styles.headerTitle}>Olá, {userName || 'motorista'}!</Text>
                            <Text style={styles.headerSubtitle}>Encontre vagas proximas em tempo real</Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Sair"
                            style={({ pressed }) => [
                                styles.logoutButton,
                                pressed ? styles.logoutButtonPressed : null,
                            ]}
                            onPress={handleLogout}>
                            <LogOut color="#ffffff" size={22} strokeWidth={2.4} />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.searchSection}>
                    <View style={styles.searchBar}>
                        <Search color="#42596a" size={20} />
                        <TextInput
                            placeholder="Vagas de Estacionamento"
                            placeholderTextColor="#465f70"
                            style={styles.searchInput}
                        />
                        <Filter color="#42596a" size={20} />
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled">
                    {/* MAPA REAL SUBSTITUINDO O SIMULADOR */}
                    <View style={styles.mapContainer}>
                        <ParkingMap
                            vagas={vagas}
                            loading={loading}
                            initialRegion={initialRegion}
                            selectedVagaId={vagaSelecionadaId}
                            onSelectVaga={handleSelectVaga}
                            onDeselectVaga={handleDeselectVaga}
                        />
                    </View>

                    <View style={styles.locationHeader}>
                        <MapPin color="#519b6d" size={20} />
                        <View style={styles.locationTextGroup}>
                            <Text style={styles.locationTitle}>Centro da Cidade</Text>
                            <Text style={styles.selectedVagaText}>
                                {selectedVaga
                                    ? `Vaga ${selectedVaga.id_vaga} selecionada - ${getStatusLabel(selectedVaga.status_atual)}`
                                    : 'Selecione uma vaga livre no mapa'}
                            </Text>
                        </View>
                    </View>

                    <ParkingCard
                        livres={campos.livres}
                        ocupadas={campos.ocupadas}
                        reservadas={campos.reservadas}
                        valorHora="2,00"
                        onPressReservar={handleReservarVaga}
                        actionLabel={actionLabel}
                        actionVariant={actionVariant}
                        selectionSummary={selectedVagaSummary}
                        disabled={selectedStatus === STATUS.OCUPADO}
                    />

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1c2428' },
    keyboardView: { flex: 1 },
    headerSection: {
        paddingHorizontal: 24,
        paddingTop: 22,
        paddingBottom: 14,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    headerTextGroup: {
        flex: 1,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 34,
    },
    headerSubtitle: {
        marginTop: 4,
        color: '#caddea',
        fontSize: 13,
    },
    logoutButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#519b6d',
    },
    logoutButtonPressed: {
        opacity: 0.8,
    },
    searchSection: { paddingHorizontal: 20, marginBottom: 14 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f4f8fc',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#caddea',
        height: 48,
        paddingHorizontal: 13,
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    searchInput: { flex: 1, color: '#10212d', fontSize: 14 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    mapContainer: {
        height: 360,
        borderRadius: 6,
        overflow: 'hidden', // Garante que o mapa respeite o border radius
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#caddea',
        backgroundColor: '#f4f8fc',
        shadowColor: '#000000',
        shadowOpacity: 0.16,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 14,
    },
    locationTextGroup: {
        flex: 1,
    },
    locationTitle: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
    selectedVagaText: {
        marginTop: 4,
        color: '#caddea',
        fontSize: 13,
    },
});
