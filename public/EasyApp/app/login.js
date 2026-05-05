import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    SafeAreaView,
    KeyboardAvoidingView,
    Platform 
} from 'react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = () => {
        // Aqui conectaremos com sua rota de backend: /api/usuarios/login
        if (email !== '' && password !== '') {
        console.log("Login realizado!");
        
        // 3. Navegar para a rota do mapa (que está dentro do grupo tabs)
        router.replace('/(tabs)'); 
        } else {
        alert("Por favor, preencha os campos.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.innerContainer}
        >
            {/* Título e Boas-vindas */}
            <View style={styles.header}>
            <Text style={styles.title}>Easy Park</Text>
            <Text style={styles.subtitle}>Bem-vindo de volta!</Text>
            </View>

            {/* Campos de Input */}
            <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            
            <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>
            </View>

            {/* Botão de Entrar */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>ENTRAR</Text>
            </TouchableOpacity>

            {/* Rodapé de Cadastro */}
            <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta? </Text>
            <TouchableOpacity>
                <Text style={styles.signupText}>Cadastre-se</Text>
            </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    innerContainer: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    inputContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: '#F0F0F0',
        height: 55,
        borderRadius: 25, // Bordas bem arredondadas conforme o Figma
        paddingHorizontal: 20,
        marginBottom: 15,
        fontSize: 16,
        color: '#333',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotText: {
        color: '#666',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#000', // Preto para contraste, ou use a cor do seu logo
        height: 55,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    signupText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
});