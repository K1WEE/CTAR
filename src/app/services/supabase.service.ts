import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public client: SupabaseClient;
  public currentUser = signal<User | null>(null);
  public userRole = signal<string>('user');
  public isInitialized = signal<boolean>(false);

  /**
   * Resolves once the initial session has been restored from storage.
   * Route guards must await this before reading currentUser(), otherwise a
   * page refresh evaluates the guard before the async session lookup completes
   * and the user is wrongly bounced to /login.
   */
  public sessionReady: Promise<void>;

  constructor() {
    this.client = createClient(environment.supabase.url, environment.supabase.key);

    // Check initial session
    this.sessionReady = this.client.auth.getSession().then(({ data }) => {
      const user = data.session?.user || null;
      this.currentUser.set(user);
      if (user) {
        this.fetchAndSetRole(user.id);
      }
      this.isInitialized.set(true);
    });

    // Listen to auth changes
    this.client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      this.currentUser.set(user);
      if (user) {
        this.fetchAndSetRole(user.id);
      } else {
        this.userRole.set('user');
      }
    });
  }

  private async fetchAndSetRole(userId: string) {
    const role = await this.getUserRole(userId);
    this.userRole.set(role);
  }

  async signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string, metadata: any) {
    return this.client.auth.signUp({ 
      email, 
      password,
      options: {
        data: metadata
      }
    });
  }

  async sendPasswordResetEmail(email: string, redirectTo: string) {
    return this.client.auth.resetPasswordForEmail(email, { redirectTo });
  }

  async updatePassword(password: string) {
    return this.client.auth.updateUser({ password });
  }

  async getUserRole(userId: string): Promise<string> {
    try {
      const { data, error } = await this.client
        .from('patients')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching user role:", error);
        return 'user';
      }
      return data?.role || 'user';
    } catch (e) {
      return 'user';
    }
  }

  /**
   * Securely sets a user's role using the admin_set_user_role RPC.
   * Only callable if currentUser has role === 'admin'.
   */
  async adminSetUserRole(targetUserId: string, newRole: string): Promise<{ error: any }> {
    const { error } = await this.client.rpc('admin_set_user_role', {
      target_user_id: targetUserId,
      new_role: newRole
    });
    return { error };
  }
}
