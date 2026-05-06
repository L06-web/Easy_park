import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.0.126:3000');

const GOOGLE_CLIENT_ID =
  Constants.expoConfig?.extra?.googleClientId ??
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ??
  '';

const SESSION_KEY = 'easypark_user';
const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};

async function apiRequest(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.erro || data.error || 'Nao foi possivel concluir a autenticacao.');
  }

  return data;
}

export async function loginWithEmail(email, senha) {
  const data = await apiRequest('/api/usuarios/login', { email, senha });
  await saveSession(data.usuario);
  return data.usuario;
}

export async function registerWithEmail({ nome_completo, email, senha, cpf, telefone }) {
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
}

export async function signInWithGoogle() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Configure EXPO_PUBLIC_GOOGLE_CLIENT_ID para ativar o login com Google.');
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'easyapp',
  });

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri,
    responseType: AuthSession.ResponseType.Token,
    scopes: ['profile', 'email'],
  });

  const result = await request.promptAsync(googleDiscovery);

  if (result.type !== 'success' || !result.authentication?.accessToken) {
    return null;
  }

  const profileResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: {
      Authorization: `Bearer ${result.authentication.accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    throw new Error('Nao foi possivel consultar o perfil do Google.');
  }

  const googleUser = await profileResponse.json();
  const data = await apiRequest('/api/usuarios/google', {
    google_id: googleUser.id,
    nome_completo: googleUser.name,
    email: googleUser.email,
    foto_url: googleUser.picture,
  });

  await saveSession(data.usuario);
  return data.usuario;
}

export async function saveSession(user) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
}

export async function getUser() {
  const user = await SecureStore.getItemAsync(SESSION_KEY);
  return user ? JSON.parse(user) : null;
}

export async function logout() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
