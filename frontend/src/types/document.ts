export type DocumentType =
  | "contract"
  | "mou"
  | "adendum"
  | "agreement"
  | "supporting";
export type DocumentStatus = "draft" | "active" | "expired" | "terminated";

export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: string;
  file_name: string;
  file_path: string;
  file_hash: string;
  file_size: number;
  mime_type: string;
  notes?: string | null;
  is_current: boolean;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: number;
  project_id: number;
  document_number: string;
  document_name: string;
  document_type: DocumentType;
  partner: string;
  document_date: string;
  effective_date: string;
  expiry_date: string;
  status: DocumentStatus;
  description?: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  current_version?: DocumentVersion | null;
  versions?: DocumentVersion[];
}
