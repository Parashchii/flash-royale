import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

export function AuthControls() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="btn btn-ghost">
            Увійти
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <span className="sync-tag">хмара</span>
        <UserButton />
      </SignedIn>
    </>
  );
}
