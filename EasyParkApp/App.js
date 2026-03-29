import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Car, CircleCheck, CircleAlert } from 'lucide-react-native';

export default function App() {
    const [vagas, setVagas] = useState([]);

  // Função para buscar dados do seu Backend Node.js
    const fetchVagas = async () => {
    try {
      // SUBSTITUA PELO SEU IP LOCAL (Ex: 192.168.0.50) 
      // Não use 'localhost' aqui, pois o celular não entenderá
        const response = await fetch('http://10.0.0.126:3000/api/vagas/status');
        const data = await response.json();
        setVagas(data);
    } catch (error) {
        console.error("Erro ao conectar com o servidor:", error);
    }
    };

    useEffect(() => {
    fetchVagas();
    const interval = setInterval(fetchVagas, 3000); // Atualiza a cada 3 segundos
    return () => clearInterval(interval);
    }, []);

    return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.title}>Easy Park</Text>
        <Text style={styles.subtitle}>Gestão de Vagas em Tempo Real</Text>
        </View>

        <ScrollView contentContainerStyle={styles.parkingGrid}>
        {vagas.map((vaga) => (
            <View 
            key={vaga.id_vaga} 
            style={[styles.vagaCard, vaga.status_atual === 'OCUPADA' ? styles.ocupada : styles.livre]}
            >
            <Text style={styles.vagaNome}>Vaga {vaga.id_vaga}</Text>
            
            {vaga.status_atual === 'OCUPADA' ? (
                <View style={styles.statusInfo}>
                <Car color="white" size={48} />
                <Text style={styles.statusText}>OCUPADA</Text>
                </View>
            ) : (
                <View style={styles.statusInfo}>
                <CircleCheck color="white" size={48} />
                <Text style={styles.statusText}>LIVRE</Text>
                </View>
            )}
            </View>
        ))}
        </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#1a1a1a', alignItems: 'center' },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: '#aaa', fontSize: 14 },
    parkingGrid: { padding: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    vagaCard: {
    width: 150,
    height: 180,
    margin: 10,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS
    },
    livre: { backgroundColor: '#2ecc71' },
    ocupada: { backgroundColor: '#e74c3c' },
    vagaNome: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    statusInfo: { alignItems: 'center' },
    statusText: { color: 'white', fontWeight: 'bold', marginTop: 10 }
});