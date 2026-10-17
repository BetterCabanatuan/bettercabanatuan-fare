// Types for the Supabase database, in the shape `supabase gen types typescript` writes.
// Regenerate with `npm run db:types` after a migration in supabase/migrations.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      community_jeep_route: {
        Row: {
          createdAt: string;
          distanceKm: number;
          farePaid: number | null;
          fromName: string;
          id: string;
          jeepType: Database["public"]["Enums"]["JeepType"];
          line: Json;
          name: string;
          toName: string;
          updatedAt: string;
          verifiedOn: string;
          via: string | null;
        };
        Insert: {
          createdAt?: string;
          distanceKm: number;
          farePaid?: number | null;
          fromName: string;
          id: string;
          jeepType: Database["public"]["Enums"]["JeepType"];
          line: Json;
          name: string;
          toName: string;
          updatedAt?: string;
          verifiedOn: string;
          via?: string | null;
        };
        Update: {
          createdAt?: string;
          distanceKm?: number;
          farePaid?: number | null;
          fromName?: string;
          id?: string;
          jeepType?: Database["public"]["Enums"]["JeepType"];
          line?: Json;
          name?: string;
          toName?: string;
          updatedAt?: string;
          verifiedOn?: string;
          via?: string | null;
        };
        Relationships: [];
      };
      route_submission: {
        Row: {
          createdAt: string;
          farePaid: number | null;
          fromLat: number;
          fromLng: number;
          fromName: string;
          id: string;
          jeepType: Database["public"]["Enums"]["JeepType"];
          name: string;
          notes: string | null;
          rejectionReason: string | null;
          reviewedAt: string | null;
          reviewedByEmail: string | null;
          routeId: string | null;
          status: Database["public"]["Enums"]["SubmissionStatus"];
          submitterContact: string | null;
          submitterName: string | null;
          toLat: number;
          toLng: number;
          toName: string;
          updatedAt: string;
          via: string | null;
        };
        Insert: {
          createdAt?: string;
          farePaid?: number | null;
          fromLat: number;
          fromLng: number;
          fromName: string;
          id?: string;
          jeepType?: Database["public"]["Enums"]["JeepType"];
          name: string;
          notes?: string | null;
          rejectionReason?: string | null;
          reviewedAt?: string | null;
          reviewedByEmail?: string | null;
          routeId?: string | null;
          status?: Database["public"]["Enums"]["SubmissionStatus"];
          submitterContact?: string | null;
          submitterName?: string | null;
          toLat: number;
          toLng: number;
          toName: string;
          updatedAt?: string;
          via?: string | null;
        };
        Update: {
          createdAt?: string;
          farePaid?: number | null;
          fromLat?: number;
          fromLng?: number;
          fromName?: string;
          id?: string;
          jeepType?: Database["public"]["Enums"]["JeepType"];
          name?: string;
          notes?: string | null;
          rejectionReason?: string | null;
          reviewedAt?: string | null;
          reviewedByEmail?: string | null;
          routeId?: string | null;
          status?: Database["public"]["Enums"]["SubmissionStatus"];
          submitterContact?: string | null;
          submitterName?: string | null;
          toLat?: number;
          toLng?: number;
          toName?: string;
          updatedAt?: string;
          via?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "route_submission_routeId_fkey";
            columns: ["routeId"];
            isOneToOne: false;
            referencedRelation: "community_jeep_route";
            referencedColumns: ["id"];
          },
        ];
      };
      toda: {
        Row: {
          barangay: string;
          barangaysServed: string[] | null;
          createdAt: string;
          id: string;
          lastVerified: string;
          lat: number | null;
          lng: number | null;
          name: string;
          officialContact: string | null;
          source: string;
          terminalDescription: string;
          units: number | null;
          updatedAt: string;
        };
        Insert: {
          barangay: string;
          barangaysServed?: string[] | null;
          createdAt?: string;
          id: string;
          lastVerified: string;
          lat?: number | null;
          lng?: number | null;
          name: string;
          officialContact?: string | null;
          source?: string;
          terminalDescription: string;
          units?: number | null;
          updatedAt?: string;
        };
        Update: {
          barangay?: string;
          barangaysServed?: string[] | null;
          createdAt?: string;
          id?: string;
          lastVerified?: string;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          officialContact?: string | null;
          source?: string;
          terminalDescription?: string;
          units?: number | null;
          updatedAt?: string;
        };
        Relationships: [];
      };
      toda_submission: {
        Row: {
          barangay: string;
          barangaysServed: string[] | null;
          createdAt: string;
          id: string;
          lat: number | null;
          lng: number | null;
          name: string;
          notes: string | null;
          officialContact: string | null;
          rejectionReason: string | null;
          reviewedAt: string | null;
          reviewedByEmail: string | null;
          status: Database["public"]["Enums"]["SubmissionStatus"];
          submitterContact: string | null;
          submitterName: string | null;
          terminalDescription: string;
          todaId: string | null;
          units: number | null;
          updatedAt: string;
        };
        Insert: {
          barangay: string;
          barangaysServed?: string[] | null;
          createdAt?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name: string;
          notes?: string | null;
          officialContact?: string | null;
          rejectionReason?: string | null;
          reviewedAt?: string | null;
          reviewedByEmail?: string | null;
          status?: Database["public"]["Enums"]["SubmissionStatus"];
          submitterContact?: string | null;
          submitterName?: string | null;
          terminalDescription: string;
          todaId?: string | null;
          units?: number | null;
          updatedAt?: string;
        };
        Update: {
          barangay?: string;
          barangaysServed?: string[] | null;
          createdAt?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          notes?: string | null;
          officialContact?: string | null;
          rejectionReason?: string | null;
          reviewedAt?: string | null;
          reviewedByEmail?: string | null;
          status?: Database["public"]["Enums"]["SubmissionStatus"];
          submitterContact?: string | null;
          submitterName?: string | null;
          terminalDescription?: string;
          todaId?: string | null;
          units?: number | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "toda_submission_todaId_fkey";
            columns: ["todaId"];
            isOneToOne: false;
            referencedRelation: "toda";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_route_submission: {
        Args: {
          distance_km: number;
          reviewer_email: string;
          road_line: Json;
          route_id: string;
          submission_id: string;
        };
        Returns: boolean;
      };
      approve_toda_submission: {
        Args: { reviewer_email: string; submission_id: string; toda_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      JeepType: "TRADITIONAL" | "MODERN" | "UNKNOWN";
      SubmissionStatus: "PENDING" | "VERIFIED" | "REJECTED";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
