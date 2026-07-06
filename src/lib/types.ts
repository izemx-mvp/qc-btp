export type ProjectStatus = "actif" | "termine" | "en_pause";
export type InspectionResult = "conforme" | "non_conforme";
export type ItemResult = "conforme" | "non_conforme" | "non_applicable" | "";
export type InspectionStage = "brouillon" | "rempli" | "signe" | "classe" | "partage";
export type NCStatus = "ouvert" | "ferme";
export type ClientPlatform = "gdrive" | "sharepoint";

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  startDate: string;
  status: ProjectStatus;
  whatsappGroup?: string;
  clientPlatform?: ClientPlatform;
  clientFolderPath?: string; // ex: /Clients/Groupe Beton SA/SNG
  controlPlan?: {
    name: string;
    ref: string;
    controlTypes: string[]; // ferraillage, coffrage, ...
  };
}

export interface ChecklistItem {
  id: string;
  label: string;
  expected: ItemResult; // expected outcome
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  controlType: string;
  projectId?: string; // optional: template scoped or global
  items: ChecklistItem[];
}

export interface FilledItem {
  itemId: string;
  label: string;
  result: ItemResult;
  comment: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string; // base64
}

export interface Inspection {
  id: string;
  number: string; // auto
  projectId: string;
  controlType: string;
  checklistTemplateId?: string;
  checklistName: string;
  date: string;
  zone: string; // partie d'ouvrage
  result: InspectionResult | "";
  items: FilledItem[];
  ncDescription?: string;
  ncActionPlan?: string;
  ncStatus?: NCStatus;
  ncClosedDate?: string;
  attachments: Attachment[];
  stage: InspectionStage;
  sharedWithClient: boolean;
  signedPdfName?: string;
  signedPdfUploadedAt?: string;
  sharedDestination?: ClientPlatform;
  sharedAt?: string;
  sharedLink?: string;
  createdAt: string;
}
