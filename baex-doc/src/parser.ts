import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface ApiItem {
    name: string;
    signature: string;
    description: string;
    language: 'rust' | 'ts';
    file: string;
    module: string;
    context: string;
    warnings: string[];
}

export interface DocConfig {
    rootPath: string;
    outputDir: string;
    strict: boolean;
    minDocLength: number;
}

export async function parseProject(config: DocConfig): Promise<{ items: ApiItem[], globalWarnings: string[] }> {
    const items: ApiItem[] = [];
    const globalWarnings: string[] = [];
    
    const files = await glob('**/*.{ts,rs}', { 
        cwd: config.rootPath, 
        ignore: ['node_modules/**', 'target/**', 'dist/**', 'pkg/**', '.git/**', 'node_modules/**'] 
    });

    for (const relativePath of files) {
        const fullPath = path.join(config.rootPath, relativePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const ext = path.extname(fullPath);
        const moduleName = path.dirname(relativePath) === '.' ? 'Root' : path.dirname(relativePath);
        
        if (ext === '.rs') {
            const { parsed, warnings } = parseRustFortress(content, relativePath, moduleName, config);
            items.push(...parsed);
            globalWarnings.push(...warnings);
        } else if (ext === '.ts') {
            const { parsed, warnings } = parseTypeScriptFortress(content, relativePath, moduleName, config);
            items.push(...parsed);
            globalWarnings.push(...warnings);
        }
    }
    
    return { items, globalWarnings };
}

function validateDoc(item: ApiItem, config: DocConfig): string[] {
    const warnings: string[] = [];
    if (!item.description || item.description.trim().length === 0) {
        warnings.push(`Missing documentation for ${item.name}`);
    } else if (item.description.trim().length < config.minDocLength) {
        warnings.push(`Documentation for ${item.name} is too brief (min ${config.minDocLength} chars)`);
    }
    return warnings;
}

function getBraceDepth(str: string): { open: number, close: number } {
    let open = 0, close = 0;
    for (const char of str) {
        if (char === '{') open++;
        if (char === '}') close++;
    }
    return { open, close };
}

function parseRustFortress(content: string, filename: string, module: string, config: DocConfig): { parsed: ApiItem[], warnings: string[] } {
    const parsed: ApiItem[] = [];
    const warnings: string[] = [];
    const lines = content.split('\n');
    
    let currentDocs: string[] = [];
    let currentContext = '';
    let globalBraceLevel = 0;
    let inBlockComment = false;

    // Regex to find any function: optional pub, optional async, then 'fn'
    const fnRegex = /(?:pub\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.includes('/*')) inBlockComment = true;
        if (inBlockComment) {
            if (line.includes('*/')) inBlockComment = false;
            continue;
        }

        if (line.startsWith('//') && !line.startsWith('///')) continue;

        if (line.startsWith('impl ') || line.startsWith('trait ') || line.startsWith('struct ')) {
            const match = line.match(/(?:impl|trait|struct)\s+([a-zA-Z0-9_]+)/);
            if (match) currentContext = `${match[1]} ${line.startsWith('impl') ? 'impl' : line.startsWith('trait') ? 'trait' : 'struct'}`;
        }

        if (line.startsWith('///')) {
            currentDocs.push(line.replace('///', '').trim());
        } else if (fnRegex.test(line) || (line.includes('fn ') && globalBraceLevel > 0)) {
            let signatureBuffer = '';
            let j = i;
            let signatureBraceLevel = 0;

            while (j < lines.length) {
                const currentLine = lines[j].trim();
                signatureBuffer += (signatureBuffer ? '\n' : '') + currentLine;
                const { open, close } = getBraceDepth(currentLine);
                signatureBraceLevel += open - close;
                if (signatureBraceLevel > 0 && currentLine.endsWith('{')) break;
                if (signatureBraceLevel === 0 && (currentLine.endsWith('{') || currentLine.endsWith(';'))) break;
                j++;
            }
            
            const nameMatch = signatureBuffer.match(fnRegex);
            const name = nameMatch ? nameMatch[1] : 'unknown';
            
            const item: ApiItem = {
                name,
                signature: signatureBuffer,
                description: currentDocs.join(' '),
                language: 'rust',
                file: filename,
                module,
                context: currentContext,
                warnings: []
            };

            if (config.strict) {
                const itemWarnings = validateDoc(item, config);
                item.warnings.push(...itemWarnings);
                itemWarnings.forEach(w => warnings.push(`[${filename}] ${w}`));
            }

            parsed.push(item);
            currentDocs = [];
            i = j;
        } else {
            currentDocs = [];
        }

        const { open, close } = getBraceDepth(line);
        globalBraceLevel += open - close;
        if (globalBraceLevel <= 0) {
            globalBraceLevel = 0;
            currentContext = '';
        }
    }
    return { parsed, warnings };
}

