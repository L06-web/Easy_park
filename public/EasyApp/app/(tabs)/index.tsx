import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import ParkingCard from '../../components/ParkingCard'; 

export default function TabOneScreen() {
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Use o IP que validamos anteriormente
    const API_URL = 'http://localhost:3000/api/vagas/status';

    const fetchData = async () => {
        try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setVagas(data);
        setLoading(false);
        } catch (error) {
        console.error("Erro na API:", error);
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const contagem = {
        livres: vagas.filter(v => v.status_atual === 'LIVRE').length,
        ocupadas: vagas.filter(v => v.status_atual === 'OCUPADA').length,
        reservadas: 0,
    };

    if (loading) {
        return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#5DADE2" />
        </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Bem-vindo ao Easy Park</Text>
            </View>

            <ParkingCard 
            livres={contagem.livres}
            ocupadas={contagem.ocupadas}
            reservadas={contagem.reservadas}
            valorHora="5,00"
            onPressReservar={() => alert('Vaga Reservada!')}
            />
        </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121417' },
    scrollContent: { padding: 20, paddingTop: 60 },
    header: { marginBottom: 30 },
    welcomeText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121417' }
});