export const reportTemplate = (data: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Documentation</title>
    <!-- Prism.js for Syntax Highlighting -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
    <style>
        :root {
            --bg: #0b0f1a;
            --bg-card: #13192a;
            --accent: #3b82f6;
            --accent-glow: rgba(59, 130, 246, 0.3);
            --text: #f1f5f9;
            --text-muted: #94a3b8;
            --border: #24304a;
            --code-bg: #020617;
            --warning-bg: rgba(245, 158, 11, 0.1);
            --warning-border: #f59e0b;
            --warning-text: #fbbf24;
            --sidebar-width: 380px;
        }
        body {
            background-color: var(--bg);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            display: flex;
            min-height: 100vh;
        }
        
        /* Mobile Header */
        .mobile-header {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border);
            z-index: 1000;
            align-items: center;
            justify-content: space-between;
            padding: 0 1rem;
            backdrop-filter: blur(12px);
        }

        .menu-toggle {
            background: var(--accent);
            border: none;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.8rem;
        }

        aside {
            width: var(--sidebar-width);
            min-width: var(--sidebar-width);
            max-width: var(--sidebar-width);
            flex-shrink: 0;
            height: 100vh;
            position: sticky;
            top: 0;
            border-right: 1px solid var(--border);
            padding: 2rem 1.5rem;
            overflow-y: auto;
            background: rgba(11, 15, 26, 0.95);
            backdrop-filter: blur(12px);
            box-sizing: border-box;
            transition: transform 0.3s ease;
            z-index: 999;
        }
        
        main {
            flex: 1;
            padding: 3rem 2rem;
            max-width: 1100px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
        }

        .search-box {
            width: 100%;
            padding: 0.6rem 1rem;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: white;
            margin-bottom: 2rem;
            outline: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        .search-box:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 2px var(--accent-glow);
        }
        .nav-group {
            margin-bottom: 2rem;
        }
        .nav-group h3 {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: var(--text-muted);
            margin-bottom: 0.75rem;
            padding-left: 0.8rem;
        }
        .nav-item {
            display: block;
            padding: 0.5rem 0.8rem;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.85rem;
            border-radius: 6px;
            transition: all 0.2s ease;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .nav-item:hover {
            background: var(--border);
            color: var(--text);
        }
        .nav-item.active {
            background: var(--accent);
            color: white;
            font-weight: 500;
        }
        .api-section {
            margin-bottom: 5rem;
            scroll-margin-top: 4rem;
        }
        .api-section h2 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--border);
            background: linear-gradient(to right, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .api-item {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2.5rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .api-item:hover {
            transform: translateY(-4px);
            border-color: var(--accent);
        }
        .signature {
            margin-bottom: 1.5rem;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--border);
        }
        .signature pre[class*="language-"] {
            margin: 0 !important;
            background: var(--code-bg) !important;
            border-radius: 0 !important;
        }
        .description {
            color: var(--text-muted);
            margin-bottom: 1.5rem;
            font-size: 1rem;
            line-height: 1.7;
        }
        .tag {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            border-radius: 4px;
            margin-right: 0.75rem;
            background: var(--border);
            color: var(--text-muted);
            border: 1px solid transparent;
        }
        .tag-rust { color: #f97316; border-color: #f97316; background: rgba(249, 115, 22, 0.1); }
        .tag-ts { color: #3178c6; border-color: #3178c6; background: rgba(49, 120, 198, 0.1); }
        
        .audit-panel {
            background: var(--warning-bg);
            border: 1px solid var(--warning-border);
            border-radius: 16px;
            padding: 1rem 1.5rem;
            margin-bottom: 3rem;
            color: var(--warning-text);
            transition: all 0.3s ease;
        }
        .audit-header {
            cursor: pointer;
            user-select: none;
        }
        .audit-badge {
            background: var(--warning-border);
            color: var(--bg);
            padding: 0.2rem 0.6rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: bold;
        }
        .audit-content {
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        .warning-box {
            background: var(--warning-bg);
            border-left: 4px solid var(--warning-border);
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
            border-radius: 0 8px 8px 0;
            font-size: 0.85rem;
            color: var(--warning-text);
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
            body {
                flex-direction: column;
            }
            .mobile-header {
                display: flex;
            }
            aside {
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                width: 85vw; 
                max-width: var(--sidebar-width);
                transform: translateX(-100%);
                z-index: 1001;
                box-shadow: 10px 0 30px rgba(0,0,0,0.5);
            }
            aside.open {
                transform: translateX(0);
            }
            main {
                padding: 5rem 1rem 2rem 1rem;
                margin-top: 0;
            }
            .api-section h2 {
                font-size: 1.5rem;
            }
            .api-item {
                padding: 1.25rem;
            }
        }
    </style>
</head>
<body>
    <div class="mobile-header">
        <div style="font-weight: 900; background: linear-gradient(to right, #60a5fa, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.2rem;">API DOCS</div>
        <button class="menu-toggle" id="menuToggle">MENU</button>
    </div>
    <aside id="sidebar">
        <div style="margin-bottom: 2rem; text-align: center">
            <h1 style="font-size: 1.75rem; margin: 0; font-weight: 900; background: linear-gradient(to right, #60a5fa, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">API DOCS</h1>
            <div style="font-size: 0.65rem; opacity: 0.5; letter-spacing: 0.2em; margin-top: 0.25rem;">SYSTEM REFERENCE</div>
        </div>
        <input type="text" class="search-box" id="search" placeholder="Filter API members...">
        <div id="nav-content"></div>
    </aside>
    <main>
        ${data}
    </main>
    <!-- Prism.js Core and Languages -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-rust.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script>
        const searchInput = document.getElementById('search');
        const navItems = document.querySelectorAll('.nav-item');
        const apiItems = document.querySelectorAll('.api-item');
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');

        // Audit Panel Toggle
        const auditToggle = document.getElementById('auditToggle');
        const auditContent = document.getElementById('auditContent');
        if (auditToggle && auditContent) {
            auditToggle.addEventListener('click', () => {
                const isHidden = auditContent.style.display === 'none' || !auditContent.style.display;
                auditContent.style.display = isHidden ? 'block' : 'none';
            });
        }

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                menuToggle.textContent = sidebar.classList.contains('open') ? 'CLOSE' : 'MENU';
            });
        }

        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            
            navItems.forEach(item => {
                const match = item.textContent.toLowerCase().includes(term);
                item.style.display = match ? 'block' : 'none';
            });

            apiItems.forEach(item => {
                const name = item.querySelector('strong').textContent.toLowerCase();
                const desc = item.querySelector('.description').textContent.toLowerCase();
                const match = name.includes(term) || desc.includes(term);
                item.style.display = match ? 'block' : 'none';
            });
        });

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const targetId = item.getAttribute('data-target');
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('open');
                        menuToggle.textContent = 'MENU';
                    }
                }
            });
        });
    </script>
</body>
</html>
`;
