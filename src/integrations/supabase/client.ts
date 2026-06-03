// ============================================
// Custom local adapter for Supabase client
// src/integrations/supabase/client.ts
// ============================================

class QueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectStr: string = '*';
  private payload: any = null;
  private filters: Array<{ col: string; op: string; val: any }> = [];
  private orderCol: string | null = null;
  private orderAsc: boolean = true;
  private limitVal: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(str = '*') {
    this.action = 'select';
    this.selectStr = str;
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, op: 'eq', val });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ col, op: 'neq', val });
    return this;
  }

  gt(col: string, val: any) {
    this.filters.push({ col, op: 'gt', val });
    return this;
  }

  lt(col: string, val: any) {
    this.filters.push({ col, op: 'lt', val });
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push({ col, op: 'gte', val });
    return this;
  }

  lte(col: string, val: any) {
    this.filters.push({ col, op: 'lte', val });
    return this;
  }

  like(col: string, val: any) {
    this.filters.push({ col, op: 'like', val });
    return this;
  }

  ilike(col: string, val: any) {
    this.filters.push({ col, op: 'ilike', val });
    return this;
  }

  not(col: string, op: string, val: any) {
    this.filters.push({ col, op: `not_${op}`, val });
    return this;
  }

  in(col: string, val: any[]) {
    this.filters.push({ col, op: 'in', val });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = options?.ascending !== false;
    return this;
  }

  limit(val: number) {
    this.limitVal = val;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async execute() {
    try {
      const response = await fetch('/api/index.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('athena_token') || ''}`
        },
        body: JSON.stringify({
          table: this.table,
          action: this.action,
          select: this.selectStr,
          payload: this.payload,
          filters: this.filters,
          orderCol: this.orderCol,
          orderAsc: this.orderAsc,
          limitVal: this.limitVal,
          isSingle: this.isSingle,
          isMaybeSingle: this.isMaybeSingle
        })
      });

      const res = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: res.error || 'Database operation failed' } };
      }
      return { data: res.data, error: null };
    } catch (err: any) {
      console.error("Database Query Exception:", err);
      return { data: null, error: { message: err.message || 'Local API Connection Error' } };
    }
  }

  // Thenable execution for await statements
  then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

let authListeners: Array<(event: string, session: any) => void> = [];
function triggerAuthListeners(event: string, session: any) {
  authListeners.forEach(l => {
    try {
      l(event, session);
    } catch (e) {
      console.error("Listener error:", e);
    }
  });
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },

  auth: {
    async signUp({ email, password, options }: any) {
      try {
        const res = await fetch('/api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signUp',
            email,
            password,
            metadata: options?.data || {}
          })
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: { user: null }, error: { message: data.error || 'Registration failed' } };
        }
        return { data: { user: data.user }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } };
      }
    },

    async signInWithPassword({ email, password }: any) {
      try {
        const res = await fetch('/api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signInWithPassword',
            email,
            password
          })
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: data.error || 'Login failed' } };
        }
        
        localStorage.setItem('athena_token', data.session.access_token);
        localStorage.setItem('athena_user', JSON.stringify(data.session.user));
        
        triggerAuthListeners('SIGNED_IN', data.session);
        return { data: { user: data.session.user, session: data.session }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } };
      }
    },

    async signOut() {
      try {
        await fetch('/api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'signOut' })
        });
      } catch (e) {
        console.error("SignOut API call error:", e);
      }
      localStorage.removeItem('athena_token');
      localStorage.removeItem('athena_user');
      triggerAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },

    async getSession() {
      const userStr = localStorage.getItem('athena_user');
      const token = localStorage.getItem('athena_token');
      if (userStr && token) {
        try {
          const user = JSON.parse(userStr);
          return { data: { session: { user, access_token: token } }, error: null };
        } catch (e) {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.push(callback);
      this.getSession().then(({ data }) => {
        callback(data.session ? 'SIGNED_IN' : 'SIGNED_OUT', data.session);
      });
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners = authListeners.filter(l => l !== callback);
            }
          }
        }
      };
    }
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File, options?: any) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', path);
            formData.append('bucket', bucket);

            const res = await fetch('/api/storage.php', {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            if (!res.ok) {
              return { data: null, error: { message: data.error || 'Upload failed' } };
            }
            return { data: { path }, error: null };
          } catch (err: any) {
            return { data: null, error: { message: err.message } };
          }
        },

        getPublicUrl(path: string) {
          return {
            data: {
              publicUrl: `/api/uploads/${bucket}/${path}`
            }
          };
        }
      };
    }
  },

  functions: {
    async invoke(name: string, options?: { body: any }) {
      try {
        const res = await fetch('/api/functions.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, ...options?.body })
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: null, error: { message: data.error || 'Invocation failed' } };
        }
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    }
  }
};