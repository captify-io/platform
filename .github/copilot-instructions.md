## <!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## applyTo: "\*\*"

**PRIORITY**: Clean up after yourself - DO NOT leave commented code or unused imports. There is only 1 .env file do not create new ones.
**DO NOT** use `any` type in TypeScript - always use specific types or interfaces.
**DO NOT** use `console.log` in production code - use proper logging mechanisms.
DO NOT BUILD WORKAROUNDS OR VIBE CODE - if you don't understand something, ask for clarification.
** DO ** use `useCallback` and `useMemo` hooks appropriately to optimize performance.
** DO ** use Lucide (https://lucide.dev/) icons for consistency in UI components. always import icons dynamically to reduce bundle size.
import { DynamicIcon } from 'lucide-react/dynamic';

const App = () => (
<DynamicIcon name="camera" color="red" size={48} />
);

## Documentation Context

**FRONTEND/REACT WORK**: For React components, Next.js pages, frontend features, and UI development, reference and update `src/context/README.md` for documentation.

**BACKEND/AWS WORK**: For AWS Lambda functions, SAM templates, Python services, infrastructure, or API Gateway, reference and update `build/context/README.md` for documentation.

Make sure there's an entry in the appropriate README file for any file you create.

## Project Architecture

This workspace is designed for developing AI-powered decision-making applications using AWS services. The development phases are structured to build a robust platform with a focus on context management, agent orchestration, and decision intelligence.

**Frontend Stack**: TypeScript strict with Next.js 15, NextAuth.js, shadcn/ui components, and Tailwind CSS for styling.

**Backend Stack**: AWS Lambda (Python), API Gateway, Amazon Neptune (graph database), Amazon Bedrock for AI capabilities, and AWS SAM for infrastructure.

**Security**: Zero trust security principles are applied throughout the architecture, ensuring that all components are secure and compliant with enterprise standards.
