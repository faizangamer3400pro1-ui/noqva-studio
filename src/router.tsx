import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { routeTree } from "./routeTree.gen";
import { supabase } from "./integrations/supabase/client";
import { readAuthTokens } from "./lib/auth-redirect";

let nativeAuthListenerReady = false;

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  if (typeof window !== "undefined" && Capacitor.isNativePlatform() && !nativeAuthListenerReady) {
    nativeAuthListenerReady = true;
    const handleAuthUrl = async (url: string) => {
      const tokens = readAuthTokens(url);
      if (!tokens) return;
      const { error } = await supabase.auth.setSession(tokens);
      if (!error) await router.navigate({ to: "/chat" });
    };

    void App.addListener("appUrlOpen", ({ url }) => handleAuthUrl(url));
    void App.getLaunchUrl().then((result) => {
      if (result?.url) void handleAuthUrl(result.url);
    });
  }

  return router;
};
