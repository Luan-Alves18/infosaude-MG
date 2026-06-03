import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "InfoSaúde MG — Portal de Informações em Saúde" },
      { name: "description", content: "Integração das informações em saúde do Estado de Minas Gerais — SES-MG." },
      { name: "author", content: "SES-MG / NIGD" },
      { property: "og:title", content: "InfoSaúde MG — Portal de Informações em Saúde" },
      { property: "og:description", content: "Integração das informações em saúde do Estado de Minas Gerais — SES-MG." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "InfoSaúde MG — Portal de Informações em Saúde" },
      { name: "twitter:description", content: "Integração das informações em saúde do Estado de Minas Gerais — SES-MG." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8ebec8f7-6bf7-49dc-ad6d-4fab7d470407/id-preview-1c2ba380--6bcf2ab2-9482-479a-a655-be09a4f31797.lovable.app-1780502338838.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8ebec8f7-6bf7-49dc-ad6d-4fab7d470407/id-preview-1c2ba380--6bcf2ab2-9482-479a-a655-be09a4f31797.lovable.app-1780502338838.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SiteLayout>
              <Outlet />
            </SiteLayout>
          </TooltipProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
}
