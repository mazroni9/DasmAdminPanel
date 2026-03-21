// utils/supabaseClient.ts
// ملف قديم (Legacy). لوحة التحكم تعتمد على Laravel API فقط.
// هذا Stub لمنع أي Requests خارجية في حال وجود استيراد قديم بالخطأ.

type AnyObj = any;

function rejected(message: string) {
  return Promise.resolve({ data: null, error: new Error(message) });
}

function makeQueryStub() {
  const stub: AnyObj = {
    select: () => rejected('This module is disabled.'),
    insert: () => rejected('This module is disabled.'),
    update: () => rejected('This module is disabled.'),
    delete: () => rejected('This module is disabled.'),
    single: () => rejected('This module is disabled.'),
    eq: () => stub,
    in: () => stub,
    order: () => stub,
    limit: () => stub,
  };
  return stub;
}

const supabase: AnyObj = {
  auth: {
    signInWithPassword: async () => rejected('This module is disabled.'),
    signOut: async () => Promise.resolve({ error: null }),
    getSession: async () => Promise.resolve({ data: { session: null }, error: null }),
  },
  from: () => makeQueryStub(),
};

export default supabase;
