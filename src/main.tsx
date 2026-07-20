import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import App from "./App";
import { LocaleProvider } from "./i18n/LocaleContext";
import "./index.css";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

function Providers({ children }: { children: ReactNode }) {
  if (clerkKey && convexUrl) {
    const convex = new ConvexReactClient(convexUrl);
    return (
      <ClerkProvider publishableKey={clerkKey}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    );
  }
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </Providers>
  </StrictMode>,
);
