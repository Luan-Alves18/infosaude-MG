// Shim: maps a subset of react-router-dom APIs to TanStack Router so ported
// pages can keep their original import shape with minimal changes.
import {
  Link as TLink,
  useNavigate as tUseNavigate,
  useParams as tUseParams,
  useRouterState,
} from "@tanstack/react-router";
import { forwardRef, useEffect, type AnchorHTMLAttributes, type ReactNode } from "react";

type AnyProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
  children?: ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, AnyProps>(({ to, replace, ...rest }, ref) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <TLink ref={ref as any} to={to as any} replace={replace} {...(rest as any)} />
));
Link.displayName = "Link";

type NavLinkClass = string | ((args: { isActive: boolean }) => string);
type NavLinkProps = Omit<AnyProps, "className"> & {
  className?: NavLinkClass;
  end?: boolean;
};

export const NavLink = ({ to, className, end, children, ...rest }: NavLinkProps) => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  const cls = typeof className === "function" ? className({ isActive }) : className;
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <TLink to={to as any} className={cls} {...(rest as any)}>
      {children}
    </TLink>
  );
};

type NavigateOpts = { replace?: boolean };
export const useNavigate = () => {
  const nav = tUseNavigate();
  return (path: string, opts?: NavigateOpts) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nav({ to: path as any, replace: opts?.replace });
};

export const useParams = <T extends Record<string, string> = Record<string, string>>() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tUseParams as any)({ strict: false }) as T;

type SetSearchParams = (
  next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
  opts?: { replace?: boolean },
) => void;

export const useSearchParams = (): [URLSearchParams, SetSearchParams] => {
  const search = useRouterState({ select: (s) => s.location.search }) as unknown as Record<string, unknown>;
  const nav = tUseNavigate();
  const params = new URLSearchParams(
    Object.entries(search ?? {}).reduce<Record<string, string>>(
      (acc, [k, v]) => {
        if (v != null) acc[k] = String(v);
        return acc;
      },
      {},
    ),
  );
  const setParams: SetSearchParams = (next, opts) => {
    const n = typeof next === "function" ? next(new URLSearchParams(params)) : next;
    const obj: Record<string, string> = {};
    n.forEach((value, key) => {
      obj[key] = value;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nav({ to: ".", search: obj as any, replace: opts?.replace });
  };
  return [params, setParams];
};

type NavigateCompProps = { to: string; replace?: boolean };
export const Navigate = ({ to, replace }: NavigateCompProps) => {
  const nav = tUseNavigate();
  // Side-effect must run after render, otherwise we trigger an infinite
  // render/navigate loop (page appears to "reload" itself).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  // Using dynamic import to avoid a circular dep with React in some bundlers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { useEffect } = require("react") as typeof import("react");
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nav({ to: to as any, replace });
  }, [to, replace]);
  return null;
};
