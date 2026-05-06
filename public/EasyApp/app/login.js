import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Eye, EyeOff, Globe2, LockKeyhole, Mail, UserRound } from 'lucide-react-native';
import { loginWithEmail, registerWithEmail, signInWithGoogle } from '../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    cpf: '',
    telefone: '',
  });

  const isRegister = mode === 'register';

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const goToApp = () => {
    router.replace('/(tabs)');
  };

  const handleEmailAuth = async () => {
    if (!form.email.trim() || !form.senha.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe e-mail e senha para continuar.');
      return;
    }

    if (isRegister && (!form.nome_completo.trim() || !form.cpf.trim())) {
      Alert.alert('Cadastro incompleto', 'Informe nome completo e CPF para criar sua conta.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(form);
      } else {
        await loginWithEmail(form.email.trim(), form.senha);
      }
      goToApp();
    } catch (error) {
      Alert.alert('Nao foi possivel entrar', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        goToApp();
      }
    } catch (error) {
      Alert.alert('Login com Google', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.lockBadge}>
              <LockKeyhole color="#ffffff" size={34} strokeWidth={2.4} />
            </View>

            <Text style={styles.title}>{isRegister ? 'Criar conta' : 'Bem-vindo!'}</Text>
            <Text style={styles.subtitle}>
              {isRegister ? 'Cadastre-se para continuar' : 'Faca login para continuar'}
            </Text>

            <View style={styles.form}>
              {isRegister ? (
                <Input
                  icon={<UserRound color="#42596a" size={18} />}
                  placeholder="Nome completo"
                  value={form.nome_completo}
                  onChangeText={value => updateField('nome_completo', value)}
                  autoCapitalize="words"
                />
              ) : null}

              <Input
                icon={<Mail color="#42596a" size={18} />}
                placeholder="E-mail"
                value={form.email}
                onChangeText={value => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {isRegister ? (
                <Input
                  icon={<UserRound color="#42596a" size={18} />}
                  placeholder="CPF"
                  value={form.cpf}
                  onChangeText={value => updateField('cpf', value)}
                  keyboardType="numeric"
                />
              ) : null}

              <Input
                icon={<LockKeyhole color="#42596a" size={18} />}
                placeholder="Senha"
                value={form.senha}
                onChangeText={value => updateField('senha', value)}
                secureTextEntry={!showPassword}
                rightAction={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    hitSlop={10}
                    onPress={() => setShowPassword(current => !current)}>
                    {showPassword ? (
                      <EyeOff color="#7b8d9b" size={21} />
                    ) : (
                      <Eye color="#7b8d9b" size={21} />
                    )}
                  </Pressable>
                }
              />

              {!isRegister ? (
                <Pressable style={styles.forgotButton}>
                  <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed || loading ? styles.buttonPressed : null,
              ]}
              disabled={loading}
              onPress={handleEmailAuth}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>{isRegister ? 'Cadastrar' : 'Entrar'}</Text>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.googleButton, pressed ? styles.googleButtonPressed : null]}
              disabled={loading}
              onPress={handleGoogleAuth}>
              <Globe2 color="#0f1920" size={20} />
              <Text style={styles.googleButtonText}>Entrar com Google</Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isRegister ? 'Ja tem uma conta? ' : 'Nao tem uma conta? '}
              </Text>
              <Pressable onPress={() => setMode(isRegister ? 'login' : 'register')}>
                <Text style={styles.footerLink}>{isRegister ? 'Entrar' : 'Cadastre-se'}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Input({ icon, rightAction, style, ...props }) {
  return (
    <View style={[styles.inputWrapper, style]}>
      {icon}
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#465f70"
        selectionColor="#519b6d"
      />
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1c2428',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 42,
  },
  card: {
    width: '100%',
    minHeight: 670,
    alignSelf: 'center',
    borderRadius: 6,
    backgroundColor: '#f4f8fc',
    paddingHorizontal: 28,
    paddingTop: 88,
    paddingBottom: 34,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  lockBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 22,
    backgroundColor: '#6f916d',
  },
  title: {
    color: '#101b23',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 28,
    color: '#43596b',
    fontSize: 13,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#caddea',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#10212d',
    fontSize: 14,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -2,
  },
  forgotText: {
    color: '#4d9a67',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 16,
    backgroundColor: '#519b6d',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 17,
  },
  dividerLine: {
    width: 60,
    height: 1,
    backgroundColor: '#cbdce8',
  },
  dividerText: {
    color: '#344a5b',
    fontSize: 12,
  },
  googleButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cedfea',
    backgroundColor: '#ffffff',
  },
  googleButtonPressed: {
    backgroundColor: '#eef5f8',
  },
  googleButtonText: {
    color: '#0f1920',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#344a5b',
    fontSize: 13,
  },
  footerLink: {
    color: '#4d9a67',
    fontSize: 13,
    fontWeight: '800',
  },
});
