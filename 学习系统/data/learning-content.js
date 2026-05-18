import { TECH_BREAKER_MODULES } from './tech-breaker-content.js';
import { ENGINEERING_TOOLCHAIN_CONTENT } from './engineering-toolchain-content.js';
import { PERFORMANCE_DIAGNOSTICS_CONTENT } from './performance-diagnostics-content.js';
import { FRONTEND_ARCHITECTURE_CONTENT } from './frontend-architecture-content.js';
import { DELIVERY_PLATFORM_CONTENT } from './delivery-platform-content.js';
import { TESTING_QUALITY_CONTENT } from './testing-quality-content.js';
import { SECURITY_CONTENT } from './security-content.js';
import { RENDERING_ARCHITECTURE_CONTENT } from './rendering-architecture-content.js';
import { STATE_DATA_CONTENT } from './state-data-content.js';
import { DOCS_MODULES } from './docs-loader.js';

export const LONGFORM_MODULES = [
  ENGINEERING_TOOLCHAIN_CONTENT,
  PERFORMANCE_DIAGNOSTICS_CONTENT,
  FRONTEND_ARCHITECTURE_CONTENT,
  DELIVERY_PLATFORM_CONTENT,
  TESTING_QUALITY_CONTENT,
  SECURITY_CONTENT,
  RENDERING_ARCHITECTURE_CONTENT,
  STATE_DATA_CONTENT,
  ...DOCS_MODULES,
];

export const LEARNING_CONTENT = {
  modules: [
    ...TECH_BREAKER_MODULES,
    ...LONGFORM_MODULES,
  ],
};
