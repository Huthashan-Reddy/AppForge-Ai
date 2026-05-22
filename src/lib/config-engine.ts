/* Config Engine — parses, validates, and normalizes JSON app configs */
export interface FieldConfig {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  default?: unknown;
  options?: string[];
  placeholder?: string;
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
}

export interface EntityConfig {
  name: string;
  fields: FieldConfig[];
  icon?: string;
  displayField?: string;
}

export interface PageConfig {
  name: string;
  path: string;
  type: 'form' | 'table' | 'dashboard' | 'detail' | 'custom';
  entity?: string;
  title?: string;
  icon?: string;
  components?: ComponentConfig[];
}

export interface ComponentConfig {
  type: string;
  props?: Record<string, unknown>;
  children?: ComponentConfig[];
}

export interface AuthConfig {
  enabled: boolean;
  methods?: string[];
  fields?: FieldConfig[];
}

export interface AppConfig {
  name: string;
  description?: string;
  icon?: string;
  theme?: { primary?: string; mode?: string };
  locale?: string;
  locales?: Record<string, Record<string, string>>;
  entities: EntityConfig[];
  pages: PageConfig[];
  auth?: AuthConfig;
  notifications?: { enabled?: boolean; events?: string[] };
}

const KNOWN_FIELD_TYPES = ['text','number','email','password','textarea','select','checkbox','date','url','phone','file','color','rich-text'];
const KNOWN_PAGE_TYPES: PageConfig['type'][] = ['form','table','dashboard','detail','custom'];

/** Normalize a single field — fill defaults, fix types */
function normalizeField(f: Partial<FieldConfig>, idx: number): FieldConfig {
  return {
    name: f.name || `field_${idx}`,
    type: KNOWN_FIELD_TYPES.includes(f.type || '') ? f.type! : 'text',
    label: f.label || f.name || `Field ${idx + 1}`,
    required: typeof f.required === 'boolean' ? f.required : false,
    default: f.default ?? (f.type === 'checkbox' ? false : f.type === 'number' ? 0 : ''),
    options: Array.isArray(f.options) ? f.options.map(String) : undefined,
    placeholder: f.placeholder || '',
    validation: f.validation || undefined,
  };
}

/** Normalize an entity */
function normalizeEntity(e: Partial<EntityConfig>, idx: number): EntityConfig {
  const fields = Array.isArray(e.fields) ? e.fields.map((f, i) => normalizeField(f, i)) : [];
  return {
    name: e.name || `entity_${idx}`,
    fields,
    icon: e.icon || '📋',
    displayField: e.displayField || (fields.length > 0 ? fields[0].name : 'id'),
  };
}

/** Normalize a page */
function normalizePage(p: Partial<PageConfig>, idx: number, entities: EntityConfig[]): PageConfig {
  const type = KNOWN_PAGE_TYPES.includes(p.type as PageConfig['type']) ? p.type! : 'table';
  const entity = p.entity && entities.find(e => e.name === p.entity) ? p.entity : entities[0]?.name;
  return {
    name: p.name || `page_${idx}`,
    path: p.path || `/${p.name || `page-${idx}`}`,
    type,
    entity,
    title: p.title || p.name || `Page ${idx + 1}`,
    icon: p.icon || '📄',
    components: Array.isArray(p.components) ? p.components : undefined,
  };
}

/** Main parse + normalize function */
export function parseConfig(raw: unknown): { config: AppConfig; warnings: string[] } {
  const warnings: string[] = [];
  const input = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Partial<AppConfig>;

  if (!input || typeof input !== 'object') {
    warnings.push('Invalid config object, using defaults');
  }

  const entities = Array.isArray(input?.entities) 
    ? input.entities.map((e, i) => normalizeEntity(e, i)) 
    : [];

  if (entities.length === 0) {
    warnings.push('No entities defined — you should add at least one entity');
  }

  let pages = Array.isArray(input?.pages)
    ? input.pages.map((p, i) => normalizePage(p, i, entities))
    : [];

  // Auto-generate pages if none provided
  if (pages.length === 0 && entities.length > 0) {
    warnings.push('No pages defined — auto-generating table pages for each entity');
    pages = entities.map((e, i) => ({
      name: e.name,
      path: `/${e.name}`,
      type: 'table' as const,
      entity: e.name,
      title: e.name.charAt(0).toUpperCase() + e.name.slice(1),
      icon: e.icon || '📋',
    }));
  }

  const config: AppConfig = {
    name: input?.name || 'Untitled App',
    description: input?.description || '',
    icon: input?.icon || '🚀',
    theme: { primary: input?.theme?.primary || '#8b5cf6', mode: input?.theme?.mode || 'dark' },
    locale: input?.locale || 'en',
    locales: input?.locales || {},
    entities,
    pages,
    auth: {
      enabled: input?.auth?.enabled !== false,
      methods: Array.isArray(input?.auth?.methods) ? input.auth!.methods : ['email'],
      fields: input?.auth?.fields?.map((f, i) => normalizeField(f, i)) || [],
    },
    notifications: {
      enabled: input?.notifications?.enabled !== false,
      events: Array.isArray(input?.notifications?.events) ? input.notifications!.events : ['create','update','delete'],
    },
  };

  return { config, warnings };
}

