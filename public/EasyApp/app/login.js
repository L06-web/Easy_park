import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react-native';
import { loginWithEmail, registerWithEmail, resetPasswordWithCpf } from '../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cpf: '',
    telefone: '',
  });

  const isRegister = mode === 'register';
  const isRecover = mode === 'recover';

  const updateField = (field, value) => {
    if (errorMessage) {
      setErrorMessage('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }

    setForm(current => ({ ...current, [field]: value }));
  };

  const goToApp = () => {
    router.replace(Platform.OS === 'web' ? '/dashboard' : '/(tabs)');
  };

  const handleEmailAuth = async () => {
    if (isRecover) {
      if (!form.email.trim() || !form.cpf.trim() || !form.senha.trim() || !form.confirmarSenha.trim()) {
        setErrorMessage('Informe e-mail, CPF, nova senha e confirmação.');
        return;
      }

      if (form.senha !== form.confirmarSenha) {
        setErrorMessage('A nova senha e a confirmação precisam ser iguais.');
        return;
      }

      setErrorMessage('');
      setSuccessMessage('');
      setLoading(true);
      try {
        await resetPasswordWithCpf(form.email.trim(), form.cpf.trim(), form.senha);
        setSuccessMessage('Senha atualizada com sucesso. Entre com sua nova senha.');
        setMode('login');
        setForm(current => ({ ...current, senha: '', confirmarSenha: '' }));
      } catch (error) {
        setErrorMessage(error.message || 'Nao foi possivel atualizar a senha.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!form.email.trim() || !form.senha.trim()) {
      setErrorMessage('Informe e-mail e senha para continuar.');
      return;
    }

    if (isRegister && (!form.nome_completo.trim() || !form.cpf.trim())) {
      setErrorMessage('Informe nome completo e CPF para criar sua conta.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(form);
      } else {
        await loginWithEmail(form.email.trim(), form.senha);
      }
      goToApp();
    } catch (error) {
      setErrorMessage(error.message || 'E-mail ou senha invalidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.lockBadge}>
              <LockKeyhole color="#ffffff" size={34} strokeWidth={2.4} />
            </View>

            <Text style={styles.title}>
              {isRegister ? 'Criar conta' : isRecover ? 'Recuperar senha' : 'Bem-vindo!'}
            </Text>
            <Text style={styles.subtitle}>
              {isRegister
                ? 'Cadastre-se para continuar'
                : isRecover
                  ? 'Informe e-mail, CPF e uma nova senha'
                  : 'Faca login para continuar'}
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

              {isRegister || isRecover ? (
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
                placeholder={isRecover ? 'Nova senha' : 'Senha'}
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

              {isRecover ? (
                <Input
                  icon={<LockKeyhole color="#42596a" size={18} />}
                  placeholder="Confirmar nova senha"
                  value={form.confirmarSenha}
                  onChangeText={value => updateField('confirmarSenha', value)}
                  secureTextEntry={!showPassword}
                />
              ) : null}

              {!isRegister && !isRecover ? (
                <Pressable
                  style={styles.forgotButton}
                  onPress={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('recover');
                  }}>
                  <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                </Pressable>
              ) : null}
            </View>

            {successMessage ? (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>Tudo certo</Text>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>
                  {isRecover ? 'Nao foi possivel recuperar' : 'Nao foi possivel entrar'}
                </Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

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
                <Text style={styles.primaryButtonText}>
                  {isRegister ? 'Cadastrar' : isRecover ? 'Alterar senha' : 'Entrar'}
                </Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isRecover ? 'Lembrou sua senha? ' : isRegister ? 'Ja tem uma conta? ' : 'Nao tem uma conta? '}
              </Text>
              <Pressable
                onPress={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setMode(isRegister || isRecover ? 'login' : 'register');
                }}>
                <Text style={styles.footerLink}>
                  {isRegister || isRecover ? 'Entrar' : 'Cadastre-se'}
                </Text>
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
        onSubmitEditing={Keyboard.dismiss}
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
    paddingTop: 28,
    paddingBottom: 52,
  },
  card: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    borderRadius: 6,
    backgroundColor: '#f4f8fc',
    paddingHorizontal: 28,
    paddingTop: 64,
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
  errorBox: {
    gap: 3,
    borderWidth: 1,
    borderColor: '#f0b8b1',
    borderRadius: 10,
    backgroundColor: '#fdecea',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  errorTitle: {
    color: '#9f2d22',
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    color: '#9f2d22',
    fontSize: 12,
    lineHeight: 17,
  },
  successBox: {
    gap: 3,
    borderWidth: 1,
    borderColor: '#a7d9b7',
    borderRadius: 10,
    backgroundColor: '#e9f7ee',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  successTitle: {
    color: '#2f7a47',
    fontSize: 13,
    fontWeight: '800',
  },
  successText: {
    color: '#2f7a47',
    fontSize: 12,
    lineHeight: 17,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
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
