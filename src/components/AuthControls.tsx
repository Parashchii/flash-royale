import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useLocale } from "../i18n/LocaleContext";

export function AuthControls() {
  const { t } = useLocale();
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="btn btn-ghost">
            {t("signIn")}
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <span className="sync-tag">{t("syncCloud")}</span>
        <UserButton />
      </SignedIn>
    </>
  );
}
