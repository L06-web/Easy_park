import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const FALLBACK_MOBILE_API_URL = 'http://10.0.0.126:3000';

function isLocalhostUrl(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url ?? '');
}

function getExpoHostApiUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    Constants.manifest?.debuggerHost;

  const host = hostUri?.split(':')?.[0];
  return host ? `http://${host}:3000` : null;
}

function getApiUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl;

  if (Platform.OS === 'web') {
    return configuredUrl ?? 'http://localhost:3000';
  }

  if (configuredUrl && !isLocalhostUrl(configuredUrl)) {
    return configuredUrl;
  }

  return getExpoHostApiUrl() ?? FALLBACK_MOBILE_API_URL;
}

const API_URL = getApiUrl();

const SESSION_KEY = 'easypark_user';

/**
 * Faz uma requisição à API backend
 */
async function apiRequest(path, body) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.erro || data.error || 'Não foi possível concluir a autenticação.');
  }

  return data;
}

/**
 * Realizar login com email e senha na API
 */
export async function loginWithEmail(email, senha) {
  try {
    const data = await apiRequest('/api/usuarios/login', { email, senha });
    await saveSession(data.usuario);

    return data.usuario;
  } catch (error) {
    throw new Error(formatRequestError(error));
  }
}

/**
 * Registrar novo usuário na API e inserir no banco de dados
 */
export async function registerWithEmail({
  nome_completo,
  email,
  senha,
  cpf,
  telefone,
}) {
  try {
    const data = await apiRequest('/api/usuarios/cadastrar', {
      nome_completo,
      email,
      senha,
      cpf,
      telefone,
    });

    const usuario = data.usuario ?? { nome_completo, email };
    await saveSession(usuario);

    return usuario;
  } catch (error) {
    throw new Error(formatRequestError(error));
  }
}

function formatRequestError(error) {
  if (error.message === 'Network request failed') {
    return `Não foi possível conectar à API em ${API_URL}. Verifique se o backend está rodando e se o celular está na mesma rede.`;
  }

  return error.message || 'Erro ao concluir a requisição';
}

/**
 * Salvar dados do usuário na sessão
 */
export async function saveSession(user) {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn('Erro ao salvar sessão:', error);
  }
}

/**
 * Obter usuário da sessão
 */
export async function getUser() {
  try {
    const user = await SecureStore.getItemAsync(SESSION_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.warn('Erro ao obter usuário:', error);
    return null;
  }
}

/**
 * Limpar sessão local
 */
export async function logout() {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.warn('Erro ao fazer logout:', error);
  }
}
