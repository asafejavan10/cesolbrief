import { BriefingDraft, BriefingStatus, User } from '../types';
import * as local from './localStore';
import { isSupabaseConfigured } from './supabaseClient';
import * as remote from './supabaseRepository';

const useSupabase = import.meta.env.VITE_DATA_PROVIDER === 'supabase' && isSupabaseConfigured;
export const dataProviderName = useSupabase ? 'supabase' : 'local';

export async function login(email: string, password: string) {
  return useSupabase ? remote.signInWithSupabase(email, password) : local.login(email, password);
}

export async function register(nome: string, email: string, password: string) {
  return useSupabase ? remote.signUpWithSupabase(nome, email, password) : local.registerUser(nome, email, password);
}

export async function logout() {
  if (useSupabase) await remote.signOutSupabase();
}

export async function getBriefings(user?: User | null) {
  if (!user) return [];
  return useSupabase ? remote.fetchBriefings(user) : local.getBriefings(user);
}

export async function getBriefing(id: string) {
  return useSupabase ? remote.fetchBriefing(id) : local.getBriefing(id);
}

export async function createBriefing(draft: BriefingDraft, files: File[], user: User) {
  return useSupabase ? remote.insertBriefing(draft, files, user) : local.createBriefing(draft, files, user);
}

export async function updateBriefingStatus(id: string, status: BriefingStatus) {
  return useSupabase ? remote.setSupabaseBriefingStatus(id, status) : local.updateBriefingStatus(id, status);
}

export async function deleteBriefing(id: string) {
  return useSupabase ? remote.removeSupabaseBriefing(id) : local.deleteBriefing(id);
}

export async function addComment(id: string, autor: string, texto: string) {
  return useSupabase ? remote.insertSupabaseComment(id, autor, texto) : local.addComment(id, autor, texto);
}

export async function getSettings() {
  return useSupabase ? remote.fetchSupabaseSettings() : local.getSettings();
}

export async function setBriefingsPaused(briefingsPaused: boolean) {
  return useSupabase ? remote.setSupabaseBriefingsPaused(briefingsPaused) : local.setBriefingsPaused(briefingsPaused);
}

export async function getNotifications() {
  return useSupabase ? remote.fetchSupabaseNotifications() : local.getNotifications();
}

export async function markNotificationsRead() {
  return useSupabase ? remote.markSupabaseNotificationsRead() : local.markNotificationsRead();
}
