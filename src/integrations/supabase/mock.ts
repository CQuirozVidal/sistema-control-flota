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

type AuthCallback = (event: string, session: MockSession | null) => void;

const MOCK_USERS = {
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

const MOCK_PROFILES = {
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
  }

  private loadSessionFromStorage() {
    const stored = localStorage.getItem("mock-auth-session");
    if (stored) {
      try {
        this.currentSession = JSON.parse(stored);
      } catch {
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

  async signInWithPassword(email: string, password: string) {
    const user = MOCK_USERS[email as keyof typeof MOCK_USERS];

    if (!user || user.password !== password) {
      return {
        data: null,
        error: { message: "Credenciales inválidas" },
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

    return { data: { session }, error: null };
  }

  async signOut() {
    this.currentSession = null;
    this.saveSessionToStorage(null);
    this.notifyListeners();
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
                data: profile,
                error: null,
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
