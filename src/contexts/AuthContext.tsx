import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'almacenero' | 'produccion';

export interface User {
  id: string;
  email: string;
  nombre: string;
  roles: UserRole[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, nombre: string, rol: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar listener de autenticación PRIMERO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Solo actualizaciones síncronas aquí
        setSession(session);
        
        // Diferir operaciones asíncronas con setTimeout
        if (session?.user) {
          setTimeout(() => {
            loadUserData(session.user).then((userData) => {
              setUser(userData);
              setLoading(false);
            });
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // LUEGO verificar sesión existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user).then(setUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      // Obtener perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // Obtener roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id);

      if (profile) {
        return {
          id: profile.id,
          email: profile.email,
          nombre: profile.nombre,
          roles: userRoles?.map(r => r.role as UserRole) || [],
        };
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    return null;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userData = await loadUserData(data.user);
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: 'Error al iniciar sesión' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (email: string, password: string, nombre: string, rol: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            nombre,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Asignar rol al usuario recién creado
      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role: rol });

        if (roleError) {
          console.error('Error asignando rol:', roleError);
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) || false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      login, 
      signup,
      logout, 
      isAuthenticated: !!user,
      hasRole,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
