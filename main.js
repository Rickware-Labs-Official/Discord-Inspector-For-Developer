// • Author: .rick.c137
// • Code by: Rickware - Labs©
// • 2026 Handmade Source Code ❤
// • Discord: https://discord.gg/Wk7d8mJgyN
// • https://rickware-labs-official.github.io/Launcher/

(function() {
    if (window.__rwiInspectorLoaded) {
        window.__rwiInspectorLoaded.destroy();
    }

    const state = {
        selected: null,
        history: [],
        currentFiber: null,
        pickMode: false,
        hoverMode: false,
        liveWatch: false,
        devtoolsRightClick: true,
        webpackRequire: null,
        mutationLog: [],
        mutationObserver: null,
        lastSearchMatches: [],
        lastHiddenMatches: [],
        lastWebpackResults: [],
        highlightBoxes: [],
        revealMode: false,
        notifTimeout: null,
        autoDehash: true,
        allBoxesMode: false,
        lastHoverTarget: null,
        codeScans: {},
        codeCurrentResource: 'html',
        codeMatches: [],
        codeMatchIndex: -1
    };

    const flashingElements = new WeakSet();
    let mutationFlushScheduled = false;
    let pendingMutationBatches = [];
    let allBoxesRenderScheduled = false;
    const ALL_BOXES_LIMIT = 400;
    const MAX_CODE_LINES = 4000;
    const MAX_SCRIPTS_PROCESSED = 40;
    let sidebarTabInterval = null;

    const revealedStore = new Map();

    const style = document.createElement('style');
    style.id = 'rwi-style';
    style.textContent = `
        #rwi-ui { position: fixed; bottom: 24px; right: 24px; width: 660px; background: #18181b; color: #e4e4e7; border: 1px solid #7c3aed; border-radius: 12px; z-index: 2147483647; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.7); display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0.97; user-select: none; }
        #rwi-ui.rwi-minimized { width: 150px; height: 46px; min-height: 46px; bottom: 24px !important; right: 24px !important; left: auto !important; top: auto !important; border-radius: 23px; }
        #rwi-ui.rwi-minimized #rwi-tabs, #rwi-ui.rwi-minimized #rwi-body, #rwi-ui.rwi-minimized .rwi-title-container { display: none; }
        #rwi-ui.rwi-minimized #rwi-header { background: #18181b; padding: 0 14px; height: 100%; border: none; cursor: default; justify-content: flex-end; }
        #rwi-header { background: linear-gradient(135deg, #6d28d9, #7c3aed); padding: 14px; font-weight: 600; text-align: center; font-size: 16px; letter-spacing: 0.5px; cursor: grab; position: relative; display: flex; justify-content: space-between; align-items: center; }
        #rwi-header:active { cursor: grabbing; }
        .rwi-title-container { display: flex; align-items: center; gap: 8px; font-size: 14px; }
        .rwi-brand { background: #8c009f; border: 1px solid #5b21b6; padding: 4px 8px; border-radius: 6px; color: #ffffff; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .rwi-highlight { background: #3b0764; border: 1px solid #2e1065; padding: 4px 8px; border-radius: 6px; color: #e9d5ff; }
        .rwi-actions { display: flex; gap: 6px; align-items: center; }
        .rwi-btn-icon { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s ease; line-height: 1; padding: 0; }
        .rwi-btn-icon:hover { background: rgba(0,0,0,0.4); }
        #rwi-close { background: rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.6); }
        #rwi-close:hover { background: rgba(239, 68, 68, 0.9); }
        #rwi-tabs { display: flex; border-bottom: 1px solid #3f3f46; background: #27272a; overflow-x: auto; }
        #rwi-tabs::-webkit-scrollbar { height: 4px; }
        #rwi-tabs::-webkit-scrollbar-track { background: #18181b; }
        #rwi-tabs::-webkit-scrollbar-thumb { background: #7c3aed; }
        .rwi-tab { flex: 0 0 auto; padding: 10px 14px; background: transparent; border: none; color: #a1a1aa; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s ease; }
        .rwi-tab:hover { color: #e4e4e7; background: rgba(124, 58, 237, 0.1); }
        .rwi-tab.active { color: #c4b5fd; border-bottom: 2px solid #7c3aed; background: rgba(124, 58, 237, 0.15); }
        #rwi-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; position: relative; min-height: 200px; max-height: 640px; overflow-y: auto; }
        #rwi-body::-webkit-scrollbar { width: 6px; }
        #rwi-body::-webkit-scrollbar-track { background: #18181b; }
        #rwi-body::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }
        .rwi-view { display: none; flex-direction: column; gap: 10px; }
        .rwi-view.active { display: flex; }
        .rwi-stat { display: flex; justify-content: space-between; align-items: center; font-size: 13px; background: #2e1065; padding: 8px 12px; border-radius: 8px; border: 1px solid #4c1d95; }
        .rwi-stat span:first-child { color: #d8b4fe; }
        .rwi-stat span:last-child { color: #f3e8ff; font-weight: 700; font-size: 14px; }
        .rwi-divider { border: 0; height: 1px; background: #3f3f46; margin: 4px 0; }
        .rwi-action-btn { background: #7c3aed; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 0 rgba(139, 92, 246, 0); width: 100%; }
        .rwi-action-btn:hover:not(:disabled) { background: #8b5cf6; box-shadow: 0 0 15px rgba(139, 92, 246, 0.6), 0 0 25px rgba(139, 92, 246, 0.4); transform: translateY(-1px); }
        .rwi-action-btn:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 0 5px rgba(139, 92, 246, 0.4); }
        .rwi-action-btn:disabled { background: #27272a; color: #52525b; cursor: not-allowed; transform: none; border: 1px solid #3f3f46; box-shadow: none; }
        .rwi-action-btn.rwi-secondary { background: #27272a; border: 1px solid #3f3f46; color: #e4e4e7; }
        .rwi-action-btn.rwi-secondary:hover:not(:disabled) { background: #3f3f46; box-shadow: none; transform: none; }
        .rwi-action-btn.rwi-toggle-on { background: #059669; }
        .rwi-action-btn.rwi-toggle-on:hover:not(:disabled) { background: #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.5); }
        .rwi-btn-row { display: flex; gap: 8px; }
        .rwi-btn-row .rwi-action-btn { flex: 1; }
        .rwi-control { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #a1a1aa; }
        .rwi-control-row { display: flex; justify-content: space-between; align-items: center; }
        .rwi-input { background: #27272a; border: 1px solid #3f3f46; color: #e4e4e7; padding: 10px; border-radius: 6px; outline: none; transition: border-color 0.2s ease; width: 100%; box-sizing: border-box; font-family: inherit; }
        .rwi-input:focus { border-color: #7c3aed; }
        .rwi-textarea { background: #0f0f11; border: 1px solid #3f3f46; color: #d4d4d8; padding: 10px; border-radius: 6px; outline: none; width: 100%; box-sizing: border-box; resize: none; height: 120px; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; line-height: 1.5; }
        .rwi-textarea:focus { border-color: #7c3aed; }
        .rwi-textarea::-webkit-scrollbar { width: 8px; }
        .rwi-textarea::-webkit-scrollbar-track { background: #18181b; border-radius: 4px; }
        .rwi-textarea::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 4px; }
        .rwi-select { background: #27272a; border: 1px solid #3f3f46; color: #e4e4e7; padding: 10px; border-radius: 6px; outline: none; width: 100%; cursor: pointer; font-family: inherit; }
        .rwi-select:focus { border-color: #7c3aed; }
        #rwi-notification { position: absolute; top: 0; left: 0; right: 0; background: rgba(124, 58, 237, 0.95); color: white; padding: 12px; text-align: center; font-size: 13px; font-weight: bold; transform: translateY(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        #rwi-notification.rwi-show { transform: translateY(0); }
        .rwi-hidden { display: none !important; }
        .rwi-checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #a1a1aa; }
        .rwi-checkbox { width: 16px; height: 16px; accent-color: #7c3aed; cursor: pointer; }
        .rwi-checkbox-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .rwi-results { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; background: #0f0f11; border: 1px solid #3f3f46; border-radius: 8px; padding: 6px; }
        .rwi-results::-webkit-scrollbar { width: 6px; }
        .rwi-results::-webkit-scrollbar-track { background: #0f0f11; }
        .rwi-results::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }
        .rwi-result-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: 'Consolas', 'Courier New', monospace; color: #d4d4d8; }
        .rwi-result-row:hover { background: rgba(124, 58, 237, 0.2); }
        .rwi-result-tag { color: #c4b5fd; }
        .rwi-result-meta { color: #71717a; flex-shrink: 0; }
        .rwi-empty-msg { color: #52525b; font-size: 12px; text-align: center; padding: 14px; }
        .rwi-breadcrumbs { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 12px; }
        .rwi-crumb { background: #27272a; border: 1px solid #3f3f46; color: #c4b5fd; padding: 4px 8px; border-radius: 6px; cursor: pointer; }
        .rwi-crumb:hover { background: #3f3f46; }
        .rwi-crumb-sep { color: #52525b; }
        .rwi-section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #a78bfa; font-weight: 700; margin-top: 4px; }
        .rwi-slot-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .rwi-slot { background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; padding: 8px 0; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 13px; text-align: center; }
        .rwi-slot:hover { border-color: #7c3aed; color: #e4e4e7; }
        .rwi-slot.rwi-filled { color: #c4b5fd; border-color: #7c3aed; background: rgba(124, 58, 237, 0.15); }
        .rwi-log { display: flex; flex-direction: column-reverse; gap: 3px; max-height: 160px; overflow-y: auto; background: #0f0f11; border: 1px solid #3f3f46; border-radius: 8px; padding: 6px; font-family: 'Consolas', 'Courier New', monospace; font-size: 11px; color: #a1a1aa; }
        #rwi-hover-box { position: fixed; pointer-events: none; z-index: 2147483646; border: 2px solid #f59e0b; background: rgba(245, 158, 11, 0.12); border-radius: 2px; display: none; }
        #rwi-hover-label { position: fixed; pointer-events: auto; cursor: pointer; z-index: 2147483646; background: #18181b; color: #fde68a; border: 1px solid #f59e0b; padding: 3px 6px; border-radius: 4px; font-size: 11px; font-family: 'Consolas', 'Courier New', monospace; display: none; white-space: nowrap; }
        #rwi-hover-label:hover { background: #292524; border-color: #fbbf24; }
        .rwi-select-box { position: fixed; pointer-events: none; z-index: 2147483645; border: 2px solid #22d3ee; border-radius: 2px; }
        .rwi-mutation-flash { outline: 2px solid #22c55e !important; outline-offset: -2px; }
        .rwi-revealed { outline: 2px dashed #ef4444 !important; outline-offset: 2px; }
        .rwi-all-box { position: fixed; pointer-events: none; z-index: 2147483643; border: 1px solid rgba(34, 211, 238, 0.8); background: rgba(34, 211, 238, 0.06); border-radius: 1px; }
        .rwi-all-label { position: fixed; pointer-events: none; z-index: 2147483643; background: rgba(24, 24, 27, 0.9); color: #a5f3fc; border: 1px solid rgba(34, 211, 238, 0.6); padding: 1px 4px; border-radius: 3px; font-size: 9px; font-family: 'Consolas', 'Courier New', monospace; white-space: nowrap; }
        .rwi-ui-logo { width: 22px; height: 22px; object-fit: cover; border-radius: 5px; flex: 0 0 22px; }
        .rwi-code-viewer { display: flex; flex-direction: column; max-height: 320px; overflow: auto; background: #0f0f11; border: 1px solid #3f3f46; border-radius: 8px; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; line-height: 1.6; }
        .rwi-code-viewer::-webkit-scrollbar { width: 6px; height: 6px; }
        .rwi-code-viewer::-webkit-scrollbar-track { background: #0f0f11; }
        .rwi-code-viewer::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }
        .rwi-code-line { display: flex; white-space: pre; }
        .rwi-code-ln { flex: 0 0 46px; text-align: right; padding: 0 8px; color: #52525b; user-select: none; border-right: 1px solid #27272a; background: #0f0f11; position: sticky; left: 0; }
        .rwi-code-content { padding: 0 10px; color: #d4d4d8; white-space: pre-wrap; word-break: break-all; }
        .rwi-code-match { background: rgba(245, 158, 11, 0.45); color: #fff7ed; border-radius: 2px; }
        .rwi-code-match-active { background: rgba(34, 211, 238, 0.55); color: #06202a; border-radius: 2px; }
        @keyframes rwi-fade-in { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes rwi-shine { 0% { left: -100%; } 100% { left: 200%; } }
        .rwi-modern-btn { position: relative; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); }
        .rwi-modern-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        .rwi-modern-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: rwi-shine 3s infinite; }
        #rwi-custom-tab-container { position: relative; z-index: 1; width: calc(100% - 32px); height: 40px; margin: 2px 16px 4px 16px; padding: 7px 10px; border-radius: 4px; cursor: pointer; color: #949ba4; font-weight: 600; font-size: 14px; transition: background 0.2s; background-color: transparent; display: flex; align-items: center; box-sizing: border-box; list-style: none; overflow: hidden; flex-shrink: 0; }
        #rwi-custom-tab-container:hover { background-color: rgba(255,255,255,0.08); color: #dbdee1; }
        #rwi-custom-tab-container img { width: 22px; height: 22px; object-fit: cover; border-radius: 5px; flex: 0 0 22px; margin-right: 8px; }
        #rwi-custom-tab-container span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        #rwi-custom-page { box-sizing: border-box; }
        #rwi-custom-page > div { box-sizing: border-box; }
        @media (max-width: 800px) {
            #rwi-custom-page { left: 212px !important; padding: 24px !important; }
            #rwi-custom-page > div { max-width: 520px !important; padding: 32px !important; }
        }
    `;
    document.head.appendChild(style);

    const ui = document.createElement('div');
    ui.id = 'rwi-ui';
    ui.innerHTML = `
        <div id="rwi-notification"></div>
        <div id="rwi-header">
            <span class="rwi-title-container">
                <img class="rwi-ui-logo" src="https://i.imgur.com/uEKCG7B.gif" alt="">
                <span class="rwi-brand">Rickware - Labs&#169;</span>
                <span class="rwi-highlight">Discord Inspector V3</span>
            </span>
            <div class="rwi-actions">
                <button id="rwi-pick-quick" class="rwi-btn-icon" title="Toggle Pick Mode">&#9678;</button>
                <button id="rwi-minimize" class="rwi-btn-icon">&#8722;</button>
                <button id="rwi-close" class="rwi-btn-icon">&#215;</button>
            </div>
        </div>
        <div id="rwi-tabs">
            <button class="rwi-tab active" data-target="rwi-search">Search</button>
            <button class="rwi-tab" data-target="rwi-hidden">Hidden</button>
            <button class="rwi-tab" data-target="rwi-react">React</button>
            <button class="rwi-tab" data-target="rwi-webpack">Webpack</button>
            <button class="rwi-tab" data-target="rwi-overlay">Overlay</button>
            <button class="rwi-tab" data-target="rwi-inspector">Inspector</button>
            <button class="rwi-tab" data-target="rwi-code">Code</button>
            <button class="rwi-tab" data-target="rwi-settings">Settings</button>
        </div>
        <div id="rwi-body">

            <div id="rwi-search" class="rwi-view active">
                <select id="rwi-search-mode" class="rwi-select">
                    <option value="class">Class Name</option>
                    <option value="id">Element ID</option>
                    <option value="tag">Tag Name</option>
                    <option value="attr">Attribute</option>
                    <option value="text">Text Content</option>
                    <option value="css">CSS Selector</option>
                </select>
                <div id="rwi-search-attr-wrap" class="rwi-control rwi-hidden">
                    <span>Attribute Name</span>
                    <input id="rwi-search-attr" class="rwi-input" type="text" placeholder="data-testid">
                </div>
                <div class="rwi-control">
                    <span>Query</span>
                    <input id="rwi-search-query" class="rwi-input" type="text" placeholder="Enter search value, comma-separated for multiple">
                </div>
                <div class="rwi-checkbox-grid">
                    <label class="rwi-checkbox-row"><input id="rwi-search-exact" type="checkbox" class="rwi-checkbox"><span>Exact Match</span></label>
                    <label class="rwi-checkbox-row"><input id="rwi-search-regex" type="checkbox" class="rwi-checkbox"><span>Regex</span></label>
                    <label class="rwi-checkbox-row"><input id="rwi-search-case" type="checkbox" class="rwi-checkbox"><span>Case Sensitive</span></label>
                    <label class="rwi-checkbox-row"><input id="rwi-search-leaf" type="checkbox" class="rwi-checkbox" checked><span>Leaf Nodes Only</span></label>
                </div>
                <button id="rwi-search-run" class="rwi-action-btn">Search</button>
                <div class="rwi-stat"><span>Matches Found</span><span id="rwi-search-count">0</span></div>
                <div class="rwi-btn-row">
                    <button id="rwi-search-highlight-all" class="rwi-action-btn rwi-secondary">Highlight All</button>
                    <button id="rwi-search-clear" class="rwi-action-btn rwi-secondary">Clear</button>
                </div>
                <div id="rwi-search-results" class="rwi-results"><div class="rwi-empty-msg">No search run yet</div></div>
            </div>

            <div id="rwi-hidden" class="rwi-view">
                <div class="rwi-checkbox-grid">
                    <label class="rwi-checkbox-row"><input id="rwi-hidden-display" type="checkbox" class="rwi-checkbox" checked><span>display: none</span></label>
                    <label class="rwi-checkbox-row"><input id="rwi-hidden-visibility" type="checkbox" class="rwi-checkbox" checked><span>visibility: hidden</span></label>
                    <label class="rwi-checkbox-row"><input id="rwi-hidden-opacity" type="checkbox" class="rwi-checkbox" checked><span>opacity: 0</span></label>
                    <label class="rwi-checkbox-row"><input id="rwi-hidden-offscreen" type="checkbox" class="rwi-checkbox"><span>Off-Screen</span></label>
                    <label class="rwi-checkbox-row"><input id="rwi-hidden-zerosize" type="checkbox" class="rwi-checkbox"><span>Zero Size</span></label>
                </div>
                <button id="rwi-hidden-scan" class="rwi-action-btn">Scan Page</button>
                <div class="rwi-stat"><span>Hidden Elements Found</span><span id="rwi-hidden-count">0</span></div>
                <div class="rwi-btn-row">
                    <button id="rwi-hidden-reveal" class="rwi-action-btn rwi-secondary">Reveal Mode: Off</button>
                    <button id="rwi-hidden-restore" class="rwi-action-btn rwi-secondary">Restore All</button>
                </div>
                <div id="rwi-hidden-results" class="rwi-results"><div class="rwi-empty-msg">No scan run yet</div></div>
            </div>

            <div id="rwi-react" class="rwi-view">
                <div class="rwi-stat"><span>Selected Element</span><span id="rwi-react-selected">None</span></div>
                <div id="rwi-react-no-fiber" class="rwi-empty-msg">Select an element to inspect its React internals</div>
                <div id="rwi-react-content" class="rwi-hidden" style="display:flex;flex-direction:column;gap:10px;">
                    <div class="rwi-stat"><span>Component</span><span id="rwi-react-name">-</span></div>
                    <div class="rwi-stat"><span>Fiber Depth</span><span id="rwi-react-depth">-</span></div>
                    <div class="rwi-section-title">Ancestor Tree</div>
                    <div id="rwi-react-breadcrumbs" class="rwi-breadcrumbs"></div>
                    <div class="rwi-btn-row">
                        <button id="rwi-react-up" class="rwi-action-btn rwi-secondary">Walk Up</button>
                        <button id="rwi-react-down" class="rwi-action-btn rwi-secondary">Walk Down</button>
                    </div>
                    <div class="rwi-section-title">Props</div>
                    <textarea id="rwi-react-props" class="rwi-textarea" readonly></textarea>
                    <div class="rwi-section-title">State / Hooks</div>
                    <textarea id="rwi-react-state" class="rwi-textarea" readonly></textarea>
                    <button id="rwi-react-find-instances" class="rwi-action-btn">Find All Instances Of This Component</button>
                    <div id="rwi-react-instances" class="rwi-results rwi-hidden"></div>
                </div>
            </div>

            <div id="rwi-webpack" class="rwi-view">
                <select id="rwi-webpack-mode" class="rwi-select">
                    <option value="prop">Exported Property Name</option>
                    <option value="source">Source Code Text</option>
                </select>
                <div class="rwi-control">
                    <span>Query</span>
                    <input id="rwi-webpack-query" class="rwi-input" type="text" placeholder="Enter property name or code text">
                </div>
                <div class="rwi-btn-row">
                    <button id="rwi-webpack-run" class="rwi-action-btn">Search Modules</button>
                    <button id="rwi-webpack-flux" class="rwi-action-btn rwi-secondary">Find Flux Stores</button>
                </div>
                <div class="rwi-stat"><span>Webpack Status</span><span id="rwi-webpack-status">Not Connected</span></div>
                <div class="rwi-stat"><span>Matches Found</span><span id="rwi-webpack-count">0</span></div>
                <div id="rwi-webpack-results" class="rwi-results"><div class="rwi-empty-msg">No search run yet</div></div>
                <div class="rwi-section-title">Module Preview</div>
                <textarea id="rwi-webpack-preview" class="rwi-textarea" readonly></textarea>
                <button id="rwi-webpack-copy" class="rwi-action-btn rwi-secondary">Copy Preview</button>
            </div>

            <div id="rwi-overlay" class="rwi-view">
                <div class="rwi-btn-row">
                    <button id="rwi-overlay-hover" class="rwi-action-btn rwi-secondary">Hover Highlight: Off</button>
                    <button id="rwi-overlay-pick" class="rwi-action-btn rwi-secondary">Pick Mode: Off</button>
                </div>
                <button id="rwi-overlay-watch" class="rwi-action-btn rwi-secondary">Live DOM Watch: Off</button>
                <button id="rwi-overlay-allboxes" class="rwi-action-btn rwi-secondary">Show All Hitboxes: Off</button>
                <div class="rwi-stat"><span>Mutations Logged</span><span id="rwi-overlay-mutcount">0</span></div>
                <div class="rwi-section-title">Mutation Log</div>
                <div id="rwi-overlay-log" class="rwi-log"><div class="rwi-empty-msg">No mutations logged yet</div></div>
                <button id="rwi-overlay-clear-log" class="rwi-action-btn rwi-secondary">Clear Log</button>
            </div>

            <div id="rwi-inspector" class="rwi-view">
                <div class="rwi-section-title">History Slots</div>
                <div id="rwi-slot-grid" class="rwi-slot-grid"></div>
                <hr class="rwi-divider">
                <div class="rwi-stat"><span>Tag</span><span id="rwi-insp-tag">-</span></div>
                <div class="rwi-stat"><span>ID</span><span id="rwi-insp-id">-</span></div>
                <div class="rwi-stat"><span>Classes</span><span id="rwi-insp-classes">-</span></div>
                <div class="rwi-stat"><span>Size</span><span id="rwi-insp-size">-</span></div>
                <div class="rwi-btn-row">
                    <button id="rwi-insp-copy-html" class="rwi-action-btn rwi-secondary">Copy outerHTML</button>
                    <button id="rwi-insp-copy-json" class="rwi-action-btn rwi-secondary">Copy as JSON</button>
                </div>
                <div class="rwi-btn-row">
                    <button id="rwi-insp-copy-selector" class="rwi-action-btn rwi-secondary">Copy CSS Selector</button>
                    <button id="rwi-insp-copy-xpath" class="rwi-action-btn rwi-secondary">Copy XPath</button>
                </div>
                <div class="rwi-btn-row">
                    <button id="rwi-insp-scroll" class="rwi-action-btn rwi-secondary">Scroll Into View</button>
                    <button id="rwi-insp-log" class="rwi-action-btn rwi-secondary">Log To Console</button>
                </div>
            </div>

            <div id="rwi-code" class="rwi-view">
                <select id="rwi-code-resource" class="rwi-select">
                    <option value="html">HTML</option>
                    <option value="js">JavaScript</option>
                    <option value="css">CSS</option>
                    <option value="images">Images</option>
                    <option value="links">Links</option>
                    <option value="requests">Background Requests</option>
                </select>
                <button id="rwi-code-scan" class="rwi-action-btn">Scan Page</button>
                <div class="rwi-stat"><span>Scan Status</span><span id="rwi-code-status">Not Scanned</span></div>
                <div class="rwi-stat"><span>Lines</span><span id="rwi-code-linecount">0</span></div>
                <div class="rwi-control">
                    <span>Search In Code (Classes, IDs, Text, Anything)</span>
                    <input id="rwi-code-search" class="rwi-input" type="text" placeholder="Type to search the scanned code">
                </div>
                <div class="rwi-btn-row">
                    <button id="rwi-code-search-prev" class="rwi-action-btn rwi-secondary">Previous Match</button>
                    <button id="rwi-code-search-next" class="rwi-action-btn rwi-secondary">Next Match</button>
                </div>
                <div class="rwi-stat"><span>Matches Found</span><span id="rwi-code-search-count">0</span></div>
                <div id="rwi-code-viewer" class="rwi-code-viewer"><div class="rwi-empty-msg">Click Scan Page to load code</div></div>
            </div>

            <div id="rwi-settings" class="rwi-view">
                <label class="rwi-checkbox-row"><input id="rwi-settings-rightclick" type="checkbox" class="rwi-checkbox" checked><span>Enable Right-Click DevTools Inspect</span></label>
                <label class="rwi-checkbox-row"><input id="rwi-settings-dehash" type="checkbox" class="rwi-checkbox" checked><span>Auto De-hash Names (Best Effort)</span></label>
                <div class="rwi-stat"><span>Pick Mode Hotkey</span><span>Alt + Shift + I</span></div>
                <div class="rwi-stat"><span>Toggle Panel Hotkey</span><span>Alt + Shift + O</span></div>
                <button id="rwi-settings-reset" class="rwi-action-btn rwi-secondary">Reset Tool State</button>
                <hr class="rwi-divider">
                <div class="rwi-stat"><span>Version</span><span>V3</span></div>
            </div>

        </div>
    `;
    document.body.appendChild(ui);

    const hoverBox = document.createElement('div');
    hoverBox.id = 'rwi-hover-box';
    document.body.appendChild(hoverBox);

    const hoverLabel = document.createElement('div');
    hoverLabel.id = 'rwi-hover-label';
    document.body.appendChild(hoverLabel);

    const selectBox = document.createElement('div');
    selectBox.className = 'rwi-select-box';
    selectBox.style.display = 'none';
    document.body.appendChild(selectBox);

    const allBoxesContainer = document.createElement('div');
    allBoxesContainer.id = 'rwi-allboxes-container';
    allBoxesContainer.style.position = 'fixed';
    allBoxesContainer.style.top = '0';
    allBoxesContainer.style.left = '0';
    allBoxesContainer.style.width = '0';
    allBoxesContainer.style.height = '0';
    allBoxesContainer.style.pointerEvents = 'none';
    document.body.appendChild(allBoxesContainer);

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function(ch) {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
            return map[ch];
        });
    }

    function deObfuscateName(name) {
        if (!name || typeof name !== 'string') return name;
        let result = name;
        result = result.replace(/([A-Za-z][A-Za-z0-9]*?)[-_][a-f0-9]{5,10}(?![a-z0-9])/gi, '$1');
        result = result.replace(/([A-Za-z][A-Za-z0-9]*?)__[A-Za-z0-9]+___[a-zA-Z0-9]{5,10}/g, '$1');
        return result;
    }

    function displayName(name) {
        return state.autoDehash ? deObfuscateName(name) : name;
    }

    function showNotification(message) {
        const notif = document.getElementById('rwi-notification');
        notif.textContent = message;
        notif.classList.add('rwi-show');
        clearTimeout(state.notifTimeout);
        state.notifTimeout = setTimeout(function() {
            notif.classList.remove('rwi-show');
        }, 2200);
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showNotification('Copied to clipboard');
            }).catch(function() {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showNotification('Copied to clipboard');
        } catch (err) {
            showNotification('Copy failed');
        }
        ta.remove();
    }

    function safeStringify(value, maxDepth) {
        const seen = new WeakSet();
        function serialize(v, depth) {
            if (depth > maxDepth) return '...';
            if (v === null) return null;
            if (typeof v === 'undefined') return undefined;
            if (typeof v === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
            if (typeof v === 'symbol') return v.toString();
            if (typeof Node !== 'undefined' && v instanceof Node) return '[DOM Node <' + v.nodeName.toLowerCase() + '>]';
            if (typeof v !== 'object') return v;
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
            if (Array.isArray(v)) {
                return v.slice(0, 50).map(function(item) { return serialize(item, depth + 1); });
            }
            const out = {};
            let count = 0;
            for (const key in v) {
                if (count >= 60) { out['...'] = 'truncated'; break; }
                try {
                    out[key] = serialize(v[key], depth + 1);
                } catch (err) {
                    out[key] = '[Unreadable]';
                }
                count++;
            }
            return out;
        }
        try {
            const result = JSON.stringify(serialize(value, 0), null, 2);
            return typeof result === 'string' ? result : 'null';
        } catch (err) {
            return String(value);
        }
    }

    function getReactFiber(el) {
        if (!el) return null;
        const key = Object.keys(el).find(function(k) {
            return k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$');
        });
        return key ? el[key] : null;
    }

    function getFiberProps(fiber) {
        if (!fiber) return null;
        return fiber.memoizedProps || fiber.pendingProps || null;
    }

    function isComponentFiber(fiber) {
        if (!fiber) return false;
        return typeof fiber.type === 'function' || (typeof fiber.type === 'object' && fiber.type !== null);
    }

    function getComponentName(fiber) {
        if (!fiber || !fiber.type) return 'Unknown';
        const t = fiber.type;
        if (typeof t === 'string') return t;
        if (typeof t === 'function') return t.displayName || t.name || 'Anonymous';
        if (typeof t === 'object') {
            if (t.displayName) return t.displayName;
            if (t.render) return t.render.displayName || t.render.name || 'ForwardRef';
            if (t.type) return getComponentName({ type: t.type });
        }
        return 'Unknown';
    }

    function collectAncestorComponents(fiber) {
        const result = [];
        let current = fiber;
        while (current) {
            if (isComponentFiber(current)) {
                result.push({ name: getComponentName(current), fiber: current });
            }
            current = current.return;
        }
        return result;
    }

    function getFiberDepth(fiber) {
        let depth = 0;
        let current = fiber;
        while (current && current.return) {
            depth++;
            current = current.return;
        }
        return depth;
    }

    function summarizeHooks(fiber) {
        if (!fiber || !fiber.memoizedState) return null;
        const hooks = [];
        let hook = fiber.memoizedState;
        let index = 0;
        while (hook && index < 25) {
            let value = hook.memoizedState;
            try {
                if (typeof value === 'function') {
                    value = '[Function]';
                }
            } catch (err) {}
            hooks.push({ hookIndex: index, value: value });
            hook = hook.next;
            index++;
        }
        return hooks;
    }

    function getStateSummary(fiber) {
        if (!fiber) return null;
        const isClass = typeof fiber.type === 'function' && fiber.type.prototype && fiber.type.prototype.isReactComponent;
        if (isClass) return fiber.memoizedState;
        return summarizeHooks(fiber);
    }

    function generateSelector(el) {
        if (!(el instanceof Element)) return '';
        if (el.id) return '#' + CSS.escape(el.id);
        const parts = [];
        let node = el;
        while (node && node.nodeType === 1 && node !== document.body) {
            let selector = node.nodeName.toLowerCase();
            if (node.id) {
                selector = '#' + CSS.escape(node.id);
                parts.unshift(selector);
                break;
            } else {
                let sibling = node;
                let index = 1;
                while (sibling.previousElementSibling) {
                    sibling = sibling.previousElementSibling;
                    if (sibling.nodeName === node.nodeName) index++;
                }
                selector += ':nth-of-type(' + index + ')';
            }
            parts.unshift(selector);
            node = node.parentElement;
        }
        return parts.join(' > ');
    }

    function generateXPath(el) {
        if (!(el instanceof Element)) return '';
        if (el.id) return '//*[@id="' + el.id + '"]';
        const parts = [];
        let node = el;
        while (node && node.nodeType === 1) {
            let index = 1;
            let sibling = node.previousElementSibling;
            while (sibling) {
                if (sibling.nodeName === node.nodeName) index++;
                sibling = sibling.previousElementSibling;
            }
            parts.unshift(node.nodeName.toLowerCase() + '[' + index + ']');
            node = node.parentElement;
        }
        return '/' + parts.join('/');
    }

    function matchText(source, query, opts) {
        if (!query) return true;
        if (opts.regex) {
            try {
                const re = new RegExp(query, opts.case ? '' : 'i');
                return re.test(source);
            } catch (err) {
                return false;
            }
        }
        let s = source;
        let q = query;
        if (!opts.case) {
            s = s.toLowerCase();
            q = q.toLowerCase();
        }
        return opts.exact ? s === q : s.includes(q);
    }

    function getAllInspectable() {
        return Array.from(document.querySelectorAll('*')).filter(function(el) { return !ui.contains(el); });
    }

    function runElementSearch(mode, query, opts) {
        const all = getAllInspectable();
        let matches = [];
        if (mode === 'class') {
            matches = all.filter(function(el) {
                if (!el.className || typeof el.className !== 'string') return false;
                if (opts.exact) return el.classList.contains(query);
                return matchText(el.className, query, opts);
            });
        } else if (mode === 'id') {
            matches = all.filter(function(el) { return el.id && matchText(el.id, query, opts); });
        } else if (mode === 'tag') {
            matches = all.filter(function(el) { return el.nodeName.toLowerCase() === query.toLowerCase(); });
        } else if (mode === 'attr') {
            matches = all.filter(function(el) {
                const attrName = opts.attrName || query;
                if (!attrName) return false;
                if (!el.hasAttribute(attrName)) return false;
                if (opts.attrName && query) return matchText(el.getAttribute(attrName) || '', query, opts);
                return true;
            });
        } else if (mode === 'text') {
            matches = all.filter(function(el) {
                if (opts.leaf && el.children.length > 0) return false;
                const text = el.textContent;
                return text && matchText(text.trim(), query, opts);
            });
        } else if (mode === 'css') {
            try {
                matches = Array.from(document.querySelectorAll(query)).filter(function(el) { return !ui.contains(el); });
            } catch (err) {
                matches = [];
            }
        }
        return matches;
    }

    function runHiddenScan(opts) {
        const all = getAllInspectable();
        const matches = [];
        for (const el of all) {
            const cs = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const reasons = [];
            if (opts.display && cs.display === 'none') reasons.push('display:none');
            if (opts.visibility && cs.visibility === 'hidden') reasons.push('visibility:hidden');
            if (opts.opacity && parseFloat(cs.opacity) === 0) reasons.push('opacity:0');
            if (opts.offscreen && (rect.bottom < 0 || rect.right < 0 || rect.top > window.innerHeight || rect.left > window.innerWidth) && (rect.width > 0 || rect.height > 0)) reasons.push('off-screen');
            if (opts.zerosize && rect.width === 0 && rect.height === 0 && cs.display !== 'none') reasons.push('zero-size');
            if (reasons.length > 0) matches.push({ el: el, reasons: reasons });
        }
        return matches;
    }

    function revealElement(el) {
        if (revealedStore.has(el)) return;
        revealedStore.set(el, el.getAttribute('style'));
        el.style.setProperty('display', 'block', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.classList.add('rwi-revealed');
    }

    function restoreAllRevealed() {
        revealedStore.forEach(function(originalStyle, el) {
            if (originalStyle === null) el.removeAttribute('style');
            else el.setAttribute('style', originalStyle);
            el.classList.remove('rwi-revealed');
        });
        revealedStore.clear();
    }

    function connectWebpack() {
        if (state.webpackRequire) return state.webpackRequire;
        const chunkKey = Object.keys(window).find(function(k) { return k.startsWith('webpackChunk'); });
        if (!chunkKey) return null;
        try {
            const chunk = window[chunkKey];
            let req;
            chunk.push([[Symbol('rwi')], {}, function(r) { req = r; }]);
            if (req) {
                state.webpackRequire = req;
                return req;
            }
        } catch (err) {}
        return null;
    }

    function searchWebpackByProperty(query, exact) {
        const req = connectWebpack();
        if (!req || !req.c) return [];
        const results = [];
        const cache = req.c;
        for (const id in cache) {
            const mod = cache[id];
            if (!mod || !mod.exports) continue;
            const exp = mod.exports;
            try {
                const keys = Object.keys(exp);
                for (const key of keys) {
                    if (exact ? key === query : key.toLowerCase().includes(query.toLowerCase())) {
                        results.push({ id: id, path: key, exports: exp });
                    }
                }
                if (exp.default && typeof exp.default === 'object') {
                    const dkeys = Object.keys(exp.default);
                    for (const key of dkeys) {
                        if (exact ? key === query : key.toLowerCase().includes(query.toLowerCase())) {
                            results.push({ id: id, path: 'default.' + key, exports: exp.default });
                        }
                    }
                }
            } catch (err) {}
        }
        return results;
    }

    function searchWebpackBySource(query) {
        const req = connectWebpack();
        if (!req || !req.m) return [];
        const results = [];
        const modules = req.m;
        for (const id in modules) {
            try {
                const src = modules[id].toString();
                if (src.includes(query)) {
                    results.push({ id: id, path: 'factory source', preview: src.slice(0, 600) });
                }
            } catch (err) {}
        }
        return results;
    }

    function findFluxStores() {
        const req = connectWebpack();
        if (!req || !req.c) return [];
        const results = [];
        const cache = req.c;
        for (const id in cache) {
            const mod = cache[id];
            if (!mod || !mod.exports) continue;
            const exp = mod.exports;
            try {
                const candidates = [exp, exp.default].filter(Boolean);
                for (const cand of candidates) {
                    if (cand && typeof cand.getName === 'function' && typeof cand.addChangeListener === 'function') {
                        let name = 'Unknown';
                        try { name = cand.getName(); } catch (err) {}
                        results.push({ id: id, path: name, exports: cand });
                    }
                }
            } catch (err) {}
        }
        return results;
    }

    function renderResultList(containerId, elements, reasonsMap) {
        const container = document.getElementById(containerId);
        if (!elements.length) {
            container.innerHTML = '<div class="rwi-empty-msg">No matches found</div>';
            return;
        }
        container.innerHTML = '';
        elements.slice(0, 300).forEach(function(el) {
            const row = document.createElement('div');
            row.className = 'rwi-result-row';
            const idPart = el.id ? '#' + displayName(el.id) : '';
            const classPart = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(displayName).join('.') : '';
            const tagSpan = document.createElement('span');
            tagSpan.className = 'rwi-result-tag';
            tagSpan.textContent = el.nodeName.toLowerCase() + idPart + classPart;
            const metaSpan = document.createElement('span');
            metaSpan.className = 'rwi-result-meta';
            metaSpan.textContent = reasonsMap && reasonsMap.has(el) ? reasonsMap.get(el).join(', ') : '';
            row.appendChild(tagSpan);
            row.appendChild(metaSpan);
            row.addEventListener('click', function() {
                selectElement(el);
                try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) {}
            });
            container.appendChild(row);
        });
        if (elements.length > 300) {
            const note = document.createElement('div');
            note.className = 'rwi-empty-msg';
            note.textContent = (elements.length - 300) + ' more not shown';
            container.appendChild(note);
        }
    }

    function renderWebpackResults(results) {
        const container = document.getElementById('rwi-webpack-results');
        if (!results.length) {
            container.innerHTML = '<div class="rwi-empty-msg">No matches found</div>';
            return;
        }
        container.innerHTML = '';
        results.slice(0, 200).forEach(function(r) {
            const row = document.createElement('div');
            row.className = 'rwi-result-row';
            const tagSpan = document.createElement('span');
            tagSpan.className = 'rwi-result-tag';
            tagSpan.textContent = 'Module ' + r.id;
            const metaSpan = document.createElement('span');
            metaSpan.className = 'rwi-result-meta';
            metaSpan.textContent = r.path;
            row.appendChild(tagSpan);
            row.appendChild(metaSpan);
            row.addEventListener('click', function() {
                const preview = document.getElementById('rwi-webpack-preview');
                if (r.exports) preview.value = safeStringify(r.exports, 3);
                else if (r.preview) preview.value = r.preview;
            });
            container.appendChild(row);
        });
    }

    function renderSlots() {
        const grid = document.getElementById('rwi-slot-grid');
        grid.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const btn = document.createElement('button');
            btn.className = 'rwi-slot' + (state.history[i] ? ' rwi-filled' : '');
            btn.textContent = '$' + i;
            btn.title = state.history[i] ? state.history[i].nodeName.toLowerCase() : 'Empty';
            if (state.history[i]) {
                btn.addEventListener('click', (function(el) { return function() { selectElement(el); }; })(state.history[i]));
            }
            grid.appendChild(btn);
        }
    }

    function renderInspectorPanel() {
        const el = state.selected;
        document.getElementById('rwi-insp-tag').textContent = el ? el.nodeName.toLowerCase() : '-';
        document.getElementById('rwi-insp-id').textContent = el && el.id ? displayName(el.id) : '-';
        document.getElementById('rwi-insp-classes').textContent = el && el.className ? displayName(String(el.className)) : '-';
        if (el) {
            const rect = el.getBoundingClientRect();
            document.getElementById('rwi-insp-size').textContent = Math.round(rect.width) + ' x ' + Math.round(rect.height);
        } else {
            document.getElementById('rwi-insp-size').textContent = '-';
        }
    }

    function renderFiberDetails(fiber) {
        document.getElementById('rwi-react-name').textContent = getComponentName(fiber);
        document.getElementById('rwi-react-depth').textContent = getFiberDepth(fiber);
        const propsVal = getFiberProps(fiber);
        document.getElementById('rwi-react-props').value = propsVal ? safeStringify(propsVal, 4) : 'No props found';
        const stateVal = getStateSummary(fiber);
        document.getElementById('rwi-react-state').value = stateVal ? safeStringify(stateVal, 4) : 'No state found';
        const ancestors = collectAncestorComponents(fiber);
        const crumbContainer = document.getElementById('rwi-react-breadcrumbs');
        crumbContainer.innerHTML = '';
        ancestors.slice(0, 12).reverse().forEach(function(entry, idx, arr) {
            const chip = document.createElement('span');
            chip.className = 'rwi-crumb';
            chip.textContent = entry.name;
            chip.addEventListener('click', function() {
                state.currentFiber = entry.fiber;
                renderFiberDetails(entry.fiber);
            });
            crumbContainer.appendChild(chip);
            if (idx < arr.length - 1) {
                const sep = document.createElement('span');
                sep.className = 'rwi-crumb-sep';
                sep.textContent = '>';
                crumbContainer.appendChild(sep);
            }
        });
    }

    function renderReactPanel() {
        const el = state.selected;
        document.getElementById('rwi-react-selected').textContent = el ? el.nodeName.toLowerCase() + (el.id ? '#' + el.id : '') : 'None';
        const noFiberMsg = document.getElementById('rwi-react-no-fiber');
        const content = document.getElementById('rwi-react-content');
        if (!el) {
            noFiberMsg.textContent = 'Select an element to inspect its React internals';
            noFiberMsg.classList.remove('rwi-hidden');
            content.classList.add('rwi-hidden');
            return;
        }
        const hostFiber = getReactFiber(el);
        if (!hostFiber) {
            noFiberMsg.textContent = 'No React fiber found on this element';
            noFiberMsg.classList.remove('rwi-hidden');
            content.classList.add('rwi-hidden');
            return;
        }
        noFiberMsg.classList.add('rwi-hidden');
        content.classList.remove('rwi-hidden');
        let componentFiber = hostFiber;
        if (!isComponentFiber(componentFiber)) {
            let cursor = componentFiber.return;
            while (cursor && !isComponentFiber(cursor)) cursor = cursor.return;
            if (cursor) componentFiber = cursor;
        }
        state.currentFiber = componentFiber;
        renderFiberDetails(componentFiber);
    }

    function showSelectionBox(el) {
        const rect = el.getBoundingClientRect();
        selectBox.style.display = 'block';
        selectBox.style.left = rect.left + 'px';
        selectBox.style.top = rect.top + 'px';
        selectBox.style.width = rect.width + 'px';
        selectBox.style.height = rect.height + 'px';
        setTimeout(function() { selectBox.style.display = 'none'; }, 1500);
    }

    function selectElement(el) {
        if (!el || !(el instanceof Element)) return;
        state.selected = el;
        if (!state.history.includes(el)) {
            state.history.unshift(el);
            if (state.history.length > 10) state.history.pop();
        } else {
            state.history = [el].concat(state.history.filter(function(item) { return item !== el; }));
        }
        renderSlots();
        renderInspectorPanel();
        renderReactPanel();
        showSelectionBox(el);
        showNotification('Selected <' + el.nodeName.toLowerCase() + '>');
    }

    function clearHighlightBoxes() {
        state.highlightBoxes.forEach(function(box) { box.remove(); });
        state.highlightBoxes = [];
    }

    function onHoverMove(e) {
        const target = e.target;
        if (target === hoverLabel) return;
        if (!target || ui.contains(target) || target === hoverBox) {
            hoverBox.style.display = 'none';
            hoverLabel.style.display = 'none';
            state.lastHoverTarget = null;
            return;
        }
        state.lastHoverTarget = target;
        const rect = target.getBoundingClientRect();
        hoverBox.style.display = 'block';
        hoverBox.style.left = rect.left + 'px';
        hoverBox.style.top = rect.top + 'px';
        hoverBox.style.width = rect.width + 'px';
        hoverBox.style.height = rect.height + 'px';
        hoverLabel.style.display = 'block';
        hoverLabel.style.left = rect.left + 'px';
        hoverLabel.style.top = Math.max(0, rect.top - 20) + 'px';
        const idPart = target.id ? '#' + displayName(target.id) : '';
        const classPart = target.className && typeof target.className === 'string' ? '.' + target.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(displayName).join('.') : '';
        hoverLabel.textContent = target.nodeName.toLowerCase() + idPart + classPart + ' ' + Math.round(rect.width) + 'x' + Math.round(rect.height);
    }

    function onHoverLabelClick(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!state.lastHoverTarget) return;
        if (state.lastHoverTarget.id) {
            copyToClipboard(displayName(state.lastHoverTarget.id));
        } else {
            copyToClipboard(generateSelector(state.lastHoverTarget));
        }
    }

    hoverLabel.addEventListener('click', onHoverLabelClick);

    function onPickClick(e) {
        if (ui.contains(e.target)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        selectElement(e.target);
        togglePickMode(false);
    }

    function togglePickMode(force) {
        state.pickMode = typeof force === 'boolean' ? force : !state.pickMode;
        const btn = document.getElementById('rwi-overlay-pick');
        const quick = document.getElementById('rwi-pick-quick');
        if (state.pickMode) {
            document.addEventListener('click', onPickClick, true);
            btn.textContent = 'Pick Mode: On';
            btn.classList.add('rwi-toggle-on');
            quick.style.background = 'rgba(124,58,237,0.6)';
        } else {
            document.removeEventListener('click', onPickClick, true);
            btn.textContent = 'Pick Mode: Off';
            btn.classList.remove('rwi-toggle-on');
            quick.style.background = '';
        }
    }

    function toggleHoverMode(force) {
        state.hoverMode = typeof force === 'boolean' ? force : !state.hoverMode;
        const btn = document.getElementById('rwi-overlay-hover');
        if (state.hoverMode) {
            document.addEventListener('mousemove', onHoverMove, true);
            btn.textContent = 'Hover Highlight: On';
            btn.classList.add('rwi-toggle-on');
        } else {
            document.removeEventListener('mousemove', onHoverMove, true);
            hoverBox.style.display = 'none';
            hoverLabel.style.display = 'none';
            btn.textContent = 'Hover Highlight: Off';
            btn.classList.remove('rwi-toggle-on');
        }
    }

    function flashElement(el) {
        if (!(el instanceof Element)) return;
        if (flashingElements.has(el)) return;
        flashingElements.add(el);
        el.classList.add('rwi-mutation-flash');
        setTimeout(function() {
            el.classList.remove('rwi-mutation-flash');
            flashingElements.delete(el);
        }, 1000);
    }

    function updateMutationCount() {
        document.getElementById('rwi-overlay-mutcount').textContent = state.mutationLog.length;
    }

    function renderMutationLog() {
        const container = document.getElementById('rwi-overlay-log');
        if (state.mutationLog.length === 0) {
            container.innerHTML = '<div class="rwi-empty-msg">No mutations logged yet</div>';
            return;
        }
        container.innerHTML = state.mutationLog.slice(0, 40).map(function(entry) {
            return '<div>[' + entry.time + '] ' + escapeHtml(entry.label) + '</div>';
        }).join('');
    }

    function logMutation(label) {
        state.mutationLog.unshift({ label: label, time: new Date().toLocaleTimeString() });
        if (state.mutationLog.length > 100) state.mutationLog.pop();
    }

    function isSelfInducedMutation(m) {
        if (!(m.target instanceof Element)) return false;
        if (m.type !== 'attributes' || m.attributeName !== 'class') return false;
        const cls = m.target.className;
        if (typeof cls !== 'string') return false;
        return cls.indexOf('rwi-mutation-flash') !== -1 || cls.indexOf('rwi-revealed') !== -1;
    }

    function handleMutations(mutations) {
        pendingMutationBatches.push(mutations);
        if (mutationFlushScheduled) return;
        mutationFlushScheduled = true;
        requestAnimationFrame(flushMutationBatches);
    }

    function flushMutationBatches() {
        mutationFlushScheduled = false;
        const combined = [];
        for (const batch of pendingMutationBatches) {
            for (const m of batch) combined.push(m);
        }
        pendingMutationBatches = [];
        const seenTargets = new Set();
        let processed = 0;
        for (const m of combined) {
            if (processed >= 20) break;
            if (ui.contains(m.target) || allBoxesContainer.contains(m.target)) continue;
            if (isSelfInducedMutation(m)) continue;
            if (seenTargets.has(m.target)) continue;
            seenTargets.add(m.target);
            logMutation(m.type + ' on <' + m.target.nodeName.toLowerCase() + '>');
            flashElement(m.target);
            processed++;
        }
        if (processed > 0) renderMutationLog();
        updateMutationCount();
        if (state.allBoxesMode) scheduleRenderAllBoxes();
    }

    function toggleLiveWatch(force) {
        state.liveWatch = typeof force === 'boolean' ? force : !state.liveWatch;
        const btn = document.getElementById('rwi-overlay-watch');
        if (state.liveWatch) {
            pendingMutationBatches = [];
            mutationFlushScheduled = false;
            state.mutationObserver = new MutationObserver(handleMutations);
            state.mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'id'] });
            btn.textContent = 'Live DOM Watch: On';
            btn.classList.add('rwi-toggle-on');
        } else {
            if (state.mutationObserver) state.mutationObserver.disconnect();
            state.mutationObserver = null;
            pendingMutationBatches = [];
            mutationFlushScheduled = false;
            btn.textContent = 'Live DOM Watch: Off';
            btn.classList.remove('rwi-toggle-on');
        }
    }

    const ALL_BOXES_EXCLUDED_TAGS = new Set(['script', 'style', 'link', 'meta', 'title', 'head', 'noscript', 'template', 'br', 'wbr', 'source', 'track', 'param', 'base']);

    function isBoxableElement(el) {
        const tag = el.nodeName.toLowerCase();
        if (ALL_BOXES_EXCLUDED_TAGS.has(tag)) return false;
        if (typeof SVGElement !== 'undefined' && el instanceof SVGElement && tag !== 'svg') return false;
        return true;
    }

    function renderAllBoxes() {
        allBoxesContainer.innerHTML = '';
        if (!state.allBoxesMode) return;
        const all = getAllInspectable();
        const seenRects = new Set();
        let count = 0;
        for (const el of all) {
            if (count >= ALL_BOXES_LIMIT) break;
            if (!isBoxableElement(el)) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width < 3 || rect.height < 3) continue;
            if (rect.bottom < 0 || rect.right < 0 || rect.top > window.innerHeight || rect.left > window.innerWidth) continue;
            const rectKey = Math.round(rect.left) + ':' + Math.round(rect.top) + ':' + Math.round(rect.width) + ':' + Math.round(rect.height);
            if (seenRects.has(rectKey)) continue;
            seenRects.add(rectKey);
            const box = document.createElement('div');
            box.className = 'rwi-all-box';
            box.style.left = rect.left + 'px';
            box.style.top = rect.top + 'px';
            box.style.width = rect.width + 'px';
            box.style.height = rect.height + 'px';
            allBoxesContainer.appendChild(box);
            const label = document.createElement('div');
            label.className = 'rwi-all-label';
            label.style.left = rect.left + 'px';
            label.style.top = (rect.top - 13 >= 0 ? rect.top - 13 : rect.top + 1) + 'px';
            const idPart = el.id ? '#' + displayName(el.id) : '';
            const classPart = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).filter(Boolean).slice(0, 1).map(displayName).join('.') : '';
            label.textContent = el.nodeName.toLowerCase() + idPart + classPart;
            allBoxesContainer.appendChild(label);
            count++;
        }
    }

    function scheduleRenderAllBoxes() {
        if (!state.allBoxesMode) return;
        if (allBoxesRenderScheduled) return;
        allBoxesRenderScheduled = true;
        requestAnimationFrame(function() {
            allBoxesRenderScheduled = false;
            renderAllBoxes();
        });
    }

    function toggleAllBoxesMode(force) {
        state.allBoxesMode = typeof force === 'boolean' ? force : !state.allBoxesMode;
        const btn = document.getElementById('rwi-overlay-allboxes');
        if (state.allBoxesMode) {
            renderAllBoxes();
            window.addEventListener('scroll', scheduleRenderAllBoxes, true);
            window.addEventListener('resize', scheduleRenderAllBoxes, true);
            btn.textContent = 'Show All Hitboxes: On';
            btn.classList.add('rwi-toggle-on');
        } else {
            allBoxesContainer.innerHTML = '';
            window.removeEventListener('scroll', scheduleRenderAllBoxes, true);
            window.removeEventListener('resize', scheduleRenderAllBoxes, true);
            btn.textContent = 'Show All Hitboxes: Off';
            btn.classList.remove('rwi-toggle-on');
        }
    }

    function applySidebarTab() {
        let tabContainer = document.getElementById('rwi-custom-tab-container');
        const activeNav = Array.from(
            document.querySelectorAll('nav[aria-label="Private channels"] ul, ul[data-list-id="private-channels"]')
        ).find(function(n) { return n.offsetParent !== null; });
        if (!tabContainer) {
            tabContainer = document.createElement('li');
            tabContainer.id = 'rwi-custom-tab-container';
            tabContainer.innerHTML = '<img src="https://i.imgur.com/uEKCG7B.gif" alt=""><span>Rickware - Labs&#169;</span>';
            tabContainer.addEventListener('click', renderCustomPage);
        }
        if (activeNav) {
            if (tabContainer.parentElement !== activeNav) {
                activeNav.insertBefore(tabContainer, activeNav.firstElementChild);
            }
            tabContainer.style.display = 'flex';
            if (activeNav.style.paddingTop !== '') {
                activeNav.style.paddingTop = '';
            }
        } else {
            tabContainer.style.display = 'none';
        }
    }

    function renderCustomPage() {
        let page = document.getElementById('rwi-custom-page');
        if (!page) {
            page = document.createElement('div');
            page.id = 'rwi-custom-page';
            page.style.cssText = 'position: absolute; top: 0; left: 375px; right: 0; bottom: 0; background-color: #1e1f22; z-index: 2147483646; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #dbdee1; padding: 32px; font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif; overflow: hidden;';
            page.innerHTML = `
                <div style="background: linear-gradient(145deg, #2b2d31, #232428); border-radius: 16px; padding: 28px; width: min(90%, 500px); max-width: 500px; display: flex; flex-direction: column; gap: 22px; box-shadow: 0 30px 60px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.05); animation: rwi-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; background: linear-gradient(90deg, #a855f7, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; white-space: nowrap;">Rickware - Labs&#169; Discord Inspector</h1>
                    <p style="font-size: 17px; margin: 0; color: #b5bac1; line-height: 1.6; text-align: center;">Explore, search and analyze the live Discord client from directly inside your browser.</p>
                    <div style="display: flex; gap: 20px; margin-top: 10px;">
                        <a href="#" id="rwi-page-discord-link" class="rwi-modern-btn" style="flex: 1; background: #5865F2; color: white; padding: 16px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: flex; justify-content: center; align-items: center; gap: 10px;"><svg width="24" height="24" viewBox="0 0 127.14 96.36"><path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-19.32-72.15ZM42.68,65.36c-5.19,0-9.49-4.78-9.49-10.63s4.2-10.63,9.49-10.63c5.31,0,9.54,4.78,9.49,10.63C52.17,60.58,48,65.36,42.68,65.36Zm41.72,0c-5.19,0-9.49-4.78-9.49-10.63s4.2-10.63,9.49-10.63c5.31,0,9.54,4.78,9.49,10.63C84.4,60.58,80.12,65.36,84.4,65.36Z"/></svg> Join Discord</a>
                        <a href="https://rickware-labs-official.github.io/Launcher/" target="_blank" class="rwi-modern-btn" style="flex: 1; background: #23a559; color: white; padding: 16px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: flex; justify-content: center; align-items: center; gap: 10px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4-10z"></path></svg> Shop / Launcher</a>
                    </div>
                    <div style="margin-top: 16px; font-size: 14px; color: #80848e; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; line-height: 1.8;">
                        <div style="font-weight: 700; color: #dbdee1; font-size: 15px;">Dev Credits</div>
                        <div>Author: .rick.c137</div>
                        <div>2026 Handmade Source Code &#10084;</div>
                    </div>
                </div>
                <button id="rwi-close-page" style="position: absolute; top: 40px; right: 40px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: #b5bac1; font-size: 20px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3); backdrop-filter: blur(4px);">&#10005;</button>
            `;
            document.body.appendChild(page);
            const discordLink = document.getElementById('rwi-page-discord-link');
            discordLink.addEventListener('click', function(event) {
                event.preventDefault();
                window.open('https://discord.gg/Wk7d8mJgyN', '_blank');
            });
            const closeBtn = document.getElementById('rwi-close-page');
            closeBtn.addEventListener('mouseover', function() {
                this.style.color = '#ffffff';
                this.style.background = 'rgba(0,0,0,0.6)';
                this.style.transform = 'rotate(90deg)';
            });
            closeBtn.addEventListener('mouseout', function() {
                this.style.color = '#b5bac1';
                this.style.background = 'rgba(0,0,0,0.4)';
                this.style.transform = 'rotate(0deg)';
            });
            closeBtn.addEventListener('click', function() {
                page.style.display = 'none';
            });
        }
        page.style.display = 'flex';
    }

    const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    const RAW_TEXT_TAGS = new Set(['script', 'style', 'textarea', 'title']);

    function formatHtml(rootEl) {
        const lines = [];
        function indentStr(depth) { return '  '.repeat(depth); }
        function walk(node, depth) {
            if (node.nodeType === 8) {
                lines.push(indentStr(depth) + '<!--' + node.nodeValue.trim() + '-->');
                return;
            }
            if (node.nodeType === 3) {
                const text = node.nodeValue.trim();
                if (text) lines.push(indentStr(depth) + text);
                return;
            }
            if (node.nodeType !== 1) return;
            if (node === ui || node === hoverBox || node === hoverLabel || node === selectBox || node === allBoxesContainer) return;
            if (node.id && node.id.indexOf('rwi-') === 0) return;
            const tag = node.nodeName.toLowerCase();
            const attrs = Array.from(node.attributes || []).map(function(a) {
                return a.name + '="' + String(a.value).replace(/"/g, '&quot;') + '"';
            }).join(' ');
            const openTag = '<' + tag + (attrs ? ' ' + attrs : '') + '>';
            if (VOID_TAGS.has(tag)) {
                lines.push(indentStr(depth) + '<' + tag + (attrs ? ' ' + attrs : '') + '>');
                return;
            }
            if (RAW_TEXT_TAGS.has(tag)) {
                lines.push(indentStr(depth) + openTag);
                const raw = node.textContent || '';
                raw.split('\n').forEach(function(l) {
                    if (l.trim()) lines.push(indentStr(depth + 1) + l.trim());
                });
                lines.push(indentStr(depth) + '</' + tag + '>');
                return;
            }
            const children = Array.from(node.childNodes).filter(function(child) {
                return !(child.nodeType === 3 && !child.nodeValue.trim());
            });
            if (children.length === 0) {
                lines.push(indentStr(depth) + openTag + '</' + tag + '>');
                return;
            }
            lines.push(indentStr(depth) + openTag);
            children.forEach(function(child) { walk(child, depth + 1); });
            lines.push(indentStr(depth) + '</' + tag + '>');
        }
        walk(rootEl, 0);
        return lines.join('\n');
    }

    function basicFormatJs(code) {
        if (!code) return '';
        let result = code
            .replace(/\r\n/g, '\n')
            .replace(/;/g, ';\n')
            .replace(/\{/g, '{\n')
            .replace(/\}/g, '\n}\n')
            .replace(/\n\s*\n/g, '\n');
        const rawLines = result.split('\n');
        let depth = 0;
        const out = [];
        rawLines.forEach(function(line) {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (trimmed.startsWith('}')) depth = Math.max(0, depth - 1);
            out.push('  '.repeat(depth) + trimmed);
            if (trimmed.endsWith('{')) depth++;
        });
        return out.join('\n');
    }

    function collectJsSources() {
        return Array.from(document.scripts).map(function(s, idx) {
            return { index: idx, src: s.src || null, inline: !s.src, content: s.src ? null : s.textContent };
        });
    }

    async function buildJsText() {
        const allScripts = collectJsSources();
        const scripts = allScripts.slice(0, MAX_SCRIPTS_PROCESSED);
        const parts = [];
        for (const s of scripts) {
            if (s.inline) {
                parts.push('// Inline Script #' + s.index);
                parts.push(basicFormatJs((s.content || '').slice(0, 200000)));
            } else {
                parts.push('// External Script #' + s.index + ': ' + s.src);
                try {
                    const res = await fetch(s.src);
                    const text = await res.text();
                    parts.push(basicFormatJs(text.slice(0, 200000)));
                } catch (err) {
                    parts.push('// Could not fetch this script (CORS or network restriction)');
                }
            }
            parts.push('');
        }
        if (allScripts.length > MAX_SCRIPTS_PROCESSED) {
            parts.push('// ' + (allScripts.length - MAX_SCRIPTS_PROCESSED) + ' more script(s) not processed');
        }
        return parts.join('\n');
    }

    function formatCssRuleLines(rule, depth) {
        const pad = '  '.repeat(depth);
        const lines = [];
        if (rule.cssRules) {
            const header = rule.cssText ? rule.cssText.split('{')[0].trim() : '@rule';
            lines.push(pad + header + ' {');
            Array.from(rule.cssRules).forEach(function(r) {
                formatCssRuleLines(r, depth + 1).forEach(function(l) { lines.push(l); });
            });
            lines.push(pad + '}');
        } else if (rule.style) {
            lines.push(pad + rule.selectorText + ' {');
            Array.from(rule.style).forEach(function(prop) {
                lines.push(pad + '  ' + prop + ': ' + rule.style.getPropertyValue(prop) + ';');
            });
            lines.push(pad + '}');
        } else if (rule.cssText) {
            lines.push(pad + rule.cssText);
        }
        return lines;
    }

    function formatCss() {
        const lines = [];
        Array.from(document.styleSheets).forEach(function(sheet) {
            let rules;
            try {
                rules = sheet.cssRules || sheet.rules;
            } catch (err) {
                lines.push('/* Inaccessible stylesheet (cross-origin): ' + (sheet.href || 'inline') + ' */');
                lines.push('');
                return;
            }
            if (!rules) return;
            lines.push('/* ' + (sheet.href || 'inline stylesheet') + ' */');
            Array.from(rules).forEach(function(rule) {
                formatCssRuleLines(rule, 0).forEach(function(l) { lines.push(l); });
            });
            lines.push('');
        });
        return lines.join('\n');
    }

    function collectImagesText() {
        return Array.from(document.images).map(function(img, i) {
            return '[' + i + '] ' + (img.currentSrc || img.src || '(no src)') + ' alt="' + (img.alt || '') + '" ' + img.naturalWidth + 'x' + img.naturalHeight;
        }).join('\n');
    }

    function collectLinksText() {
        const anchors = Array.from(document.querySelectorAll('a[href]')).map(function(a) {
            const text = a.textContent ? a.textContent.trim().slice(0, 60) : '';
            return 'a: ' + a.href + (text ? ' \u2014 ' + text : '');
        });
        const linkTags = Array.from(document.querySelectorAll('link[href]')).map(function(l) {
            return 'link[' + (l.rel || '?') + ']: ' + l.href;
        });
        const seen = new Set();
        return anchors.concat(linkTags).filter(function(entry) {
            if (seen.has(entry)) return false;
            seen.add(entry);
            return true;
        }).join('\n');
    }

    function collectRequestsText() {
        if (!window.performance || !performance.getEntriesByType) return 'Performance API not available';
        const entries = performance.getEntriesByType('resource');
        return entries.map(function(e) {
            return '[' + e.initiatorType + '] ' + e.name + ' \u2014 ' + Math.round(e.duration) + 'ms' + (e.transferSize ? ' \u2014 ' + e.transferSize + 'b' : '');
        }).join('\n');
    }

    async function runCodeScan() {
        const resource = document.getElementById('rwi-code-resource').value;
        const statusEl = document.getElementById('rwi-code-status');
        statusEl.textContent = 'Scanning...';
        let text = '';
        if (resource === 'html') text = formatHtml(document.documentElement);
        else if (resource === 'js') text = await buildJsText();
        else if (resource === 'css') text = formatCss();
        else if (resource === 'images') text = collectImagesText();
        else if (resource === 'links') text = collectLinksText();
        else if (resource === 'requests') text = collectRequestsText();
        state.codeScans[resource] = text;
        state.codeCurrentResource = resource;
        renderCodeViewer();
        statusEl.textContent = 'Scanned';
        showNotification('Scan complete: ' + resource);
    }

    function appendHighlighted(container, text, query, matches) {
        const lower = text.toLowerCase();
        const q = query.toLowerCase();
        let start = 0;
        let idx = lower.indexOf(q, start);
        if (idx === -1) {
            container.textContent = text;
            return;
        }
        while (idx !== -1) {
            if (idx > start) container.appendChild(document.createTextNode(text.slice(start, idx)));
            const mark = document.createElement('span');
            mark.className = 'rwi-code-match';
            mark.textContent = text.slice(idx, idx + query.length);
            container.appendChild(mark);
            matches.push(mark);
            start = idx + query.length;
            idx = lower.indexOf(q, start);
        }
        if (start < text.length) container.appendChild(document.createTextNode(text.slice(start)));
    }

    function focusCodeMatch(index) {
        if (!state.codeMatches.length) return;
        const prevActive = document.querySelector('.rwi-code-match-active');
        if (prevActive) prevActive.classList.remove('rwi-code-match-active');
        const clamped = ((index % state.codeMatches.length) + state.codeMatches.length) % state.codeMatches.length;
        state.codeMatchIndex = clamped;
        const el = state.codeMatches[clamped];
        el.classList.add('rwi-code-match-active');
        el.scrollIntoView({ block: 'center' });
    }

    function renderCodeViewer() {
        const container = document.getElementById('rwi-code-viewer');
        if (!container) return;
        const resource = state.codeCurrentResource;
        let text = state.codeScans[resource];
        if (typeof text !== 'string') {
            container.innerHTML = '<div class="rwi-empty-msg">Click Scan Page to load code</div>';
            document.getElementById('rwi-code-linecount').textContent = '0';
            state.codeMatches = [];
            state.codeMatchIndex = -1;
            document.getElementById('rwi-code-search-count').textContent = '0';
            return;
        }
        if (state.autoDehash) text = deObfuscateName(text);
        let lines = text.length ? text.split('\n') : [''];
        const truncated = lines.length > MAX_CODE_LINES;
        if (truncated) lines = lines.slice(0, MAX_CODE_LINES);
        document.getElementById('rwi-code-linecount').textContent = lines.length + (truncated ? ' (truncated)' : '');
        const query = document.getElementById('rwi-code-search').value;
        container.innerHTML = '';
        const matches = [];
        const fragment = document.createDocumentFragment();
        lines.forEach(function(lineText, idx) {
            const row = document.createElement('div');
            row.className = 'rwi-code-line';
            const ln = document.createElement('span');
            ln.className = 'rwi-code-ln';
            ln.textContent = String(idx + 1);
            const contentSpan = document.createElement('span');
            contentSpan.className = 'rwi-code-content';
            if (query) {
                appendHighlighted(contentSpan, lineText, query, matches);
            } else {
                contentSpan.textContent = lineText;
            }
            row.appendChild(ln);
            row.appendChild(contentSpan);
            fragment.appendChild(row);
        });
        container.appendChild(fragment);
        state.codeMatches = matches;
        document.getElementById('rwi-code-search-count').textContent = matches.length;
        state.codeMatchIndex = matches.length ? 0 : -1;
        if (matches.length) focusCodeMatch(0);
    }

    function onContextMenu(e) {
        if (!state.devtoolsRightClick) return;
        if (ui.contains(e.target)) return;
        const target = e.composedPath ? e.composedPath()[0] : e.target;
        selectElement(target);
        if (typeof inspect === 'function') {
            e.preventDefault();
            e.stopImmediatePropagation();
            inspect(target);
        }
    }

    function onKeyDown(e) {
        if (e.altKey && e.shiftKey && e.code === 'KeyI') {
            e.preventDefault();
            togglePickMode();
        }
        if (e.altKey && e.shiftKey && e.code === 'KeyO') {
            e.preventDefault();
            ui.classList.toggle('rwi-minimized');
        }
    }

    document.getElementById('rwi-search-mode').addEventListener('change', function(e) {
        document.getElementById('rwi-search-attr-wrap').classList.toggle('rwi-hidden', e.target.value !== 'attr');
    });

    document.getElementById('rwi-search-run').addEventListener('click', function() {
        const mode = document.getElementById('rwi-search-mode').value;
        const query = document.getElementById('rwi-search-query').value;
        const opts = {
            exact: document.getElementById('rwi-search-exact').checked,
            regex: document.getElementById('rwi-search-regex').checked,
            case: document.getElementById('rwi-search-case').checked,
            leaf: document.getElementById('rwi-search-leaf').checked,
            attrName: document.getElementById('rwi-search-attr').value
        };
        const queryParts = query.split(',').map(function(part) { return part.trim(); }).filter(Boolean);
        const effectiveParts = queryParts.length > 0 ? queryParts : [query];
        const seen = new Set();
        const matches = [];
        effectiveParts.forEach(function(part) {
            runElementSearch(mode, part, opts).forEach(function(el) {
                if (seen.has(el)) return;
                seen.add(el);
                matches.push(el);
            });
        });
        state.lastSearchMatches = matches;
        document.getElementById('rwi-search-count').textContent = matches.length;
        renderResultList('rwi-search-results', matches);
    });

    document.getElementById('rwi-search-clear').addEventListener('click', function() {
        state.lastSearchMatches = [];
        document.getElementById('rwi-search-count').textContent = '0';
        document.getElementById('rwi-search-results').innerHTML = '<div class="rwi-empty-msg">No search run yet</div>';
        clearHighlightBoxes();
    });

    document.getElementById('rwi-search-highlight-all').addEventListener('click', function() {
        clearHighlightBoxes();
        state.lastSearchMatches.forEach(function(el) {
            const rect = el.getBoundingClientRect();
            const box = document.createElement('div');
            box.className = 'rwi-select-box';
            box.style.left = rect.left + 'px';
            box.style.top = rect.top + 'px';
            box.style.width = rect.width + 'px';
            box.style.height = rect.height + 'px';
            document.body.appendChild(box);
            state.highlightBoxes.push(box);
        });
        setTimeout(clearHighlightBoxes, 3000);
    });

    document.getElementById('rwi-hidden-scan').addEventListener('click', function() {
        const opts = {
            display: document.getElementById('rwi-hidden-display').checked,
            visibility: document.getElementById('rwi-hidden-visibility').checked,
            opacity: document.getElementById('rwi-hidden-opacity').checked,
            offscreen: document.getElementById('rwi-hidden-offscreen').checked,
            zerosize: document.getElementById('rwi-hidden-zerosize').checked
        };
        const results = runHiddenScan(opts);
        state.lastHiddenMatches = results;
        document.getElementById('rwi-hidden-count').textContent = results.length;
        const reasonsMap = new Map(results.map(function(r) { return [r.el, r.reasons]; }));
        renderResultList('rwi-hidden-results', results.map(function(r) { return r.el; }), reasonsMap);
    });

    document.getElementById('rwi-hidden-reveal').addEventListener('click', function(e) {
        state.revealMode = !state.revealMode;
        e.target.textContent = 'Reveal Mode: ' + (state.revealMode ? 'On' : 'Off');
        e.target.classList.toggle('rwi-toggle-on', state.revealMode);
        if (state.revealMode) {
            state.lastHiddenMatches.forEach(function(r) { revealElement(r.el); });
            showNotification('Revealed ' + state.lastHiddenMatches.length + ' element(s)');
        } else {
            restoreAllRevealed();
        }
    });

    document.getElementById('rwi-hidden-restore').addEventListener('click', function() {
        restoreAllRevealed();
        state.revealMode = false;
        document.getElementById('rwi-hidden-reveal').textContent = 'Reveal Mode: Off';
        document.getElementById('rwi-hidden-reveal').classList.remove('rwi-toggle-on');
        showNotification('Restored all elements');
    });

    document.getElementById('rwi-react-up').addEventListener('click', function() {
        if (state.currentFiber && state.currentFiber.return) {
            state.currentFiber = state.currentFiber.return;
            renderFiberDetails(state.currentFiber);
        }
    });

    document.getElementById('rwi-react-down').addEventListener('click', function() {
        if (state.currentFiber && state.currentFiber.child) {
            state.currentFiber = state.currentFiber.child;
            renderFiberDetails(state.currentFiber);
        }
    });

    document.getElementById('rwi-react-find-instances').addEventListener('click', function() {
        if (!state.currentFiber || !state.currentFiber.type) return;
        const targetType = state.currentFiber.type;
        const all = getAllInspectable();
        const matches = [];
        for (const el of all) {
            const fiber = getReactFiber(el);
            if (fiber && fiber.type === targetType) matches.push(el);
        }
        renderResultList('rwi-react-instances', matches);
        document.getElementById('rwi-react-instances').classList.remove('rwi-hidden');
        showNotification(matches.length + ' instance(s) found');
    });

    document.getElementById('rwi-webpack-run').addEventListener('click', function() {
        const mode = document.getElementById('rwi-webpack-mode').value;
        const query = document.getElementById('rwi-webpack-query').value;
        if (!query) return;
        const req = connectWebpack();
        document.getElementById('rwi-webpack-status').textContent = req ? 'Connected' : 'Unavailable';
        let results = [];
        if (mode === 'prop') results = searchWebpackByProperty(query, false);
        else results = searchWebpackBySource(query);
        state.lastWebpackResults = results;
        document.getElementById('rwi-webpack-count').textContent = results.length;
        renderWebpackResults(results);
    });

    document.getElementById('rwi-webpack-flux').addEventListener('click', function() {
        const req = connectWebpack();
        document.getElementById('rwi-webpack-status').textContent = req ? 'Connected' : 'Unavailable';
        const results = findFluxStores();
        state.lastWebpackResults = results;
        document.getElementById('rwi-webpack-count').textContent = results.length;
        renderWebpackResults(results);
    });

    document.getElementById('rwi-webpack-copy').addEventListener('click', function() {
        const val = document.getElementById('rwi-webpack-preview').value;
        if (val) copyToClipboard(val);
    });

    document.getElementById('rwi-overlay-hover').addEventListener('click', function() { toggleHoverMode(); });
    document.getElementById('rwi-overlay-pick').addEventListener('click', function() { togglePickMode(); });
    document.getElementById('rwi-pick-quick').addEventListener('click', function() { togglePickMode(); });
    document.getElementById('rwi-overlay-watch').addEventListener('click', function() { toggleLiveWatch(); });
    document.getElementById('rwi-overlay-allboxes').addEventListener('click', function() { toggleAllBoxesMode(); });
    document.getElementById('rwi-overlay-clear-log').addEventListener('click', function() {
        state.mutationLog = [];
        renderMutationLog();
        updateMutationCount();
    });

    document.getElementById('rwi-code-resource').addEventListener('change', function() {
        state.codeCurrentResource = this.value;
        renderCodeViewer();
    });

    document.getElementById('rwi-code-scan').addEventListener('click', function() {
        runCodeScan();
    });

    document.getElementById('rwi-code-search').addEventListener('input', function() {
        renderCodeViewer();
    });

    document.getElementById('rwi-code-search-next').addEventListener('click', function() {
        focusCodeMatch(state.codeMatchIndex + 1);
    });

    document.getElementById('rwi-code-search-prev').addEventListener('click', function() {
        focusCodeMatch(state.codeMatchIndex - 1);
    });

    document.getElementById('rwi-insp-copy-html').addEventListener('click', function() {
        if (!state.selected) return;
        copyToClipboard(state.selected.outerHTML);
    });

    document.getElementById('rwi-insp-copy-json').addEventListener('click', function() {
        if (!state.selected) return;
        const el = state.selected;
        const rect = el.getBoundingClientRect();
        const summary = {
            tag: el.nodeName.toLowerCase(),
            id: el.id || null,
            classes: el.className || null,
            attributes: Array.from(el.attributes).reduce(function(acc, attr) { acc[attr.name] = attr.value; return acc; }, {}),
            text: el.textContent ? el.textContent.trim().slice(0, 300) : '',
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        };
        copyToClipboard(JSON.stringify(summary, null, 2));
    });

    document.getElementById('rwi-insp-copy-selector').addEventListener('click', function() {
        if (!state.selected) return;
        copyToClipboard(generateSelector(state.selected));
    });

    document.getElementById('rwi-insp-copy-xpath').addEventListener('click', function() {
        if (!state.selected) return;
        copyToClipboard(generateXPath(state.selected));
    });

    document.getElementById('rwi-insp-scroll').addEventListener('click', function() {
        if (!state.selected) return;
        state.selected.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    document.getElementById('rwi-insp-log').addEventListener('click', function() {
        if (!state.selected) return;
        console.log(state.selected);
        showNotification('Logged to console');
    });

    document.getElementById('rwi-settings-rightclick').addEventListener('change', function(e) {
        state.devtoolsRightClick = e.target.checked;
    });

    document.getElementById('rwi-settings-dehash').addEventListener('change', function(e) {
        state.autoDehash = e.target.checked;
        renderInspectorPanel();
        if (state.lastSearchMatches.length) renderResultList('rwi-search-results', state.lastSearchMatches);
        if (state.allBoxesMode) renderAllBoxes();
        renderCodeViewer();
    });

    document.getElementById('rwi-settings-reset').addEventListener('click', function() {
        state.selected = null;
        state.history = [];
        state.mutationLog = [];
        restoreAllRevealed();
        renderSlots();
        renderInspectorPanel();
        renderReactPanel();
        renderMutationLog();
        updateMutationCount();
        showNotification('Tool state reset');
    });

    const header = document.getElementById('rwi-header');
    let isDragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', function(e) {
        if (e.target.closest('.rwi-btn-icon')) return;
        isDragging = true;
        const rect = ui.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        ui.style.left = rect.left + 'px';
        ui.style.top = rect.top + 'px';
        ui.style.right = 'auto';
        ui.style.bottom = 'auto';
    });
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        ui.style.left = (e.clientX - offsetX) + 'px';
        ui.style.top = (e.clientY - offsetY) + 'px';
    });
    document.addEventListener('mouseup', function() { isDragging = false; });

    document.getElementById('rwi-minimize').addEventListener('click', function() {
        ui.classList.toggle('rwi-minimized');
    });

    document.getElementById('rwi-close').addEventListener('click', function() { destroy(); });

    document.querySelectorAll('.rwi-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.rwi-tab').forEach(function(t) { t.classList.remove('active'); });
            document.querySelectorAll('.rwi-view').forEach(function(v) { v.classList.remove('active'); });
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('keydown', onKeyDown, true);

    function destroy() {
        document.removeEventListener('mousemove', onHoverMove, true);
        document.removeEventListener('click', onPickClick, true);
        document.removeEventListener('contextmenu', onContextMenu, true);
        document.removeEventListener('keydown', onKeyDown, true);
        if (state.mutationObserver) state.mutationObserver.disconnect();
        window.removeEventListener('scroll', scheduleRenderAllBoxes, true);
        window.removeEventListener('resize', scheduleRenderAllBoxes, true);
        if (sidebarTabInterval) clearInterval(sidebarTabInterval);
        restoreAllRevealed();
        clearHighlightBoxes();
        hoverBox.remove();
        hoverLabel.remove();
        selectBox.remove();
        allBoxesContainer.remove();
        const customPage = document.getElementById('rwi-custom-page');
        if (customPage) customPage.remove();
        const customTab = document.getElementById('rwi-custom-tab-container');
        if (customTab) customTab.remove();
        ui.remove();
        style.remove();
        delete window.__rwiInspectorLoaded;
    }

    renderSlots();
    renderInspectorPanel();
    renderReactPanel();
    renderMutationLog();
    updateMutationCount();
    applySidebarTab();
    sidebarTabInterval = setInterval(applySidebarTab, 1000);
    showNotification('Discord Inspector V3 loaded');

    window.__rwiInspectorLoaded = { destroy: destroy };
})();

// • https://rickware-labs-official.github.io/Launcher/
// • Discord: https://discord.gg/Wk7d8mJgyN
// • 2026 Handmade Source Code ❤
// • Code by: Rickware - Labs©
// • Author: .rick.c137