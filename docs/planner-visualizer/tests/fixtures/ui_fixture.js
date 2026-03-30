/**
 * Shared Test Fixtures for UI components.
 */

// The complete HTML structure required by UI.js logic
export const MOCK_DOM = `
    <!-- Panels -->
    <div id="panel-standard"></div>
    <div id="panel-context" class="hidden">
        <h2 id="ctx-header"></h2>
        <div id="ctx-content"></div>
        <button id="btn-close-context"></button>
        <button id="btn-delete-object"></button>
    </div>

    <!-- Selectors -->
    <select id="select-scenario"><option value="test">Test</option></select>
    <select id="select-planner"><option value="rrt">RRT</option></select>
    <select id="select-sampler"><option value="UNIFORM">Uniform</option></select>
    
    <!-- FIX: Added 'dubins' option so switching tests work -->
    <select id="select-robot">
        <option value="holonomic">Holonomic</option>
        <option value="dubins">Dubins Car</option>
    </select>

    <!-- Algorithm Controls -->
    <div id="ctrl-step-size"><input id="input-step-size" type="range" min="0.1" max="2.0" step="0.1" value="0.5"><span id="val-step-size">0.5m</span></div>
    <div id="ctrl-goal-bias"><input id="input-goal-bias" type="range"><span id="val-goal-bias"></span></div>
    <div id="ctrl-rewire-radius"><input id="input-rewire-radius" type="range"><span id="val-rewire-radius"></span></div>
    <div id="ctrl-informed"><input id="chk-informed" type="checkbox"></div>
    <div id="ctrl-greedy"><input id="chk-greedy" type="checkbox"></div>
    <div id="ctrl-prm-radius"><input id="input-prm-radius" type="range"><span id="val-prm-radius"></span></div>
    <div id="ctrl-prm-k"><input id="input-prm-k" type="range"><span id="val-prm-k"></span></div>

    <!-- View Options -->
    <!-- FIX: Ensuring these IDs match UI.js expectations exactly -->
    <input id="chk-show-rejected" type="checkbox">
    <input id="chk-show-grid" type="checkbox" checked>

    <!-- Execution -->
    <button id="btn-run">
        <span id="text-run">Run until solved</span>
        <div id="icon-play"></div>
        <div id="icon-pause" class="hidden"></div>
    </button>
    <input id="input-speed" type="range"><span id="val-speed"></span>
    <button id="btn-step-1"></button>
    <button id="btn-step-10"></button>
    <button id="btn-step-100"></button>

    <!-- Toolbar -->
    <div id="toolbar-tools">
        <button data-tool="select" class="tool-btn"></button>
        <button data-tool="obs-rect" class="tool-btn"></button>
        <button data-tool="cost-rect" class="tool-btn"></button>
        <button data-tool="goal-rect" class="tool-btn"></button>
    </div>
    <button id="btn-clear-graph"></button>

    <!-- Info Bar -->
    <div id="info-nodes"><span></span></div>
    <div id="info-edges"><span></span></div>
    <div id="info-path"><span></span></div>

    <!-- Workspace -->
    <svg id="workspace-svg" viewBox="0 0 1000 1000">
        <g id="bg-grid"></g> 
        <g id="layer-cost-regions"></g>
        <g id="layer-ellipse"></g>
        <g id="layer-goals"></g>
        <g id="layer-graph"></g>
        <g id="layer-graph-nodes"></g>
        <g id="layer-obstacles"></g>
        <g id="layer-rejected"></g>
        <g id="layer-solution"></g>
        <g id="layer-robot"></g>
    </svg>
`;

/**
 * Sets up the fixture in the document body.
 * @param {string} containerId - ID of the container div (default 'ui-fixture')
 * @returns {HTMLElement} The container element
 */
export function setupUIFixture(containerId = 'ui-fixture') {
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'absolute';
        container.style.top = '-10000px';
        container.style.visibility = 'hidden';
        document.body.appendChild(container);
    }
    container.innerHTML = MOCK_DOM;
    return container;
}

/**
 * Clears the fixture.
 */
export function teardownUIFixture(containerId = 'ui-fixture') {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
}
