import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  const normalizeAuthPayload = useCallback((data) => {
    const token =
      data?.access_token ??
      data?.token ??
      data?.accessToken ??
      data?.accessToken?.token ??
      data?.data?.access_token ??
      null;

    const utilisateur = data?.utilisateur ?? data?.user ?? data?.utilisateur_auth ?? null;
    const role = data?.role ?? utilisateur?.role ?? null;

    // Certains backends renvoient `role` séparément. On le fusionne dans `utilisateur`
    // pour que l'app (AdminRoute) puisse détecter correctement l'admin.
    const utilisateurAvecRole = utilisateur && role && utilisateur?.role !== role ? { ...utilisateur, role } : utilisateur;

    const tokenOk = token && token !== 'undefined' && token !== 'null';
    return { token: tokenOk ? String(token) : null, utilisateur: utilisateurAvecRole };
  }, []);

  const login = useCallback(async (email, mot_de_passe) => {
    // Envoie les 2 clés pour compatibilité backends (mot_de_passe / password)
    const { data } = await api.post('/auth/login', { email, mot_de_passe, password: mot_de_passe });
    const { token, utilisateur } = normalizeAuthPayload(data);
    if (!token || !utilisateur) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      throw new Error('Réponse login invalide (token/utilisateur manquant).');
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(utilisateur));
    setUser(utilisateur);
    return data;
  }, [normalizeAuthPayload]);

  const register = useCallback(async (form) => {
    const { data } = await api.post('/auth/register', form);
    const { token, utilisateur } = normalizeAuthPayload(data);
    if (!token || !utilisateur) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      throw new Error('Réponse register invalide (token/utilisateur manquant).');
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(utilisateur));
    setUser(utilisateur);
    return data;
  }, [normalizeAuthPayload]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

