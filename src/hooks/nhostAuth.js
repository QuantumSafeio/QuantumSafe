import { nhost } from '../lib/nhost';

export async function signInWithEmailPassword(email, password) {
  return nhost.auth.signIn({ email, password });
}

export async function signUpWithEmailPassword(email, password) {
  return nhost.auth.signUp({ email, password });
}