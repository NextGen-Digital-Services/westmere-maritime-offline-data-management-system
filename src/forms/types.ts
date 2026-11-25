export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'textarea'
  | 'coordinates'
  | 'signature';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: FormFieldOption[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  colSpan?: 1 | 2; // Grid columns
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Navigation' | 'Engineering' | 'Safety' | 'Commercial' | 'Crew';
  icon: string;
  sections: FormSection[];
}
