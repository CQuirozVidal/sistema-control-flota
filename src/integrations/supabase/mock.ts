// Mock Supabase Client para desarrollo local
// Simula autenticación sin necesidad de servidor real

interface MockUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

interface MockSession {
  user: MockUser;
  access_token: string;
}

interface SignInCredentials {
  email: string;
  password: string;
}

type AuthCallback = (event: string, session: MockSession | null) => void;

const MOCK_USERS: Record<string, any> = {
  "admin@flota.cl": {
    id: "admin-123",
    password: "Admin123!",
    email: "admin@flota.cl",
    role: "admin",
  },
  "conductor@flota.cl": {
    id: "conductor-456",
    password: "Conductor123!",
    email: "conductor@flota.cl",
    role: "conductor",
  },
};

const MOCK_PROFILES: Record<string, any> = {
  "admin-123": {
    id: "admin-123",
    user_id: "admin-123",
    role: "admin",
    full_name: "Administrador",
    created_at: new Date().toISOString(),
  },
  "conductor-456": {
    id: "conductor-456",
    user_id: "conductor-456",
    role: "conductor",
    full_name: "Conductor",
    created_at: new Date().toISOString(),
  },
};

export class MockSupabaseAuth {
  private listeners: AuthCallback[] = [];
  private currentSession: MockSession | null = null;

  constructor() {
    this.loadSessionFromStorage();
    console.log("🔐 MockSupabaseAuth inicializado");
  }

  private loadSessionFromStorage() {
    const stored = localStorage.getItem("mock-auth-session");
    if (stored) {
      try {
        this.currentSession = JSON.parse(stored);
        console.log("✅ Sesión restaurada desde localStorage");
      } catch (e) {
        console.log("❌ No se pudo restaurar sesión");
        this.currentSession = null;
      }
    }
  }

  private saveSessionToStorage(session: MockSession | null) {
    if (session) {
      localStorage.setItem("mock-auth-session", JSON.stringify(session));
    } else {
      localStorage.removeItem("mock-auth-session");
    }
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => {
      callback("auth", this.currentSession);
    });
  }

  async signInWithPassword(credentials: SignInCredentials) {
    const { email, password } = credentials || { email: "", password: "" };
    // Asegurar que email es un string limpio
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "").trim();
    
    console.log(`🔑 Intentando login con: "${cleanEmail}"`);
    console.log(`   Usuarios disponibles: ${Object.keys(MOCK_USERS).join(", ")}`);
    
    const user = MOCK_USERS[cleanEmail];

    if (!user) {
      console.log(`❌ Usuario no encontrado: "${cleanEmail}"`);
      return {
        data: null,
        error: { message: `Usuario no encontrado: ${cleanEmail}` },
      };
    }

    if (user.password !== cleanPassword) {
      console.log(`❌ Contraseña incorrecta para ${cleanEmail}`);
      console.log(`   Esperada: "${user.password}"`);
      console.log(`   Recibida: "${cleanPassword}"`);
      return {
        data: null,
        error: { message: "Contraseña incorrecta" },
      };
    }

    const session: MockSession = {
      user: {
        id: user.id,
        email: user.email,
      },
      access_token: `mock-token-${user.id}`,
    };

    this.currentSession = session;
    this.saveSessionToStorage(session);
    this.notifyListeners();

    console.log(`✅ Login exitoso para ${cleanEmail}`);
    return { data: { user: session.user, session }, error: null };
  }

  async signOut() {
    this.currentSession = null;
    this.saveSessionToStorage(null);
    this.notifyListeners();
    console.log("📤 Sesión cerrada");
    return { error: null };
  }

  async getSession() {
    return {
      data: {
        session: this.currentSession,
      },
      error: null,
    };
  }

  onAuthStateChange(callback: AuthCallback) {
    this.listeners.push(callback);

    // Notificar inmediatamente con la sesión actual
    callback("initial", this.currentSession);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((cb) => cb !== callback);
          },
        },
      },
    };
  }
}

export class MockSupabaseDatabase {
  async from(table: string) {
    return {
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            if (table === "profiles") {
              const profile = MOCK_PROFILES[value as keyof typeof MOCK_PROFILES];
              return {
                data: profile || null,
                error: profile ? null : { message: "Perfil no encontrado" },
              };
            }
            return { data: null, error: null };
          },
        }),
      }),
    };
  }
}

export class MockSupabaseClient {
  auth: MockSupabaseAuth;
  db: MockSupabaseDatabase;

  constructor() {
    this.auth = new MockSupabaseAuth();
    this.db = new MockSupabaseDatabase();
  }

  from(table: string) {
    return this.db.from(table);
  }
}

// Instancia global
export const mockSupabase = new MockSupabaseClient();
