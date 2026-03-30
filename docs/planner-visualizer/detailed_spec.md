Specification for Robot Motion Planner Visualizer
=================================================

Overview: this is a specficiation for a interactive web-based educational tool to help students gain an understanding of how graph-based robot motion planners work. It allows the selection of motion planning problems, solvers to use on those problems, and parameters of the solvers, and it allows control over how the motion planner is run.

Features
--------

-   Single-page webapp. All computation is done client-side.

-   Uses minimal third-party libraries. The ones it does use come from CDNs.

-   Allows multiple 2D robot motion planning scenarios to be selected

-   Allows customization of robot motion planning scenarios

-   Allows different robot motion profiles: 2D holonomic, Dubins cars, Reed-Shepps cars, and differential drive (both simple and optimal).

-   Users select which planner they want to run, and can customize tunable parameters of the selected planner.

-   Has a visualization of the workspace, including robot, goal region, and obstacles.

-   The visualization shows the computed graph(s)--edges and nodes, and the solution path, once found.

-   The visualization optionally shows additional inner workings of the planners, including sampled, but rejected nodes and edges.

-   The visualization shows highlights recent modifications then have them fade into the underlying structure

-   The user can select how to run the algorithm--1 or a few steps at a time, or run until solution.

-   Information about the graph (number of nodes and edges) and solutions (path length and number of segments) are displayed.

User Interface
--------------

The user interface consists two main components that are further divided into subcomponents:

-   Left side: a control panel that lets the user select the scenario, robot, planner, options, execution parameters, and run the planner.

-   Right side: a visualization of the problem and planner as it runs. A Toolbar to modify the scenario at the top, and a Information Bar at the bottom to provided information about the planner's progress, graph size, and solution length (in meters and number of edges/segments).

### Control Panel

The control panel is a vertically organized group of labelled control sections. The sections follow a color-coded scheme to differentiate functionality.

**Standard View:**

-   **Scenario (Theme: Blue):**

    -   Drop down to select from several predefined named scenarios.

    -   A second dropdown changes the robot type.

    -   *UI Consistency:* Sliders in this section use Blue accents. `[LOCKED]`

-   **Algorithm (Theme: Red):**

    -   *Rationale:* Matches the Robot color (the active agent).

    -   A dropdown selecting between the different planners.

    -   **Sampler Dropdown:** Selects the strategy for generating "random" samples:

        -   **Uniform Random (Default):** Standard pseudo-random generation.

        -   **Halton Sequence:** Deterministic, low-discrepancy sequence. Provides more even coverage of the workspace.

        -   **Grid (Jittered):** Samples based on a grid pattern with slight random noise.

    -   Sliders for step size, goal bias, nearest-neighbor radius, etc.

        -   **Visual Markers:** Sliders display a specific visual tick mark or indicator for "recommended" or "optimal" values (e.g., the theoretical constant for asymptotic optimality in RRT\*).

        -   **Snap-to Behavior:** Sliders magnetically "snap" or "lock" to this recommended value when the handle is dragged within a small threshold of the mark.

    -   *UI Consistency:* Sliders in this section use Red accents. `[LOCKED]`

**Context-Sensitive Panel (Replaces Scenario/Algorithm when object selected):**

-   Triggered when the user selects a map object (Robot, Goal, Obstacle, Cost Region).

-   **Properties (Theme: Purple):**

    -   **Header:** Displays the type of object selected (e.g., "Properties: Cost Region").

    -   **Common Properties:**

        -   **Position (X, Y):** Number inputs to precisely set the location of the object's center (or top-left for rectangles, depending on internal anchor).

        -   **Delete Button:** A red button to remove the selected object(s) from the workspace (disabled for the Robot).

    -   **Cost Regions:**

        -   **Cost Multiplier:** Slider for "Cost Multiplier" (Range: 0.1x to 10.0x).

        -   **Dimensions:** Inputs for Width/Height (if Rectangle) or Radius (if Circle) or Vertex List (if Polygon - read only or simple edit).

    -   **Obstacles:**

        -   **Dimensions:** Inputs for Width/Height (if Rectangle) or Radius (if Circle). This allows creating precise gaps (e.g., exactly 1.0m width).

    -   **Robot / Goal:**

        -   **Orientation (Theta):** Slider and Number input for orientation (for non-holonomic robots).

    -   **Close Button:** Returns to the Standard View (equivalent to clicking the background).

**Shared Sections (Always Visible):**

-   **View Options (Theme: Brown):**

    -   *Rationale:* Matches the "Reverse Tree" color, distinct from Red/Orange.

    -   Checkbox to show rejected nodes and edges.

    -   Checkbox to show/hide the background grid (Default: On).

    -   *UI Consistency:* Checkboxes in this section use Brown accents. `[LOCKED]`

-   **Execution (Theme: Green):**

    -   Speed setting slider.

    -   Buttons to add "+1", "+10", and "+100" samples.

    -   A button to run/stop the motion planner.

        -   **State 1 (Stopped):** Green background, "Play" icon, Text: "Run until solved".

        -   **State 2 (Running):** Red background, "Pause" icon, Text: "Stop / Pause".

    -   *UI Consistency:* Sliders in this section use Green accents. `[LOCKED]`

