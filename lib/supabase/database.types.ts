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
      problem_definitions: {
        Row: {
          id: string;
          investigation_id: string;
          workspace_id: string;
          created_at: string;
          analysis_run_id: string | null;
          created_by: string | null;
          statement: string;
          affected: string;
          need: string;
          obstacle: string;
          business_impact: string;
          confidence: string;
          confidence_reason: string;
          assumptions: string[];
          finding_refs: string[];
          hypothesis_refs: string[];
        };
        Insert: {
          id?: string;
          investigation_id: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id?: string | null;
          created_by?: string | null;
          statement: string;
          affected?: string;
          need?: string;
          obstacle?: string;
          business_impact?: string;
          confidence: string;
          confidence_reason?: string;
          assumptions?: string[];
          finding_refs?: string[];
          hypothesis_refs?: string[];
        };
        Update: {
          id?: string;
          investigation_id?: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id?: string | null;
          created_by?: string | null;
          statement?: string;
          affected?: string;
          need?: string;
          obstacle?: string;
          business_impact?: string;
          confidence?: string;
          confidence_reason?: string;
          assumptions?: string[];
          finding_refs?: string[];
          hypothesis_refs?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "problem_definitions_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_definitions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_definitions_analysis_run_id_fkey";
            columns: ["analysis_run_id"];
            isOneToOne: false;
            referencedRelation: "analysis_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunities: {
        Row: {
          id: string;
          investigation_id: string;
          workspace_id: string;
          created_at: string;
          problem_definition_id: string;
          position: number;
          title: string;
          customer_problem: string;
          potential_impact: string;
          impact_level: string;
          confidence: string;
          assumptions: string[];
          validation_needs: string[];
          finding_refs: string[];
          status: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          investigation_id: string;
          workspace_id?: string;
          created_at?: string;
          problem_definition_id: string;
          position?: number;
          title: string;
          customer_problem?: string;
          potential_impact?: string;
          impact_level: string;
          confidence: string;
          assumptions?: string[];
          validation_needs?: string[];
          finding_refs?: string[];
          status?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          investigation_id?: string;
          workspace_id?: string;
          created_at?: string;
          problem_definition_id?: string;
          position?: number;
          title?: string;
          customer_problem?: string;
          potential_impact?: string;
          impact_level?: string;
          confidence?: string;
          assumptions?: string[];
          validation_needs?: string[];
          finding_refs?: string[];
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "opportunities_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_problem_definition_id_fkey";
            columns: ["problem_definition_id"];
            isOneToOne: false;
            referencedRelation: "problem_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      open_questions: {
        Row: {
          id: string;
          investigation_id: string;
          workspace_id: string;
          created_at: string;
          analysis_run_id: string;
          ref: string;
          position: number;
          question: string;
          why_it_matters: string;
          missing_evidence: string;
        };
        Insert: {
          id?: string;
          investigation_id: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id: string;
          ref: string;
          position?: number;
          question: string;
          why_it_matters?: string;
          missing_evidence?: string;
        };
        Update: {
          id?: string;
          investigation_id?: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id?: string;
          ref?: string;
          position?: number;
          question?: string;
          why_it_matters?: string;
          missing_evidence?: string;
        };
        Relationships: [
          {
            foreignKeyName: "open_questions_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "open_questions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "open_questions_analysis_run_id_fkey";
            columns: ["analysis_run_id"];
            isOneToOne: false;
            referencedRelation: "analysis_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      research_tasks: {
        Row: {
          id: string;
          investigation_id: string;
          workspace_id: string;
          created_at: string;
          analysis_run_id: string | null;
          position: number;
          title: string;
          question: string;
          method: string;
          method_detail: string;
          priority: string;
          status: string;
          rationale: string;
          question_ref: string | null;
          hypothesis_refs: string[];
          outcome: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          investigation_id: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id?: string | null;
          position?: number;
          title: string;
          question: string;
          method: string;
          method_detail?: string;
          priority: string;
          status?: string;
          rationale?: string;
          question_ref?: string | null;
          hypothesis_refs?: string[];
          outcome?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          investigation_id?: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id?: string | null;
          position?: number;
          title?: string;
          question?: string;
          method?: string;
          method_detail?: string;
          priority?: string;
          status?: string;
          rationale?: string;
          question_ref?: string | null;
          hypothesis_refs?: string[];
          outcome?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "research_tasks_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "research_tasks_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "research_tasks_analysis_run_id_fkey";
            columns: ["analysis_run_id"];
            isOneToOne: false;
            referencedRelation: "analysis_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      next_steps: {
        Row: {
          id: string;
          investigation_id: string;
          workspace_id: string;
          created_at: string;
          analysis_run_id: string;
          approach: string;
          approach_reason: string;
          evidence_sufficiency: string;
          type: string;
          title: string;
          detail: string;
          why: string;
          why_not_build_yet: string;
          would_change_if: string[];
        };
        Insert: {
          id?: string;
          investigation_id: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id: string;
          approach: string;
          approach_reason?: string;
          evidence_sufficiency: string;
          type: string;
          title: string;
          detail?: string;
          why?: string;
          why_not_build_yet?: string;
          would_change_if?: string[];
        };
        Update: {
          id?: string;
          investigation_id?: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id?: string;
          approach?: string;
          approach_reason?: string;
          evidence_sufficiency?: string;
          type?: string;
          title?: string;
          detail?: string;
          why?: string;
          why_not_build_yet?: string;
          would_change_if?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "next_steps_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "next_steps_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "next_steps_analysis_run_id_fkey";
            columns: ["analysis_run_id"];
            isOneToOne: false;
            referencedRelation: "analysis_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      findings: {
        Row: {
          id: string;
          investigation_id: string;
          workspace_id: string;
          created_at: string;
          analysis_run_id: string;
          ref: string;
          position: number;
          kind: string;
          statement: string;
          title: string;
          observed: Json | null;
          confidence: string;
          confidence_reason: string;
          based_on: string[];
        };
        Insert: {
          id?: string;
          investigation_id: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id: string;
          ref: string;
          position?: number;
          kind: string;
          statement: string;
          title?: string;
          observed?: Json | null;
          confidence: string;
          confidence_reason?: string;
          based_on?: string[];
        };
        Update: {
          id?: string;
          investigation_id?: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id?: string;
          ref?: string;
          position?: number;
          kind?: string;
          statement?: string;
          title?: string;
          observed?: Json | null;
          confidence?: string;
          confidence_reason?: string;
          based_on?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "findings_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "findings_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "findings_analysis_run_id_fkey";
            columns: ["analysis_run_id"];
            isOneToOne: false;
            referencedRelation: "analysis_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      hypotheses: {
        Row: {
          id: string;
          investigation_id: string;
          workspace_id: string;
          created_at: string;
          analysis_run_id: string;
          assumptions: string[];
          ref: string;
          position: number;
          statement: string;
          title: string;
          rationale: string;
          confidence: string;
          evidence_strength: string;
          evidence_status: string;
          supporting_findings: string[];
          contradicting_findings: string[];
          validation_method: string;
          status: string;
        };
        Insert: {
          id?: string;
          investigation_id: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id: string;
          assumptions?: string[];
          ref: string;
          position?: number;
          statement: string;
          title?: string;
          rationale?: string;
          confidence: string;
          evidence_strength: string;
          evidence_status: string;
          supporting_findings?: string[];
          contradicting_findings?: string[];
          validation_method?: string;
          status?: string;
        };
        Update: {
          id?: string;
          investigation_id?: string;
          workspace_id?: string;
          created_at?: string;
          analysis_run_id?: string;
          assumptions?: string[];
          ref?: string;
          position?: number;
          statement?: string;
          title?: string;
          rationale?: string;
          confidence?: string;
          evidence_strength?: string;
          evidence_status?: string;
          supporting_findings?: string[];
          contradicting_findings?: string[];
          validation_method?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hypotheses_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hypotheses_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hypotheses_analysis_run_id_fkey";
            columns: ["analysis_run_id"];
            isOneToOne: false;
            referencedRelation: "analysis_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      evidence_links: {
        Row: {
          id: string;
          investigation_id: string;
          workspace_id: string;
          created_at: string;
          evidence_id: string;
          finding_id: string | null;
          hypothesis_id: string | null;
          problem_definition_id: string | null;
          opportunity_id: string | null;
          relation: string;
          shows: string;
        };
        Insert: {
          id?: string;
          investigation_id: string;
          workspace_id?: string;
          created_at?: string;
          evidence_id: string;
          finding_id?: string | null;
          hypothesis_id?: string | null;
          problem_definition_id?: string | null;
          opportunity_id?: string | null;
          relation: string;
          shows?: string;
        };
        Update: {
          id?: string;
          investigation_id?: string;
          workspace_id?: string;
          created_at?: string;
          evidence_id?: string;
          finding_id?: string | null;
          hypothesis_id?: string | null;
          problem_definition_id?: string | null;
          opportunity_id?: string | null;
          relation?: string;
          shows?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_links_problem_definition_id_fkey";
            columns: ["problem_definition_id"];
            isOneToOne: false;
            referencedRelation: "problem_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_links_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_links_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_links_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_links_evidence_id_fkey";
            columns: ["evidence_id"];
            isOneToOne: false;
            referencedRelation: "evidence";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_links_finding_id_fkey";
            columns: ["finding_id"];
            isOneToOne: false;
            referencedRelation: "findings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_links_hypothesis_id_fkey";
            columns: ["hypothesis_id"];
            isOneToOne: false;
            referencedRelation: "hypotheses";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_usage: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          user_id?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      analysis_runs: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          error: string | null;
          id: string;
          investigation_id: string;
          model: string;
          pack: Json | null;
          result: Json | null;
          status: string;
          stop_reason: string | null;
          usage: Json | null;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          id?: string;
          investigation_id: string;
          model: string;
          pack?: Json | null;
          result?: Json | null;
          status?: string;
          stop_reason?: string | null;
          usage?: Json | null;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          id?: string;
          investigation_id?: string;
          model?: string;
          pack?: Json | null;
          result?: Json | null;
          status?: string;
          stop_reason?: string | null;
          usage?: Json | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_runs_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
        ];
      };
      business_contexts: {
        Row: {
          business_model: string;
          company_name: string;
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
          company_name?: string;
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
          company_name?: string;
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
      data_sources: {
        Row: {
          connector: string;
          created_at: string;
          created_by: string | null;
          id: string;
          kind: string;
          last_synced_at: string | null;
          name: string;
          settings: Json;
          status: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          connector: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind: string;
          last_synced_at?: string | null;
          name: string;
          settings?: Json;
          status?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          connector?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind?: string;
          last_synced_at?: string | null;
          name?: string;
          settings?: Json;
          status?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "data_sources_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      dataset_snapshots: {
        Row: {
          checks: Json;
          coverage: string | null;
          created_at: string;
          data_source_id: string;
          entity: string;
          id: string;
          metrics: Json;
          name: string;
          profile: Json;
          rejected_count: number;
          row_count: number;
          source_dataset_id: string;
          source_name: string;
          summary: string;
          sync_run_id: string;
          workspace_id: string;
        };
        Insert: {
          checks?: Json;
          coverage?: string | null;
          created_at?: string;
          data_source_id: string;
          entity: string;
          id?: string;
          metrics?: Json;
          name: string;
          profile: Json;
          rejected_count?: number;
          row_count: number;
          source_dataset_id: string;
          source_name: string;
          summary?: string;
          sync_run_id: string;
          workspace_id: string;
        };
        Update: {
          checks?: Json;
          coverage?: string | null;
          created_at?: string;
          data_source_id?: string;
          entity?: string;
          id?: string;
          metrics?: Json;
          name?: string;
          profile?: Json;
          rejected_count?: number;
          row_count?: number;
          source_dataset_id?: string;
          source_name?: string;
          summary?: string;
          sync_run_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dataset_snapshots_data_source_id_fkey";
            columns: ["data_source_id"];
            isOneToOne: false;
            referencedRelation: "data_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dataset_snapshots_source_dataset_id_fkey";
            columns: ["source_dataset_id"];
            isOneToOne: false;
            referencedRelation: "source_datasets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dataset_snapshots_sync_run_id_fkey";
            columns: ["sync_run_id"];
            isOneToOne: false;
            referencedRelation: "sync_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dataset_snapshots_workspace_id_fkey";
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
          confidence: string | null;
          coverage: string | null;
          created_at: string;
          created_by: string | null;
          data_source_id: string | null;
          file_id: string | null;
          format: string;
          id: string;
          investigation_id: string;
          metadata: Json;
          metrics: Json | null;
          name: string;
          profile: Json | null;
          snapshot_id: string | null;
          source: string;
          source_kind: string;
          summary: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          category?: string;
          confidence?: string | null;
          coverage?: string | null;
          created_at?: string;
          created_by?: string | null;
          data_source_id?: string | null;
          file_id?: string | null;
          format?: string;
          id?: string;
          investigation_id: string;
          metadata?: Json;
          metrics?: Json | null;
          name: string;
          profile?: Json | null;
          snapshot_id?: string | null;
          source?: string;
          source_kind?: string;
          summary?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          category?: string;
          confidence?: string | null;
          coverage?: string | null;
          created_at?: string;
          created_by?: string | null;
          data_source_id?: string | null;
          file_id?: string | null;
          format?: string;
          id?: string;
          investigation_id?: string;
          metadata?: Json;
          metrics?: Json | null;
          name?: string;
          profile?: Json | null;
          snapshot_id?: string | null;
          source?: string;
          source_kind?: string;
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
      investigation_stages: {
        Row: {
          completed_at: string | null;
          id: string;
          investigation_id: string;
          stage: string;
          started_at: string;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          id?: string;
          investigation_id: string;
          stage: string;
          started_at?: string;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          id?: string;
          investigation_id?: string;
          stage?: string;
          started_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investigation_stages_investigation_id_fkey";
            columns: ["investigation_id"];
            isOneToOne: false;
            referencedRelation: "investigations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investigation_stages_workspace_id_fkey";
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
          current_stage: string;
          data_source_ids: string[];
          id: string;
          is_sample: boolean;
          known_context: string;
          objective: string;
          outcome: string | null;
          outcomes: string[];
          plan: Json | null;
          problem: string;
          status: string;
          title: string;
          topic: string;
          trigger: string | null;
          triggers: string[];
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          attachments?: string[];
          confidence?: string;
          created_at?: string;
          created_by?: string | null;
          current_stage?: string;
          data_source_ids?: string[];
          id?: string;
          is_sample?: boolean;
          known_context?: string;
          objective?: string;
          outcome?: string | null;
          outcomes?: string[];
          plan?: Json | null;
          problem: string;
          status?: string;
          title: string;
          topic?: string;
          trigger?: string | null;
          triggers?: string[];
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          attachments?: string[];
          confidence?: string;
          created_at?: string;
          created_by?: string | null;
          current_stage?: string;
          data_source_ids?: string[];
          id?: string;
          is_sample?: boolean;
          known_context?: string;
          objective?: string;
          outcome?: string | null;
          outcomes?: string[];
          plan?: Json | null;
          problem?: string;
          status?: string;
          title?: string;
          topic?: string;
          trigger?: string | null;
          triggers?: string[];
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
      source_datasets: {
        Row: {
          approx_rows: number;
          created_at: string;
          data_source_id: string;
          description: string;
          entity: string | null;
          id: string;
          key: string;
          mapping: Json;
          mapping_confirmed_at: string | null;
          name: string;
          schema: Json | null;
          selected: boolean;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          approx_rows?: number;
          created_at?: string;
          data_source_id: string;
          description?: string;
          entity?: string | null;
          id?: string;
          key: string;
          mapping?: Json;
          mapping_confirmed_at?: string | null;
          name: string;
          schema?: Json | null;
          selected?: boolean;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          approx_rows?: number;
          created_at?: string;
          data_source_id?: string;
          description?: string;
          entity?: string | null;
          id?: string;
          key?: string;
          mapping?: Json;
          mapping_confirmed_at?: string | null;
          name?: string;
          schema?: Json | null;
          selected?: boolean;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_datasets_data_source_id_fkey";
            columns: ["data_source_id"];
            isOneToOne: false;
            referencedRelation: "data_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_datasets_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      sync_runs: {
        Row: {
          created_by: string | null;
          data_source_id: string;
          error: string | null;
          finished_at: string | null;
          id: string;
          rows_read: number;
          rows_rejected: number;
          started_at: string;
          status: string;
          workspace_id: string;
        };
        Insert: {
          created_by?: string | null;
          data_source_id: string;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          rows_read?: number;
          rows_rejected?: number;
          started_at?: string;
          status?: string;
          workspace_id: string;
        };
        Update: {
          created_by?: string | null;
          data_source_id?: string;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          rows_read?: number;
          rows_rejected?: number;
          started_at?: string;
          status?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sync_runs_data_source_id_fkey";
            columns: ["data_source_id"];
            isOneToOne: false;
            referencedRelation: "data_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sync_runs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
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
          p_objective: string;
          p_outcomes: string[];
          p_plan: Json | null;
          p_problem: string;
          p_questions: Json;
          p_title: string;
          p_topic: string;
          p_triggers: string[];
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
