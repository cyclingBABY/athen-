// ============================================
// Custom local adapter for Supabase client
// src/integrations/supabase/client.ts
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.origin + (window.location.pathname.includes('/athen-') ? '/athen-/api' : '/api'));

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
  // Tracks whether .select() was chained after a mutation (insert/update/delete)
  // In that case we keep the mutation action and just note the return columns
  private mutationReturnSelect: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(str = '*') {
    // If already a mutation, don't overwrite the action.
    // .insert().select() in Supabase means "return inserted data" — we handle
    // this by keeping action='insert' and flagging mutationReturnSelect.
    if (this.action === 'insert' || this.action === 'update' || this.action === 'delete') {
      this.mutationReturnSelect = true;
      this.selectStr = str;
    } else {
      this.action = 'select';
      this.selectStr = str;
    }
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
      const response = await fetch(`${API_BASE_URL}/index.php`, {
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
          // Only pass isSingle/isMaybeSingle for real SELECT queries.
          // For mutations with chained .select().single(), the PHP insert already
          // returns the full record — we resolve it directly without a secondary SELECT.
          isSingle: this.mutationReturnSelect ? false : this.isSingle,
          isMaybeSingle: this.mutationReturnSelect ? false : this.isMaybeSingle
        })
      });

      const res = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: res.error || 'Database operation failed' } };
      }

      // For insert/update chained with .select().single(), PHP returns the record
      // as res.data (an object for single insert, array for bulk). Return directly.
      if (this.mutationReturnSelect) {
        const rawData = res.data;
        if (this.isSingle || this.isMaybeSingle) {
          // Unwrap: if array returned pick first item, otherwise use as-is
          const single = Array.isArray(rawData) ? (rawData[0] ?? null) : rawData;
          if (this.isSingle && single === null) {
            return { data: null, error: { message: 'No record found after mutation' } };
          }
          return { data: single, error: null };
        }
        return { data: rawData, error: null };
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
        const res = await fetch(`${API_BASE_URL}/auth.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            email,
            password,
            full_name: options?.data?.full_name || '',
            account_type: options?.data?.account_type || 'patron',
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
        const res = await fetch(`${API_BASE_URL}/auth.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            email,
            password
          })
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: data.error || 'Login failed' } };
        }
        
        const session = data.session || {
          access_token: data.token,
          user: data.user,
        };

        localStorage.setItem('athena_token', session.access_token);
        localStorage.setItem('athena_user', JSON.stringify(session.user));

        triggerAuthListeners('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } };
      }
    },

    async signOut() {
      try {
        await fetch(`${API_BASE_URL}/auth.php`, {
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

    async changePassword({ userId, password }: any) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'changePassword',
            userId,
            password
          })
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: { message: data.error || 'Password update failed' } };
        }
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
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

            const res = await fetch(`${API_BASE_URL}/storage.php`, {
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
              publicUrl: `${API_BASE_URL}/uploads/${bucket}/${path}`
            }
          };
        }
      };
    }
  },

  functions: {
    async invoke(name: string, options?: { body: any }) {
      try {
        const res = await fetch(`${API_BASE_URL}/functions.php`, {
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