function parseTypeScriptFortress(content: string, filename: string, module: string, config: DocConfig): { parsed: ApiItem[], warnings: string[] } {
    const parsed: ApiItem[] = [];
    const warnings: string[] = [];
    const lines = content.split('\n');
    
    let currentDocs: string[] = [];
    let inDocBlock = false;
    let currentContext = '';
    let globalBraceLevel = 0;

    // Regex to find any function: optional export, optional async, 'function'
    const fnRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/;
    // Regex to find arrow functions: const/let name = ... =>
    const arrowRegex = /(?:export\s+)?(?:const|let)\s+([a-zA-Z0-9_]+)\s*=\s*\(?.*\)?\s*=>/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.includes('/*')) inDocBlock = true;
        if (inDocBlock && !line.startsWith('/**')) {
            if (line.includes('*/')) inDocBlock = false;
            continue;
        }

        if (line.startsWith('//') && !line.startsWith('/**')) continue;

        if (line.startsWith('class ') || line.startsWith('interface ') || line.startsWith('enum ')) {
            const match = line.match(/(?:class|interface|enum)\s+([a-zA-Z0-9_]+)/);
            if (match) currentContext = `${match[1]} ${line.startsWith('class') ? 'class' : line.startsWith('interface') ? 'interface' : 'enum'}`;
        }

        if (line.startsWith('/**')) {
            inDocBlock = true;
            currentDocs.push(line.replace('/**', '').replace('*/', '').trim());
        } else if (inDocBlock) {
            if (line.includes('*/')) {
                inDocBlock = false;
                currentDocs.push(line.replace('*/', '').trim());
            } else {
                currentDocs.push(line.replace(/^\s*\* ?/, '').trim());
            }
        }

        if (!inDocBlock || (inDocBlock && line.includes('*/'))) {
            if (fnRegex.test(line) || arrowRegex.test(line) || (line.includes('function') && globalBraceLevel > 0)) {
                let signatureBuffer = '';
                let j = i;
                let signatureBraceLevel = 0;

                while (j < lines.length) {
                    const currentLine = lines[j].trim();
                    signatureBuffer += (signatureBuffer ? '\n' : '') + currentLine;
                    const { open, close } = getBraceDepth(currentLine);
                    signatureBraceLevel += open - close;
                    if (signatureBraceLevel > 0 && currentLine.endsWith('{')) break;
                    if (signatureBraceLevel === 0 && (currentLine.endsWith('{') || currentLine.endsWith(';'))) break;
                    j++;
                }

                const nameMatch = line.match(fnRegex) || line.match(arrowRegex);
                const name = nameMatch ? nameMatch[1] : 'unknown';
                
                const item: ApiItem = {
                    name,
                    signature: signatureBuffer,
                    description: currentDocs.join(' '),
                    language: 'ts',
                    file: filename,
                    module,
                    context: currentContext,
                    warnings: []
                };

                if (config.strict) {
                    const itemWarnings = validateDoc(item, config);
                    item.warnings.push(...itemWarnings);
                    itemWarnings.forEach(w => warnings.push(`[${filename}] ${w}`));
                }

                const existing = parsed.find(p => p.name === name && p.context === item.context);
                if (existing) {
                    existing.signature += `\n${item.signature}`;
                } else {
                    parsed.push(item);
                }
                
                currentDocs = [];
                i = j;
            }
        }

        const { open, close } = getBraceDepth(line);
        globalBraceLevel += open - close;
        if (globalBraceLevel <= 0) {
            globalBraceLevel = 0;
            currentContext = '';
        }
    }
    return { parsed, warnings };
}
