import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

type Role = "admin" | "gestor" | "user";

type Ctx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: Role[];
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user && s.user.email) {
        const isMicrosoftLogin = s.user.identities?.some(
          (identity) => identity.provider === "azure" || identity.provider === "microsoft"
        );

        if (isMicrosoftLogin) {
          const email = s.user.email.toLowerCase();
          if (!email.endsWith("@saude.mg.gov.br")) {
            setTimeout(async () => {
              await supabase.auth.signOut();
              toast({
                title: "Acesso negado",
                description:
                  "Por favor, utilize seu e-mail institucional da Secretaria de Saúde (@saude.mg.gov.br).",
                variant: "destructive",
              });
              setSession(null);
              setUser(null);
              setRoles([]);
            }, 0);
            return;
          }
        }

        setTimeout(async () => {
          const { data } = await ( supabase as any ).from("user_roles").select("role").eq("user_id", s.user.id);
          setRoles((data ?? []).map((r: { role: Role }) => r.role));
        }, 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        ( supabase as any ).from("user_roles").select("role").eq("user_id", s.user.id).then(({ data }) => {
          setRoles((data ?? []).map((r: { role: Role }) => r.role));
        });
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  return (
    <AuthCtx.Provider value={{ user, session, loading, roles, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
};