/** Validate data against entity schema */
export function validateEntityData(entity: EntityConfig, data: Record<string, unknown>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of entity.fields) {
    const value = data[field.name];
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.name] = `${field.label || field.name} is required`;
      continue;
    }
    if (value !== undefined && value !== '' && field.validation) {
      const v = field.validation;
      if (v.min !== undefined && typeof value === 'number' && value < v.min) {
        errors[field.name] = v.message || `Minimum value is ${v.min}`;
      }
      if (v.max !== undefined && typeof value === 'number' && value > v.max) {
        errors[field.name] = v.message || `Maximum value is ${v.max}`;
      }
      if (v.pattern && typeof value === 'string' && !new RegExp(v.pattern).test(value)) {
        errors[field.name] = v.message || `Invalid format`;
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Generate SQL columns from entity fields */
export function entityToColumns(entity: EntityConfig): string {
  return entity.fields.map(f => {
    switch (f.type) {
      case 'number': return `"${f.name}" REAL`;
      case 'checkbox': return `"${f.name}" INTEGER DEFAULT 0`;
      case 'date': return `"${f.name}" TEXT`;
      default: return `"${f.name}" TEXT DEFAULT ''`;
    }
  }).join(', ');
}

/** Sample config for demos */
export const SAMPLE_CONFIG: AppConfig = {
  name: "Task Manager Pro",
  description: "A project management application",
  icon: "✅",
  theme: { primary: "#8b5cf6", mode: "dark" },
  locale: "en",
  locales: {
    en: { "app.title": "Task Manager Pro", "nav.tasks": "Tasks", "nav.projects": "Projects", "nav.team": "Team" },
    es: { "app.title": "Gestor de Tareas Pro", "nav.tasks": "Tareas", "nav.projects": "Proyectos", "nav.team": "Equipo" },
    fr: { "app.title": "Gestionnaire de Tâches Pro", "nav.tasks": "Tâches", "nav.projects": "Projets", "nav.team": "Équipe" },
  },
  entities: [
    {
      name: "tasks",
      icon: "✅",
      displayField: "title",
      fields: [
        { name: "title", type: "text", label: "Title", required: true, placeholder: "Enter task title" },
        { name: "description", type: "textarea", label: "Description", placeholder: "Describe the task..." },
        { name: "status", type: "select", label: "Status", options: ["todo","in_progress","review","done"], default: "todo" },
        { name: "priority", type: "select", label: "Priority", options: ["low","medium","high","critical"], default: "medium" },
        { name: "assignee", type: "text", label: "Assignee" },
        { name: "due_date", type: "date", label: "Due Date" },
        { name: "completed", type: "checkbox", label: "Completed", default: false },
      ],
    },
    {
      name: "projects",
      icon: "📁",
      displayField: "name",
      fields: [
        { name: "name", type: "text", label: "Project Name", required: true },
        { name: "description", type: "textarea", label: "Description" },
        { name: "status", type: "select", label: "Status", options: ["active","paused","completed","archived"], default: "active" },
        { name: "budget", type: "number", label: "Budget", validation: { min: 0 } },
        { name: "start_date", type: "date", label: "Start Date" },
        { name: "end_date", type: "date", label: "End Date" },
      ],
    },
    {
      name: "team",
      icon: "👥",
      displayField: "name",
      fields: [
        { name: "name", type: "text", label: "Full Name", required: true },
        { name: "email", type: "email", label: "Email", required: true },
        { name: "role", type: "select", label: "Role", options: ["developer","designer","manager","qa","devops"] },
        { name: "department", type: "text", label: "Department" },
        { name: "active", type: "checkbox", label: "Active", default: true },
      ],
    },
  ],
  pages: [
    { name: "tasks", path: "/tasks", type: "table", entity: "tasks", title: "Tasks", icon: "✅" },
    { name: "projects", path: "/projects", type: "table", entity: "projects", title: "Projects", icon: "📁" },
    { name: "team", path: "/team", type: "table", entity: "team", title: "Team Members", icon: "👥" },
    { name: "dashboard", path: "/dashboard", type: "dashboard", title: "Dashboard", icon: "📊" },
  ],
  auth: { enabled: true, methods: ["email", "magic-link"] },
  notifications: { enabled: true, events: ["create", "update", "delete"] },
};
