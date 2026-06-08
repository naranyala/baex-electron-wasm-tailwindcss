export const reportTemplate = (data: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BAEX API Documentation</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #020617;
            --bg-sidebar: #0f172a;
            --bg-card: #1e293b;
            --bg-card-hover: #334155;
            --accent: #3b82f6;
            --accent-glow: rgba(59, 130, 246, 0.15);
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --border: #1e293b;
            --border-light: #334155;
            --code-bg: #000000;
            --warning-bg: rgba(245, 158, 11, 0.05);
            --warning-border: #f59e0b;
            --warning-text: #fbbf24;
            --sidebar-width: 320px;
        }

        * { box-sizing: border-box; }

        body {
            background-color: var(--bg);
            color: var(--text);
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            margin: 0;
            display: flex;
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--border-light); }

        /* Mobile Header */
        .mobile-header {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 64px;
            background: var(--bg-sidebar);
            border-bottom: 1px solid var(--border);
            z-index: 1000;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
            backdrop-filter: blur(12px);
        }

        .menu-toggle {
            background: var(--accent);
            border: none;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.8rem;
            transition: filter 0.2s;
        }
        .menu-toggle:hover { filter: brightness(1.1); }

        aside {
            width: var(--sidebar-width);
            min-width: var(--sidebar-width);
            max-width: var(--sidebar-width);
            height: 100vh;
            position: sticky;
            top: 0;
            border-right: 1px solid var(--border);
            padding: 2rem 1.25rem;
            overflow-y: auto;
            background: var(--bg-sidebar);
            box-sizing: border-box;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 999;
            display: flex;
            flex-direction: column;
        }

        .sidebar-brand {
            text-align: center;
            margin-bottom: 2.5rem;
        }
        .sidebar-brand h1 {
            font-size: 1.5rem;
            font-weight: 800;
            margin: 0;
            background: linear-gradient(to right, #60a5fa, #f472b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.02em;
        }
        .sidebar-brand span {
            font-size: 0.65rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-weight: 600;
        }

        .search-box {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 10px;
            color: white;
            margin-bottom: 2rem;
            outline: none;
            font-size: 0.9rem;
            transition: all 0.2s;
            box-sizing: border-box;
        }
        .search-box:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .nav-group {
            margin-bottom: 1.5rem;
        }
        .nav-group h3 {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            margin: 0 0 0.75rem 0.75rem;
            opacity: 0.7;
        }
        .nav-item {
            display: block;
            padding: 0.6rem 0.8rem;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.875rem;
            border-radius: 8px;
            transition: all 0.2s ease;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 2px;
        }
        .nav-item:hover {
            background: var(--bg-card);
            color: var(--text);
        }
        .nav-item.active {
            background: var(--accent);
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 12px var(--accent-glow);
        }

        main {
            flex: 1;
            padding: 4rem 3rem;
            max-width: 1100px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
        }

        /* Filter Bar */
        .filter-bar {
            display: flex;
            justify-content: center;
            margin-bottom: 3rem;
        }
        .filter-group {
            display: flex;
            background: var(--bg-sidebar);
            padding: 4px;
            border-radius: 12px;
            border: 1px solid var(--border);
        }
        .filter-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            padding: 0.6rem 1.2rem;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .filter-btn span {
            background: var(--bg);
            color: var(--text-muted);
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-family: 'JetBrains Mono', monospace;
        }
        .filter-btn:hover {
            color: var(--text);
        }
        .filter-btn.active {
            background: var(--bg-card);
            color: var(--text);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .filter-btn.active span {
            background: var(--accent);
            color: white;
        }

        .api-section {
            margin-bottom: 6rem;
            scroll-margin-top: 4rem;
        }
        .api-section h2 {
            font-size: 2.25rem;
            font-weight: 800;
            margin-bottom: 2.5rem;
            letter-spacing: -0.025em;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .api-section h2::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
            opacity: 0.5;
        }

        .api-item {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        .api-item:hover {
            transform: translateY(-4px);
            border-color: var(--border-light);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .api-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--accent);
            opacity: 0;
            transition: opacity 0.2s;
        }
        .api-item:hover::before {
            opacity: 1;
        }

        .item-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 1.25rem;
        }
        .item-name {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text);
        }
        .item-context {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-weight: 400;
            background: var(--bg);
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid var(--border);
        }

        .signature {
            margin-bottom: 1.5rem;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--border);
            background: var(--code-bg);
        }
        .signature pre[class*="language-"] {
            margin: 0 !important;
            padding: 1.25rem !important;
            background: transparent !important;
            font-family: 'JetBrains Mono', monospace !important;
            font-size: 0.9rem !important;
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
            font-size: 0.6rem;
            font-weight: 800;
            text-transform: uppercase;
            border-radius: 6px;
            background: var(--border);
            color: var(--text-muted);
            letter-spacing: 0.05em;
        }
        .tag-rust { color: #f97316; background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.2); }
        .tag-ts { color: #3178c6; background: rgba(49, 120, 198, 0.1); border: 1px solid rgba(49, 120, 198, 0.2); }
        
        .audit-panel {
            background: var(--warning-bg);
            border: 1px solid var(--warning-border);
            border-radius: 16px;
            padding: 1rem 1.5rem;
            margin-bottom: 3rem;
            color: var(--warning-text);
            backdrop-filter: blur(4px);
        }
        .audit-header {
            cursor: pointer;
            user-select: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .audit-header h3 {
            margin: 0;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 10px;
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

        .source-footer {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
            font-size: 0.75rem;
            color: var(--text-muted);
        }
        .source-label {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.65rem;
            letter-spacing: 0.05em;
        }
        .source-path {
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-muted);
            background: var(--bg);
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid var(--border);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        @media (max-width: 768px) {
            body { flex-direction: column; }
            .mobile-header { display: flex; }
            aside {
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                width: 85vw; 
                max-width: var(--sidebar-width);
                transform: translateX(-100%);
                z-index: 1001;
                box-shadow: 20px 0 50px rgba(0,0,0,0.7);
            }
            aside.open { transform: translateX(0); }
            main { padding: 6rem 1.25rem 2rem 1.25rem; }
            .api-section h2 { font-size: 1.75rem; }
        }
    </style>
</head>
<body>
    <div class="mobile-header">
        <div style="font-weight: 900; background: linear-gradient(to right, #60a5fa, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.2rem;">API DOCS</div>
        <button class="menu-toggle" id="menuToggle">MENU</button>
    </div>
    <aside id="sidebar">
        <div class="sidebar-brand">
            <h1>API DOCS</h1>
            <span>System Reference</span>
        </div>
        <input type="text" class="search-box" id="search" placeholder="Search API members...">
        <div id="nav-content"></div>
    </aside>
    <main>
        ${data}
    </main>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-rust.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script>
        const searchInput = document.getElementById('search');
        const navItems = document.querySelectorAll('.nav-item');
        const apiItems = document.querySelectorAll('.api-item');
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        
        let currentFilter = 'all';

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                applyFilters();
            });
        });

        function applyFilters() {
            const term = searchInput.value.toLowerCase();
            
            apiItems.forEach(item => {
                const hasDoc = item.getAttribute('data-has-doc') === 'true';
                const nameEl = item.querySelector('strong');
                const descEl = item.querySelector('.description');
                
                const name = nameEl ? nameEl.textContent.toLowerCase() : '';
                const desc = descEl ? descEl.textContent.toLowerCase() : '';
                
                const matchesSearch = name.includes(term) || desc.includes(term);
                let matchesFilter = true;
                if (currentFilter === 'documented') matchesFilter = hasDoc;
                if (currentFilter === 'undocumented') matchesFilter = !hasDoc;
                
                item.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
            });

            navItems.forEach(item => {
                const hasDoc = item.getAttribute('data-has-doc') === 'true';
                const text = item.textContent.toLowerCase();
                
                const matchesSearch = text.includes(term);
                let matchesFilter = true;
                if (currentFilter === 'documented') matchesFilter = hasDoc;
                if (currentFilter === 'undocumented') matchesFilter = !hasDoc;
                
                item.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
            });
        }

        searchInput.addEventListener('input', applyFilters);

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

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const targetId = item.getAttribute('data-target');
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.style.display = 'block';
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
