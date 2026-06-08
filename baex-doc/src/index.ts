import fs from 'fs';
import path from 'path';
import { parseProject, DocConfig } from './parser';
import { generateReport } from './generator';

async function main() {
    // Configuration can be extended to read from a file
    const config: DocConfig = {
        rootPath: path.resolve('..'),
        outputDir: path.join(path.resolve('..'), 'dist'),
        strict: true,
        minDocLength: 20
    };

    const outputFile = path.join(config.outputDir, 'index.html');

    console.log('🛠️  Starting Robust API Documentation Engine...');
    console.log(`📂 Root: ${config.rootPath}`);
    console.log(`🛡️  Strict Mode: ${config.strict ? 'ON' : 'OFF'}`);
    
    try {
        const { items, globalWarnings } = await parseProject(config);
        console.log(`📦 Found ${items.length} API items.`);
        
        if (globalWarnings.length > 0) {
            console.log(`⚠️  Found ${globalWarnings.length} documentation gaps.`);
        }
        
        const html = generateReport(items, globalWarnings);
        
        if (!fs.existsSync(config.outputDir)) {
            fs.mkdirSync(config.outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputFile, html);
        console.log(`✅ Professional report generated at: ${outputFile}`);
    } catch (error) {
        console.error('❌ Fatal Error during generation:', error);
        process.exit(1);
    }
}

main();
