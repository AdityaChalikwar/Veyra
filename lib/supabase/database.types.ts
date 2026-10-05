// Generated from the Supabase schema (Supabase MCP `generate_typescript_types`).
// Regenerate after each migration; don't edit by hand.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      business_contexts: {
        Row: {
          business_model: string;
          goals: string[];
          key_metrics: string[];
          priorities: string[];
          product: string;
          target_customers: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          business_model?: string;
          goals?: string[];
          key_metrics?: string[];
          priorities?: string[];
          product?: string;
          target_customers?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          business_model?: string;
          goals?: string[];
          key_metrics?: string[];
          priorities?: string[];
          product?: string;
          target_customers?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_contexts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      clarifying_questions: {
        Row: {
          answer: string;
          created_at: string;
          hint: string;
          id: string;
          investigation_id: string;
          position: number;
          question: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          answer?: string;
          created_at?: string;
          hint?: string;
          id?: string;
          investigation_id: string;
          position: number;
          question: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          answer?: string;
          created_at?: string;
          hint?: string;
          id?: string;
          investigation_id?: string;
          position?: number;
          question?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clarifying_questions_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clarifying_questions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      evidence: {
        Row: {
          category: string;
          coverage: string | null;
          created_at: string;
          created_by: string | null;
          file_id: string | null;
          format: string;
          id: string;
          investigation_id: string;
          name: string;
          profile: Json | null;
          source: string;
          summary: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          category?: string;
          coverage?: string | null;
          created_at?: string;
          created_by?: string | null;
          file_id?: string | null;
          format?: string;
          id?: string;
          investigation_id: string;
          name: string;
          profile?: Json | null;
          source?: string;
          summary?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          category?: string;
          coverage?: string | null;
          created_at?: string;
          created_by?: string | null;
          file_id?: string | null;
          format?: string;
          id?: string;
          investigation_id?: string;
          name?: string;
          profile?: Json | null;
          source?: string;
          summary?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: true;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          created_at: string;
          created_by: string | null;
          error: string | null;
          id: string;
          investigation_id: string;
          name: string;
          size_bytes: number;
          status: string;
          storage_path: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          id?: string;
          investigation_id: string;
          name: string;
          size_bytes: number;
          status?: string;
          storage_path: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          id?: string;
          investigation_id?: string;
          name?: string;
          size_bytes?: number;
          status?: string;
          storage_path?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      investigations: {
        Row: {
          attachments: string[];
          confidence: string;
          created_at: string;
          created_by: string | null;
          data_source_ids: string[];
          id: string;
          is_sample: boolean;
          known_context: string;
          outcome: string | null;
          plan: Json | null;
          problem: string;
          status: string;
          title: string;
          topic: string;
          trigger: string | null;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          attachments?: string[];
          confidence?: string;
          created_at?: string;
          created_by?: string | null;
          data_source_ids?: string[];
          id?: string;
          is_sample?: boolean;
          known_context?: string;
          outcome?: string | null;
          plan?: Json | null;
          problem: string;
          status?: string;
          title: string;
          topic?: string;
          trigger?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          attachments?: string[];
          confidence?: string;
          created_at?: string;
          created_by?: string | null;
          data_source_ids?: string[];
          id?: string;
          is_sample?: boolean;
          known_context?: string;
          outcome?: string | null;
          plan?: Json | null;
          problem?: string;
          status?: string;
          title?: string;
          topic?: string;
          trigger?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investigations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          industry: string;
          name: string;
          size: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          industry: string;
          name: string;
          size: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          industry?: string;
          name?: string;
          size?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_investigation: {
        Args: {
          p_attachments: string[];
          p_data_source_ids: string[];
          p_known_context: string;
          p_outcome: string | null;
          p_plan: Json | null;
          p_problem: string;
          p_questions: Json;
          p_title: string;
          p_topic: string;
          p_trigger: string | null;
          p_workspace_id: string;
        };
        Returns: string;
      };
      save_workspace: {
        Args: {
          p_description: string;
          p_industry: string;
          p_name: string;
          p_size: string;
        };
        Returns: string;
      };
    };
    Enums: {
      workspace_role: "owner" | "member";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

/** Row type of a public table, e.g. `Tables<"workspaces">`. */
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
