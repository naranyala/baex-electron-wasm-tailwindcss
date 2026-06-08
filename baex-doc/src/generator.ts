import { ApiItem } from './parser';
import { reportTemplate } from '../templates/report';

export function generateReport(items: ApiItem[], globalWarnings: string[]): string {
    const groups: Record<string, ApiItem[]> = {};
    
    items.forEach(item => {
        if (!groups[item.module]) groups[item.module] = [];
        groups[item.module].push(item);
    });

    let contentHtml = '';
    let navHtml = '';

    // Summary Section
    if (globalWarnings.length > 0) {
        contentHtml += `
            <div class="audit-panel">
                <div class="audit-header" id="auditToggle" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">⚠️ Documentation Audit</h3>
                    <span class="audit-badge">${globalWarnings.length} Issues</span>
                </div>
                <div class="audit-content" id="auditContent" style="display: none; margin-top: 1rem; border-top: 1px solid var(--warning-border); padding-top: 1rem;">
                    <p>The following issues were found in the API documentation:</p>
                    <ul>
                        ${globalWarnings.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    Object.entries(groups).sort().forEach(([module, groupItems]) => {
        const moduleId = module.replace(/[^a-zA-Z0-9]/g, '_');
        
        navHtml += `
            <div class="nav-group">
                <h3>${module}</h3>
                ${groupItems.sort((a, b) => a.name.localeCompare(b.name)).map(item => `
                    <a class="nav-item" data-target="${item.name}">
                        ${item.name}
                    </a>
                `).join('')}
            </div>
        `;

        contentHtml += `
            <section class="api-section" id="${moduleId}">
                <h2>${module}</h2>
                ${groupItems.sort((a, b) => a.name.localeCompare(b.name)).map(item => `
                    <div class="api-item" id="${item.name}">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <span class="tag ${item.language === 'rust' ? 'tag-rust' : 'tag-ts'}">${item.language}</span>
                            <strong style="font-size: 1.2rem;">${item.name}</strong>
                            ${item.context ? `<span style="color: var(--text-muted); font-size: 0.8rem; opacity: 0.7;">in ${item.context}</span>` : ''}
                        </div>
                        ${item.warnings.length > 0 ? `
                            <div class="warning-box">
                                <strong>Doc Warning:</strong> ${item.warnings.join(', ')}
                            </div>
                        ` : ''}
                        <div class="signature"><pre><code class="language-${item.language === 'rust' ? 'rust' : 'typescript'}">${item.signature}</code></pre></div>
                        <div class="description">${item.description || '<em>No documentation provided.</em>'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 1rem;">Source: ${item.file}</div>
                    </div>
                `).join('')}
            </section>
        `;
    });

    const finalHtml = reportTemplate(contentHtml);
    return finalHtml.replace('<div id="nav-content"></div>', `<div id="nav-content">${navHtml}</div>`);
}