### Visual Style Guide & Implementation

To ensure maintainability, all visualization styling (colors, strokes, widths) must be consolidated into a central CSS block or configuration object, rather than inline attributes.

**Color Palette:**

-   **Obstacles:** `#60A5FA` (Lighter Blue) - Reduces chromostereopsis against red `[LOCKED]`

-   **Robot:** Stroke `#EF4444`, Fill `rgba(239, 68, 68, 0.5)` (Red) `[LOCKED]`

-   **Goal Region:** Stroke `#22C55E`, Fill `rgba(34, 197, 94, 0.5)` (Green) `[LOCKED]`

-   **Solution Path:** `#15803D` (Dark Emerald Green) - Distinct from goal, implies success `[LOCKED]`

-   **Graph (Forward):** `#9CA3AF` (Gray) `[TENTATIVE]`

-   **Graph (Reverse Tree):** `#B45309` (Brown/Amber) `[LOCKED]`

-   **Rejected Samples:** `#E11D48` (Rose) - Reduces chromostereopsis (vibration) against blue obstacles `[LOCKED]`

-   **Highlight:** `#818CF8` (Light Indigo) - Vibrant/Electric Blue, distinct from Obstacle Blue `[LOCKED]`

-   **Cost Region (Terrain):** `rgba(180, 83, 9, 0.3)` (Translucent Brown) - Visually distinct from blue obstacles. `[LOCKED]`

**Stroke Widths & Geometry:**

-   **Graph Edges:** 1.5px `[LOCKED]`

-   **Solution Path:** 4px `[LOCKED]`

-   **Goal/Robot Borders:** 2px - 3px `[LOCKED]`

-   **Rejected Samples:** 1px solid line (no dashes) `[LOCKED]`

-   **Directional Arrows:** Must extend across the entire body of the robot/goal for visibility `[LOCKED]`

-   **Informed Ellipse:** 1px dashed line. `[LOCKED]`

### Workspace Visualization

The workspace visualizer shows obstacles, the robot, the goal region, the current state of the planner (i.e., the graph), and a solution if it exists.

The background contains a light grid which can be toggled via View Options. This grid is the lowest layer.

Obstacles appear with an opaque blue fill and no border. The following obstacle types are supported: circle, rectangle, and polygon.

**Cost Regions** appear as translucent brown shapes. They do not block the robot but increase the cost of traversing that area.

The robot appears differently depending on its type. Regardless of type it has an opaque red outline and a translucent red fill.

-   2D Holonomic Robots: circle

-   Dubins and Reeds Shepps car: rectangle, with the longer dimension indicating the heading direction. It has an arrow overlayed on the rectangle pointing towards front.

-   Differential drive: a circle like the 2D holonomic robot, but with two rectangles indicating the wheels of the differential drive.

The goal region appears in green. The border of the region is opaque. The fill of the region is translucent. There may be multiple regions. Regions have the same geometry options as obstacles, namely: circle, rectangle, and polygon.

When the robot has an orientation `theta` (e.g., a Dubins car), the robot and goal regions have an opaque thin arrow pointing in their direction of heading. This arrow extends across the body of the shape.

