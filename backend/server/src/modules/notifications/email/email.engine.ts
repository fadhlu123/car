import path from 'path';
import fs   from 'fs/promises';
import Handlebars from 'handlebars';
import { env } from '../../../configs/env.config';
import { createLogger } from '../../../utils/logger.utils';

const logger = createLogger('email-engine');

// eq is not built into Handlebars — templates use {{#if (eq x "y")}} so we register it once here
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

// __dirname here is the compiled output path — templates must live alongside the JS.
// In dev (ts-node) this resolves to src/modules/notifications/email/
// In production (dist/) run: cp -r src/modules/notifications/email/templates dist/modules/notifications/email/
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const PARTIALS_DIR  = path.join(TEMPLATES_DIR, 'partials');

// Compiled template cache — populated lazily; bypassed in dev so file edits are picked up
const cache = new Map<string, HandlebarsTemplateDelegate>();
let partialsLoaded = false;

const loadPartials = async (): Promise<void> => {
  if (partialsLoaded) return;
  try {
    const files = await fs.readdir(PARTIALS_DIR);
    await Promise.all(
      files
        .filter((f) => f.endsWith('.hbs'))
        .map(async (f) => {
          const name    = path.basename(f, '.hbs');
          const content = await fs.readFile(path.join(PARTIALS_DIR, f), 'utf-8');
          Handlebars.registerPartial(name, content);
        })
    );
    partialsLoaded = true;
  } catch (err: any) {
    logger.warn(`Email partials not loaded: ${err.message}`);
  }
};

export const renderTemplate = async (
  name: string,
  context: Record<string, unknown>
): Promise<string> => {
  await loadPartials();

  let compiled = cache.get(name);
  if (!compiled) {
    const filePath = path.join(TEMPLATES_DIR, `${name}.hbs`);
    let source: string;
    try {
      source = await fs.readFile(filePath, 'utf-8');
    } catch {
      throw new Error(`Email template not found: ${name}`);
    }
    compiled = Handlebars.compile(source);
    // Only cache in production — dev always re-reads so edits are visible instantly
    if (env.isProduction) cache.set(name, compiled);
  }

  return compiled({
    ...context,
    appName: env.SERVICE_NAME,
    year:    new Date().getFullYear(),
  });
};
