import { useEffect, useState } from 'react'
import { LogIn, LogOut, UserRound, X } from 'lucide-react'
import { signIn, signOut, signUp, supabase } from '../lib/cloud'

export function AuthPanel({ onClose, onNotify }: { onClose: () => void; onNotify: (message: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [register, setRegister] = useState(false)
  useEffect(() => { if (!supabase) return; supabase.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null)); const listener = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user.email ?? null)); return () => listener.data.subscription.unsubscribe() }, [])
  const submit = async () => { try { const user = register ? await signUp(email, password) : await signIn(email, password); setUserEmail(user?.email ?? email); onNotify(register ? 'Account created' : 'Signed in'); } catch (error) { onNotify(error instanceof Error ? error.message : 'Authentication failed') } }
  const logout = async () => { try { await signOut(); setUserEmail(null); onNotify('Signed out') } catch { onNotify('Sign out failed') } }
  return <div className="modal-backdrop" onClick={onClose}><section className="auth-panel" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">Cloud account</span><h2>{userEmail ? 'Account' : register ? 'Create account' : 'Sign in'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close account panel"><X size={16} /></button></div>{!supabase ? <p className="auth-note">Configure Supabase in .env.local to enable cloud accounts.</p> : userEmail ? <><p className="auth-note"><UserRound size={15} /> {userEmail}</p><button className="button secondary" onClick={logout}><LogOut size={15} /> Sign out</button></> : <><label className="auth-field">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label className="auth-field">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={register ? 'new-password' : 'current-password'} /></label><button className="button primary auth-submit" onClick={submit}><LogIn size={15} /> {register ? 'Create account' : 'Sign in'}</button><button className="auth-switch" onClick={() => setRegister(!register)}>{register ? 'Already have an account? Sign in' : 'Need an account? Create one'}</button></>}</section></div>
}
