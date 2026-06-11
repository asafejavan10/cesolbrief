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

export async function requestPasswordReset(email: string) {
  return useSupabase ? remote.requestSupabasePasswordReset(email) : local.requestPasswordResetLocal(email);
}

export async function updatePassword(email: string, password: string) {
  return useSupabase ? remote.updateSupabasePassword(password) : local.updatePasswordLocal(email, password);
}

export async function getUsers() {
  return useSupabase ? remote.fetchUsers() : local.getUsers();
}

export async function getUserProfile(id: string) {
  return useSupabase ? remote.getUserProfile(id) : local.getUserProfile(id);
}

export async function updateUserProfile(id: string, updates: { isAdmin?: boolean; isBlocked?: boolean; limitBriefings?: number | null }) {
  return useSupabase ? remote.updateSupabaseUserProfile(id, updates) : local.updateUserProfile(id, updates);
}

export async function updateUserRole(id: string, isAdmin: boolean) {
  return useSupabase ? remote.setSupabaseUserRole(id, isAdmin) : local.updateUserRole(id, isAdmin);
}

export async function removeUser(id: string) {
  return useSupabase ? remote.removeSupabaseUserProfile(id) : local.removeUser(id);
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

export async function deleteNotification(id: string) {
  return useSupabase ? remote.deleteSupabaseNotification(id) : local.deleteNotification(id);
}