The graph the planner that builds appears in gray. The nodes are circles with a larger radius than the edges. The edges are thin and slightly transparent. New and modified nodes and edges on the graph start as bright Light Indigo (`#818CF8`) and fade to the normal gray color to help highlight the modifications. The edges on the graph trace the route the robot takes. This means that the holonomic robot has straight lines between edges. The path for cars will have arcs (e.g., representing the Dubin's 6 different possible optimal paths).

For planners such as RRT-Connect that build graphs from goal regions, these graphs are shown similarly to the graph from robot, but the underlying base color is Brown (`#B45309`).

The program tracks sampled by rejected nodes and edges. These are displayed in Rose (`#E11D48`) as solid, thin lines.

The solution path shows in Dark Emerald Green (`#15803D`), and is overlayed on top of the graph.

**Informed RRT* Ellipse:*\* When using Informed RRT\*, and a solution has been found, the search area is restricted to an ellipse. This ellipse is drawn as a thin, dashed line using the Solution Color (`#15803D`) with reduced opacity (e.g., 0.4), so it serves as a visual guide without cluttering the graph.

The workspace is square (1:1 aspect ratio) and scales to fill the center region of the workspace area, without clipping or scrolling.

The visualization is built in layers, so that lower layers are covered by content from higher layers. The layers from lowest to highest:

-   Grid (Background)

-   **Cost Regions** (Low Layer)

-   **Search Ellipse** (Informed RRT\* boundary)

-   Goal regions (since goal regions in obstacle are not valid)

-   Planning graph

-   Obstacles

-   Rejected nodes and edges

-   Solution path

-   Robot

When a planner is running, the visualization updates are synchronized with the algorithm iterations (i.e., transient updates to the graph, if present, do not show up).

### Toolbar

The toolbar contains the following controls flushed left:

-   Selector/pointer: the default. When selected, "selector" mode is enabled.

-   (separator)

-   Rectangle (in light blue): When selected, "draw rectangle obstacle" mode is enabled.

-   Circle (in light blue): When selected, "draw circle obstacle" mode is enabled.

-   Polygon (in light blue): When enabled, "draw polygon obstacle" mode is enabled.

-   (separator)

-   **Cost Rect** (in light brown): When selected, "draw cost rectangle" mode is enabled.

-   **Cost Circle** (in light brown): When selected, "draw cost circle" mode is enabled.

-   **Cost Poly** (in light brown): When selected, "draw cost polygon" mode is enabled.

-   (separator)

-   Rectangle (in light green): When selected, "draw rectangle goal" mode is enabled.

-   Circle (in light green): When selected, "draw circle goal" mode is enabled.

-   Polygon (in light green): When enabled, "draw polygon goal" mode is enabled.

The toolbar has the following buttons flushed right:

-   "Clear Graph" button. This button includes a "Trash Can" or "X" icon for clarity.

The mode selected by the toolbar affects what happens when a user taps/clicks/drags within the workspace visualization.

"Selector" mode description:

-   Allows users to click select objects (robot, goal regions, obstacles, cost regions).

-   **Selection Behavior:** Selecting an object switches the Left Control Panel to the "Properties" view for that object type.

-   **Real-time Updates:** Dragging or resizing an object in the workspace automatically updates the coordinate/dimension values in the Context-Sensitive Panel. Conversely, typing values into the panel updates the object in the workspace immediately.

-   Clicking on the background unselects selected objects and returns the Control Panel to the Standard View.

-   Clicking and dragging on the background allows selecting all objects within the dragged rectangle.

-   Dragging selected objects moves them.

-   When a single object is selected, dragging the corners/edges resizes the object.

-   Double-clicking on a polygon switches to a sub-mode that allows the user to drag individual points of the polygon to reshape it. (Clicking outside the polygon leaves this sub-mode).

-   Pressing "delete" or "backspace" when objects are selected removes the objects (with the exception of the robot, which cannot be deleted). If the last goal region is deleted, the default goal region for the scenario is automatically added back (there must be at least one goal region).

"Draw Rectangle" modes (same interfaces for obstacle, cost, and goal region, only difference is what it produces):

-   Clicking starts drawing a rectangle from a corner. Dragging sets the other corner.

-   Holding shift while dragging forces a 1:1 ratio (thus a square).

-   If the user draws a rectangle without dimension, it is not added.

"Draw Circle" modes (same interfaces for obstacle, cost, and goal region, only difference is what it produces):

-   Clicking starts drawing a circle/ellipse from a corner. Dragging sets the other corner.

-   Holding shift while dragging forces a 1:1 ratio (thus a circle).

-   If the user draws a circle/ellipse without dimension, it is not added.

"Draw Polygon" modes (same interfaces for obstacle, cost, and goal region, only difference is what it produces):

-   Clicking starts drawing a polygon. It places a vertex at the clicked point, and then an edge connects it to the mouse.

-   While drawing a polygon, each click adds the next vertex.

-   While drawing a polygon, clicking on the starting vertex ends the draw operation and adds the polygon.

-   While drawing a polygon, double-clicking adds a point at the double-clicked location and closes the polygon by connecting the last point to the first, then adds the polygon.

-   While drawing, holding shift restricts the added point to create a multiple of a 15-degree angle from the previous point.

-   Polygons with zero area are not added (e.g., points, lines, degeneracies).

The "clear graph" button clears all state generated by the motion planner and updates the view to represent that (i.e., removes the graph and solution from the display). It does not change the scenario (robot, goal(s)s, obstacle(s) remain unchanged).

Any obstacle added or modified results in an update to the graph and solution:

-   Graph edges and vertices that are now in collision are removed. For trees, this operation cascades to remove all nodes in the tree that are no longer reachable due to the removed parents/ancestors.

-   When graph edges and vertices are removed, the solution is recomputed and redrawn (if there is a solution). Rejected nodes and edges that connect to removed vertices are also removed.

-   Other UI elements are similarly updated (e.g., graph edge and node counts, path length, etc.)

Moving the robot attempts to reconnect it to the graph and recompute a solution.

-   Graph nodes and edges that are no longer reachable are removed from the graph.

-   Rejected nodes and edges that connect to the removed elements of the graph are also removed.

-   Once the drag/move is complete (i.e., not during dragging), the planner "reconnects" the robot to the graph (see "Reconnection Strategy" for each planner below).

Moving or updating the goal region recomputes the solution, and possibly updates the graph. This happens after the goal region update is complete (i.e., not during dragging). See "Goal Update Strategy" for each planner below.

### Information Bar

The information bar appears below the workspace visualization. This bar includes information about the current progress of the motion planner and graph. It contains the following information from left to right:

-   "Nodes: # (#)", where the first "#" is the number of nodes in the graph(s), displayed in bold. The second "(#)" is the number of nodes evaluated/sampled.

-   "Edges: # (#)", where the first "#" is the number of edges in the graph(s), displayed in bold. The second "(#)" is the number of edges evaluated/sampled.

-   "Path: # m (# segments)", shows the computed path length in meters and the number of segments in the path. When there is no solution, this shows as "N/A".

Technical Specification
-----------------------

### Architecture

The top-level architectural decisions for the implementation are:

-   **Visualization Engine:** The workspace visualization uses SVG. This is preferred for its ability to export to other formats and scale arbitrarily. Performance will be managed by using efficient DOM manipulation (e.g., appending/removing elements) rather than full re-renders, relying on the browser's optimized rendering pipeline to handle the graph complexity.

-   **Event-Driven Communication:** The application follows the Observer Pattern. The Model (Graph, Planner) emits events (e.g., `NODE_ADDED`, `SOLUTION_FOUND`). The View registers as a listener to these events. This decouples the algorithm logic from the UI rendering.

-   **Coordinate Systems:**

    -   **Model Layer:** Uses standard Cartesian coordinates with the origin `(0,0)` at the **bottom-left**. Positive Y is up. This simplifies the math for planners and robot kinematics. The workspace is defined as **10m x 10m**.

    -   **View Layer:** Handles the transformation to SVG coordinates (origin `(0,0)` at the **top-left**, positive Y is down) during rendering. The SVG viewbox is typically `0 0 1000 1000`.

    -   **Scale Factor:** 1 meter = 100 pixels (or view units).

-   **Modular Code Structure:** The application will be split into modular files to handle complexity. Specifically, robot kinematics (e.g., `dubins.js`, `reeds_shepp.js`) will be separated from the core application logic to maintain readability and separation of concerns.

-   **Libraries:**

    -   The application makes use of CDNs for third-party libraries.

    -   `sat.js` (Separating Axis Theorem) will be used for collision detection of polygons and oriented rectangles, provided it remains lightweight and does not introduce significant bloat.

    -   Standard browser interfaces are used where possible.

-   **Pattern:** The application makes uses of MVC (Model-View-Controller) architecture.

-   **State Management:** The Model is the core of the application as it defines all shared state represented by the interface. After the controller updates the model, it notifies view elements to update their presentation.

### Data Structures

To support efficient MVC separation and shared logic across planners, the application uses the following internal data structures.

**Graph Class (Shared)**

-   A single `Graph` class is used by all planners (PRM, RRT, RRT\*).

-   For RRT-Connect, two instances of this class are used (`graphForward`, `graphReverse`).

-   **Storage:**

    -   `nodes`: `Map<number, Node>` - Key is `node.id`.

    -   `edges`: `Map<number, Edge>` - Key is `edge.id`.

    -   `listeners`: `Map<string, Function[]>` - Event registry.

    -   `nodeIdCounter`: Integer (Auto-incrementing).

    -   `edgeIdCounter`: Integer (Auto-incrementing).

-   **Event System:**

    -   `addEventListener(eventType, callback)`: Registers a listener.

    -   **Events Emitted:**

        -   `'NODE_ADDED'`: Payload `{ node }`.

        -   `'EDGE_ADDED'`: Payload `{ edge }`.

        -   `'EDGE_REMOVED'`: Payload `{ edgeId }`.

        -   `'CLEAR'`: Payload `{}`.

-   **Operations:**

    -   `addNode(config)`: Creates a node, assigns ID, adds to Map, **emits 'NODE\_ADDED'**.

    -   `addEdge(sourceId, targetId, cost)`: Creates edge, assigns ID, updates adjacency lists, adds to Map, **emits 'EDGE\_ADDED'**.

    -   `removeEdge(edgeId)`: Removes from Map, updates adjacency lists, **emits 'EDGE\_REMOVED'**.

    -   `removeNode(nodeId)`: First calls `removeEdge` for all connected edges, then removes node from Map.

    -   `clear()`: Resets the graph. **Emits 'CLEAR'**.

    -   `getNeighbors(nodeId)`: Returns array of connected Node objects (O(1) via adjacency list).

-   **Helper Methods (Algorithm Support):**

    -   `getNearestNode(targetConfig, robot)`: Iterates through all nodes to find the one with the lowest distance (as defined by `robot.distance(configA, configB)`) to the target. Returns `{ node, distance }`.

    -   `getNodesWithinDistance(targetConfig, radius, robot)`: Returns an array of nodes within a specific radius (used for RRT\* rewiring and PRM connection).

    -   `getPathToRoot(nodeId)`: Backtracks using `node.parentId` from the given node up to the root. Returns an array of Nodes representing the path (used for solution extraction in tree planners).

**Node Object**

-   `id`: Integer (Unique identifier).

-   `config`: Object `{x, y, theta}`.

-   `parentId`: Integer (Optional, used for tree-based planners like RRT to track ancestry).

-   `cost`: Float (Optional, cost-from-root).

-   `outgoingEdges`: `Set<number>` (Set of Edge IDs where this node is source).

-   `incomingEdges`: `Set<number>` (Set of Edge IDs where this node is target).

**Edge Object**

-   `id`: Integer (Unique identifier).

-   `sourceId`: Integer (ID of the start node).

-   `targetId`: Integer (ID of the end node).

-   `cost`: Float (The cost/distance of this specific edge).

-   **Note:** The geometric path (e.g., arc points) is **not** stored here. The View layer generates the SVG path string on-demand using the Robot class methods when the edge is added to the DOM.

**Rewiring Strategy (RRT*)*\*

-   Rewiring is implemented as **Edge Deletion** followed by **Edge Addition**.

-   This strategy ensures the View layer correctly triggers the "new edge" highlight animation (Blue/Indigo fade) for the rewired connection.

### Implementation & File Structure

The application follows a modular structure using **Native ES Modules**. This allows strict separation of concerns without requiring a complex build step (like Webpack).

**File Organization:**

-   **Root:**

    -   `index.html`: Entry point. Defines the DOM structure and loads the module entry point.

    -   `styles.css`: Centralized styling for UI panels and SVG elements.

    -   `tests.html`: Browser-based test runner (Mocha/Chai).

-   **`/js` (Source):**

    -   `main.js`: Bootstrapper. Initializes the Controller and binds UI events.

-   **`/js/core` (Model):**

    -   `graph.js`: `Graph`, `Node`, `Edge` classes with Event Emitter logic.

    -   `sampling.js`: Sampling strategies (Uniform, Halton, Grid).

-   **`/js/robots` (Kinematics):**

    -   `robot_base.js`: Interface definition.

    -   `holonomic2d.js`, `dubins.js`, `reeds_shepp.js`, `diff_drive.js`: Concrete implementations.

-   **`/js/planners` (Algorithms):**

    -   `planner_base.js`: Interface definition.

    -   `rrt.js`, `rrt_star.js`, `rrt_connect.js`, `prm.js`: Concrete implementations.

-   **`/js/view` (View):**

    -   `renderer.js`: SVG management. Listens to Graph events to draw/update visual elements.

    -   `ui.js`: Manages Control Panel state, Context-Sensitive panels, and Toolbar interactions.

-   **`/js/controller` (Controller):**

    -   `simulation.js`: Manages the `requestAnimationFrame` loop, time budgeting, and speed control.

-   **`/js/utils` (Helpers):**

    -   `collision.js`: SAT collision detection logic.

    -   `geometry.js`: geometric helpers.

**Testing Strategy:**

To ensure reliability without a heavy build pipeline, the project uses **Browser-Based Testing**.

-   **Framework:** Mocha (Runner) + Chai (Assertions) loaded via CDN in `tests.html`.

-   **Structure:** Tests are located in a `/tests` directory, mirroring the `/js` structure (e.g., `/tests/robots/dubins.test.js`).

-   **Testability Requirements:**

    -   **Dependency Injection:** Planners must accept `Robot` and `Graph` instances via constructor to allow mocking.

    -   **Seeded Randomness:** The `sampling.js` module must support seeded RNG to ensure planner tests are deterministic and reproducible.

    -   **Headless Capability:** Core logic (Planners, Robots, Graph) must not reference the DOM or `window` directly, ensuring they can be tested in isolation from the View.

### Controller & Simulation Loop

To manage the execution flow, speed control, and UI responsiveness, the application uses a dedicated **Controller** class implementing a "Game Loop" pattern via `requestAnimationFrame`.

**Class: `SimulationController`**

-   **State:**

    -   `isRunning`: Boolean.

    -   `speed`: Integer (Target Steps Per Second).

    -   `lastFrameTime`: Timestamp.

    -   `pendingSteps`: Float (Accumulator for fractional steps at slow speeds).

-   **The Loop (`tick(timestamp)`):**

    -   Called via `requestAnimationFrame`.

    -   Calculates `deltaTime` (time since last frame).

    -   **Slow Speed Handling (< 60 SPS):** Accumulates `deltaTime`. If enough time has passed for 1 step, execute `planner.step()`.

    -   **Fast Speed Handling (> 60 SPS):**

        -   Calculates `stepsToRun = speed * deltaTime`.

        -   **Time Budgeting:** Executes `planner.step()` in a `while` loop.

        -   **Safety Valve:** The loop checks `performance.now()` after every few steps. If execution time exceeds **12ms** (leaving ~4ms for browser rendering to maintain 60fps), the loop aborts early for this frame, even if `stepsToRun` isn't finished.

    -   **View Batching:** To avoid layout thrashing, DOM updates triggered by the Graph events should be batched and applied *after* the calculation loop finishes, but before the function returns.

-   **Control Methods:**

    -   `play()`: Starts the loop.

    -   `pause()`: Cancels the rAF loop.

    -   `step(count)`: Manually executes `count` iterations immediately (bypassing the loop). Used for the "+1", "+10" buttons.

    -   `setSpeed(sps)`: Updates the target steps-per-second.

### Scenarios

All scenarios take place on a 10m x 10m workspace. The origin is at the lower-left. The coordinate (10,10) is at the upper-right. (Note: this may differ from the underlying SVG representation.)

The scenarios are:

-   **Empty**: There are no obstacles. The robot starts at the upper left and the goal region (a circle) is in the lower right.

-   **Center Obstacle**: This is the default selection. There is one circular obstacle in the center of the workspace. The robot starts on the left. The goal is on the right.

-   **Narrow Corridor**: There is pair of rectangular obstacles that make it so there is a single narrow corridor between the robot and goal. The robot is on the left. The goal is on the right.

-   **Simple Maze**: The robot starts on the upper left. The goal region is on the lower right. Three rectangular obstacles form a crude "W" of freespace that the robot must navigate.

-   **Complex Maze**: This uses an automated 2D random maze generator to create an obstacle environment. The robot starts at the upper left. The goal is in the lower right. The maze is built on a 10x10 grid.

-   **Cavern**: The robot starts on the left. The goal is on the right. The walls are irregular polygons. There are random obstacles placed (representing boulders and stalactites) making a straight-line solutions impossible.

### Robot Types

There are 5 robot types:

**2D Holonomic**

-   These robots are discs (non-point) thus have a radius. The radius is defined by resizing the robot in the workspace.

**Dubins Cars**

-   **Parameter:** "Steering Radius" (Minimum turning radius).

-   These robots are rectangles. The size of the robot is configurable by resizing the robot in the workspace.

**Reeds-Shepp Cars**

-   **Parameter:** "Steering Radius" (Minimum turning radius).

-   **Parameter:** "Reverse Cost Weight" (Penalty for driving backwards, e.g., 1.0 to 5.0).

-   These robots are rectangles. The size of the robot is configurable by resizing the robot in the workspace.

**Differential Drive (Simple)**

-   **Kinematics:** Uses a simplified "Rotate-Straight-Rotate" strategy. The robot rotates in place to face the target, drives straight, then rotates in place to match the target orientation.

-   These robots are discs (non-point) thus have a radius. The radius is defined by resizing the robot in the workspace.

-   Visualized as a circle with two rectangles indicating wheels.

**Differential Drive (Optimal)**

-   **Kinematics:** Uses Balkcom-Mason curves (Time-Optimal Differential Drive trajectories). These consist of straight lines and turns in place.

-   **Parameter:** "Track Width" (Distance between wheels). Affects the optimal strategy by changing the cost of rotation vs translation.

-   **Visualization:** These curves are composed of line segments and circular arcs, making them compatible with SVG path rendering.

-   These robots are discs (non-point) thus have a radius. The radius is defined by resizing the robot in the workspace.

-   Visualized as a circle with two rectangles indicating wheels.

### Graph

Internally, the program maintains one or more graphs. Most planners have one graph. Planners, such as RRT-Connect may have multiple.

For graph (non-tree) methods, Holonomic, Reeds-Shepp, and Differential drive can use undirected graphs. Dubins cars will require direction. We store the edges with a implicit (or explicit) direction. When operating on an undirected graph, we will ignore the direction. We will store edge costs for each edge. This cost will be based on the path the robot computes (see below)--for example, Euclidian distance for holonomic robots or path-length for Dubins.

Rejected samples are stored in a parallel graph structure.

### Goal Regions

There will be at least one goal region, there may be more. When performing goal-biased sampling, a random goal region is chosen, and then a random sample is selected from that region. For non-rectangular regions, rejection sampling may be effective (sample within the bounding box, then test if the sample is in the region).

### Robot Class

Each robot type has its own "class" with methods for:

-   sample generation

-   steered path generation

-   configuration collision checking

-   link/edge collision checking

-   distance calculation

-   cost calculation

-   geometry property (collision shape definition)

The **sample generation** method generates a configuration sample appropriate for the robot and workspace.

-   It accepts a `strategy` argument (Random, Halton, Grid) and an optional `sequenceIndex` (for deterministic sequences like Halton).

-   For holonomic robots, it generates an `(x,y)` value.

-   For cars/differential drive, it generates an `(x,y,theta)` value.

-   This abstraction allows comparing how different sampling strategies affect graph coverage for different kinematic models.

The **steered path generation** method returns a representation of the path from a start configuration to an end configuration. It takes arguments, `startConfig`, `targetConfig`, `stepSize`, and `reverse`. The `stepSize` is value of the parameter from the planner that determines the maximum length that the path may traverse. The `stepSize` may be `inf` is the planner doesn't include a step size. If `reverse` is true, that means the caller is building a graph from goal to start, and thus the computation must be appropriately adjusted to consider computing a reverse version of the path. In either case, the path must include `startConfig` but may run short of `targetConfig` due to the `stepSize` limit. (For example, with a Dubins car, if reverse is true, the computation could compute the Dubins path from start to target with both thetas rotated 180 degrees, then unrotated to return the proper path). The return value for this method is a robot-specific path type. The return value also includes an end configuration and path cost so that the end configuation can be added as a node in the graph, and the weight can be stored in the edge for path cost computations. Note: the actual robot-specific path type is only really needed for two things: the `isValidLink` method below, and converting to an SVG path.

The method `isValidConfig(config)` takes a configuration as an argument, thus `(x,y)` for holonomic robots, and `(x,y,theta)` for cars and differential drive.

-   **Implementation:** Uses **SAT (Separating Axis Theorem)** to check for overlap between the robot's collision shape (defined in the `geometry` property) and the workspace obstacles.

The `isValidLink(path)` take an argument that represents the path a robot takes (the same type as returned by the steered path generation). When an analytic method does not exist (or is difficult to implement), the `isValidLink` method densely samples along the path, calling `isValidConfig` for each point. The `isValidLink` method makes use of the global setup information to determine which path to follow.

-   **Implementation:** Uses **Discrete Sampling** of the swept volume along the path.

**Distance vs. Cost:**

-   `distance(q1, q2)`: Returns the **Geometric Distance** (or time-optimal metric without terrain). Used by Nearest Neighbor search.

-   `cost(q1, q2)`: Returns the **Path Integral** (Geometric Distance \* Terrain Multipliers). Used for storing edge weights and optimization logic.

    -   **Implementation:** Discrete integration. The method steps along the path (e.g., every 0.1m) and sums `step_distance * cost_at_point`.

These methods use the global setup to understand the robot dimensions and obstacle environment.

### Planner Class Structure

To support the interactive "Step/Pause/Run" workflow, all planners must adhere to a shared interface that treats the algorithm as an iterative state machine rather than a blocking function.

**Interface: `Planner`**

-   **Constructor:** `new Planner(robot, graph)`

    -   `robot`: Instance of the selected Robot class.

    -   `graph`: Instance of the Graph class (managed by the Controller).

-   **Event System:**

    -   `addEventListener(eventType, callback)`: Registers a listener.

    -   **Events Emitted:**

        -   `'SOLUTION_FOUND'`: Payload `{ solution: { path, cost, segments } }`. Fired when a path is first found.

        -   `'SOLUTION_UPDATED'`: Payload `{ solution }`. Fired when RRT\* improves the path cost.

        -   `'STEP_COMPLETE'`: Payload `{}`. Fired at the end of a step (useful for statistics updates).

-   **Core Methods:**

    -   `initialize(startConfig, goalRegions, obstacles)`: Resets internal state (e.g., clears Best Cost for RRT\*, resets random seeds if deterministic). Note: It does *not* clear the Graph; the Controller handles graph clearing. This method sets up the initial Root Node(s).

    -   `step()`: **The most critical method.** Executes exactly **one iteration** of the algorithm.

        -   *Logic:* Generates one sample, attempts steering/connection, calls `graph.addNode/addEdge`.

        -   *Return:* `void`. All feedback is handled via Graph and Planner events.

    -   `updateParameters(params)`: Accepts an object of tunable values (e.g., `{ stepSize: 0.5, goalBias: 0.1 }`) to allow real-time parameter tuning without resetting the graph.

-   **Event Handling (Interactive Updates):**

    -   `reconnect(newStartConfig)`: Called when the user drags the Robot.

        -   *Behavior:* Standard RRTs might prune the tree and re-root. PRM might simply add a new start node and connect to neighbors.

    -   `updateGoals(newGoalRegions)`: Called when the user moves a Goal.

        -   *Behavior:* RRTs might check if existing nodes now fall into the new goal region. RRT-Connect might rebuild the Reverse Tree.

-   **Data Extraction:**

    -   `getSolution()`: Returns the current best path found or `null`.

    -   `getStatistics()`: Returns internal metrics for the Info Bar `{ nodesVisited, edgesEvaluated, successRate }`.

### Planners

The application will have the planners listed in this section. Each planner has a set of tunable parameters. Each planner has a "reconnection strategy" for when the user modifies the workspace and changes the robot location. Each planner has a "goal update strategy" for when the user modifies the workspace to change the goal. (If a user modifies the obstacles, the general strategy is to remove all edges from the graph that are no longer valid, and any part of the graph that is no longer reachable due to that modification.)

-   **Note:** Changing the active **Planner Algorithm** (e.g., switching from RRT to PRM) forces a full graph reset. Changing tunable parameters (e.g., Step Size) does NOT force a reset.

#### PRM

The is a variant of the original Probabilistic Roadmaps algorithm. In the original version, PRM would generate a random graph by generating samples, then connecting edges offline--an online process would search it. In the version we present here, it does the following in each iteration:

1.  generate a random sample

2.  checks the random sample is valid (discarding if not, and placing into the rejected graph, then terminating the iteration)

3.  adds the vertex to the graph

4.  searches for the a set of nearest neighbors

5.  for each nearest neighbor, if the link to the neighbor is valid, it adds an edge.

6.  computes the shortest path from start to goal using Djkstra's algorithm (Note: this is inefficient, but good for explanation)

Tunable parameters:

-   **Connection Radius:** The maximum distance to look for neighbors.

-   **Max Neighbors (k):** The maximum number of neighbors to connect to (even if more are within the radius).

**Reconnection Strategy:** When the user move the robot, treat the robot's new state as a new sample and connect it to the graph using the graph's connection strategy.

**Goal Update Strategy:** Searches the set of nodes nearest to the new goal region, connects edges if they are valid.

#### RRT

This is the classic Rapidly-exploring Randomized Trees algorithm. It generates a random sample, finds the nearest neighbor in the existing tree, steers the robot from the nearest neighbor to the new sample (up to maximum step size away), rejects the sample if in collision, rejects the sample if the edge from the nearest node to the new sample is invalid, and adds the sample as a node and edge if valid. With some tunable probability, the random sample will be from a goal region.

Tunable parameters:

-   **Maximum Step Size:** The maximum distance the robot can move in one iteration.

-   **Goal-Biased Sampling Rate:** The probability (0-100%) that the random sample is the goal instead of a random point.

**Reconnection Strategy:** When the user move the robot, given the new robot start state, search through the nodes for a reachable one, and of the reachable nodes, select the one with lowest cost, then add an edge from the robot's new start state. This operation is likely to remove much of the tree.

**Goal Update Strategy:** The tree is left intact. Any goal nodes that are no longer in the goal region are now no longer considered goals. Any nodes in the updated goal region are now considered goals. The shortest path is updated to the shortest path to goal. Note: this update may result in no solution path.

#### RRT\*

This is the asymptotically-optimal version of RRT. It operates like RRT, except, after ever node it adds, it looks in a small neighborhood to rewire the graph to lower costs. Importantly, it first checks within the neighborhood of the new random sample (after steering), to see if it would have a shorter path through a different parent in that neighborhood--and sets the parent to that node if it would. It then checks the rest of the neighborhood to see if any neighboring node would have a shorter path through the new node--if it would, it updates the neighboring node's parent to go through the new node. Note: it is important to consider the actual path cost to goal when rewiring the graph and avoid stale costs. Typical implementations will store the path cost in a node, and cascade an update to all children when a parent is rewired. Another possible approach is to recompute the path costs on demand.

Tunable parameters:

-   **Maximum Step Size:** The maximum distance the robot can move in one iteration.

-   **Goal-Biased Sampling Rate:** The probability (0-100%) that the random sample is the goal instead of a random point.

-   **Rewiring Radius:** The radius used to search for neighboring nodes to rewire. Larger values increase optimality but decrease performance.

-   **Informed Sampling (Toggle):** If enabled, and a solution exists, samples are generated within the ellipsoidal region defined by the start, goal, and best path cost. This focuses the search on improving the existing solution.

**Reconnection Strategy:** When the user move the robot, given the new robot start state, search through the nodes for a reachable one, and of the reachable nodes, select the one with lowest cost, then add an edge from the robot's new start state. This operation is likely to remove much of the tree.

**Goal Update Strategy:** The tree is left intact. Any goal nodes that are no longer in the goal region are now no longer considered goals. Any nodes in the updated goal region are now considered goals. The shortest path is updated to the shortest path to goal. Note: this update may result in no solution path.

#### RRT-Connect

This planner operates like RRT how it samples and grows a tree from start to goal ("forward"), but with the addition of building trees from goal to start ("reverse"). This means that every iteration, we generate one sample and attempt to add it to both forward and reverse trees. The planner terminates with a solution when the added sample connects to both trees.

**Connection Logic:**

In each iteration, a single random sample `q_rand` is generated.

1.  Attempt to extend the Forward Tree towards `q_rand`.

2.  Attempt to extend the Reverse Tree towards the *same* `q_rand`.

3.  If both trees successfully add `q_rand` as a node (meaning `q_rand` was within `step_size` and collision-free for both trees' nearest neighbors), then `q_rand` acts as the 'bridge' node connecting the two trees, and a solution is found.

Some important considerations for the "reverse" tree:

-   A goal region is an area--we cannot treat it as a single point.

-   There may be multiple goal regions.

-   Conceptually, we can consider the "reverse" tree as one tree with a shared virtual root (i.e., one without a physical location/configuration). This virtual root has one child node for each goal region. These goal regions are also "virtual" in the sense that they represent any point on the region. Finally, the next level down the tree represents a physical location/configuration. When rendering the reverse tree, we should only include the non-virtual nodes.

-   When considering a sample against the reverse tree, we need to use the reversed dynamics of the robot. This is critical for non-holonomic robots, especially the Dubins car.

-   When computing a path from goal with the reversed dynamics, we need to connect the sample to some configuration in the goal region. Any point will do, but ideally the point is on the boundary of the goal region (since getting to the boundary is sufficient to solve the planning problem, and there is little point in moving into the goal region). In the case the point on the boundary is inside an overlapping goal region, the algorithm should further steer that point to the boundary of the overlapping region. We must be careful to avoid infinite loops with overlapping goal regions having strange interactions with the steering function.

Tunable parameters:

-   **Maximum Step Size:** The maximum distance the robot can move in one iteration.

-   **Greedy Extension (Toggle):** If enabled, the planner attempts to repeat the "extend" step multiple times to reach `q_rand` until collision (Greedy). If disabled, it only steps once (Standard). Greedy is faster but less explorative.

(Note: there is explicitly no goal-biased sampling option)

**Reconnection Strategy:** When the user move the robot, it updates the forward tree in a similar fashion as RRT. The reverse tree is unaffected.

**Goal Update Strategy:** When a goal is updated, the reverse tree is updated in a similar fashion to the RRT. The forward tree is unaffected.