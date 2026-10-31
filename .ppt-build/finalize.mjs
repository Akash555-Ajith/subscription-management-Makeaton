import path from 'node:path';
import {pathToFileURL} from 'node:url';
process.env.RUNTIME_NODE_MODULES='C:/Users/akash/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const skill='C:/Users/akash/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({workspaceDir:'C:/Users/akash/OneDrive/Desktop/Make-a-Ton',candidatePath:'C:/Users/akash/OneDrive/Desktop/Make-a-Ton/.ppt-build/candidate.pptx',finalPath:'C:/Users/akash/OneDrive/Desktop/Make-a-Ton/output/Cycvera-Feature-Overview-Validated.pptx',pythonExecutable:'C:/Users/akash/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],fontPolicy:{basis:'design',families:['Aptos']},verifyArtifactToolImport:true,receiptPath:'C:/Users/akash/OneDrive/Desktop/Make-a-Ton/.ppt-build/validation.json'});console.log(JSON.stringify(result));

