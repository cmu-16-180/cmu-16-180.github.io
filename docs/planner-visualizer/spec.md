# Specification for Robot Motion Planner Visualizer

Overview: this is a specficiation for a interactive web-based educational tool to help students gain an understanding of how graph-based robot motion planners work. It allows the selection of motion planning problems, solvers to use on those problems, and parameters of the solvers, and it allows control over how the motion planner is run.

## Features

* Single-page webapp. All computation is done client-side.
* Uses minimal third-party libraries. The ones it does use come from CDNs.
* Allows multiple 2D robot motion planning scenarios to be selected
* Allows customization of robot motion planning scenarios
* Allows different robot motion profiles: 2D holonomic, Dubins cars, Reed-Shepps cars, and differential drive.
* Users select which planner they want to run, and can customize tunable parameters of the selected planner.
* Has a visualization of the workspace, including robot, goal region, and obstacles.
* The visualization shows the computed graph(s)--edges and nodes, and the solution path, once found.
* The visualization optionally shows additional inner workings of the planners, including sampled, but rejected nodes and edges.
* The visualization shows highlights recent modifications then have them fade into the underlying structure
* The user can select how to run the algorithm--1 or a few steps at a time, or run until solution.
* Information about the graph (number of nodes and edges) and solutions (path length and number of segments) are displayed.

## User Interface

The user interface consists two main components that are further divided into subcomponents:
* Left side: a control panel that lets the user select the scenario, robot, planner, options, execution parameters, and run the planner.
* Right side: a visualization of the problem and planner as it runs. A Toolbar to modify the scenario at the top, and a Information Bar  at the bottom to provided information about the planner's progress, graph size, and solution length (in meters and number of edges/segments).

### Control Panel

The control panel is a vertically organized group of labelled control sections. The sections, in order are:
* Scenario: in this section, there is a:
  * Drop down to select from several predefined named scenarios (detailed below). A scenario includes a set of obstacles, a robot start state, and a goal region. Selecting a scenario stops and resets the planner, clears the graph and solution, and sets the new workspace.
  * A second dropdown changes the robot type (details below). This changes how the robot moves and what planners are available to use.
* Algorithm: in this section, the user selects the algorithm and configures tunable parameters. It contains, in order:
  * A dropdown selecting between the different planners (details below).
  * Slider for step size in meters (when planner supports it)
  * Slider for goal biased sampling percent (when planner supports it)
  * Slider for nearest-neighbor radius in meters (when planner supports it)
  * And so on... (additional planner options follow here, in the same order)
* View Options: In this section, the user can control the workspace view:
  * Checkbox to show rejected nodes and edges (e.g., when a planner rejects a sample based on collision checks)
* Execution
  * A speed setting slider selects the delay between an iteration of the planner.
  * A row of buttons to add "+1", "+10", and "+100" samples. When pressed, the planner adds the specified number of samples to the graph (without pause between sample).
  * A button to run and stop the motion planner. When the planner is not running, the button is green and has a "play" icon on it. When the planner is running, the button is red and has a stop/pause icon on it. When the button is green and the planner has not yet found a solution, it says "Run until solved." When the planner is running, the button says "Runing...". When the planner is stopped and there is a solution, the buttons says "Keep running."

### Workspace Visualization

The workspace visualizer shows obstacles, the robot, the goal region, the current state of the planner (i.e., the graph), and a solution if it exists. 

Obstacles appear with an opaque blue fill and no border. The following obstacle types are supported: circle, rectangle, and polygon.

The robot appears differently depending on its type. Regardless of type it has an opaque red outline and a translucent red fill.
* 2D Holonomic Robots: circle
* Dubins and Reeds Shepps car: rectangle, with the longer dimension indicating the heading direction. It has an arrow overlayed on the rectangle pointing towards front.
* Differential drive: a circle like the 2D holonomic robot, but with two rectangles indicating the wheels of the differential drive.

The goal region appears in green. The border of the region is opaque. The fill of the region is translucent. There may be multiple regions. Regions have the same geometry options as obstacles, namely: circle, rectangle, and polygon.

When the robot has an orientation `theta` (e.g., a Dubins car), the robot and goal regions have an opaque thin arrow pointing in their direction of heading. The arrow appears/disappears depending on robot selection.

The graph the planner that builds appears in gray. The nodes are circles with a larger radius than the edges. The edges are thin and slightly transparent. New and modified nodes and edges on the graph start as bright blue and fade to the normal gray color to help highlight the modifications. The edges on the graph trace the route the robot takes. This means that the holonomic robot has straight lines between edges. The path for cars will have arcs (e.g., representing the Dubin's 6 different possible optimal paths).

For planners such as RRT-Connect that build graphs from goal regions, these graphs are shown similarly to the graph from robot, but the underlying base color is orange.

The program tracks sampled by rejected nodes and edges. These are displayed in red.

The solution path shows in a green matching the color of the goal region border, and is overlayed on top of the graph.

The workspace is square (1:1 aspect ratio) and scales to fill the center region of the workspace area, without clipping or scrolling.

The visualization is built in layers, so that lower layers are covered by content from higher layers. The layers from lowest to highest:
* Goal regions (since goal regions in obstacle are not valid)
* Planning graph 
* Obstacles
* Rejected nodes and edges
* Solution path
* Robot

When a planner is running, the visualization updates are synchronized with the algorithm iterations (i.e., transient updates to the graph, if present, do not show up).

### Toolbar

The toolbar contains the following controls flushed left:
* Selector/pointer: the default. When selected, "selector" mode is enabled.
* (separator)
* Rectangle (in light blue): When selected, "draw rectangle obstacle" mode is enabled.
* Circle (in light blue): When selected, "draw circle obstacle" mode is enabled.
* Polygon (in light blue): When enabled, "draw polygon obstacle" mode is enabled.
* (separator)
* Rectangle (in light green): When selected, "draw rectangle goal" mode is enabled.
* Circle (in light green): When selected, "draw circle goal" mode is enabled.
* Polygon (in light green): When enabled, "draw polygon goal" mode is enabled.

The toolbar has the following buttons flushed right:
* "Clear Graph" button

The mode selected by the toolbar affects what happens when a user taps/clicks/drags within the workspace visualization.

"Selector" mode description:
* Allows users to click select objects (robot, goal regions, obstacles).
* Clicking on an object with the OS-appropriate modifier (e.g., shift, ctrl) allows selecting/unselecting additional objects.
* Clicking on the background unselects selected objects.
* Clicking and dragging on the background allows selecting all objects within the dragged rectangle.
* Dragging selected objects moves them.
* When a single object is selected, dragging the corners/edges resizes the object.
* Double-clicking on a polygon switches to a sub-mode that allows the user to drag individual points of the polygon to reshape it. (Clicking outside the polygon leaves this sub-mode).
* Pressing "delete" or "backspace" when objects are selected removes the objects (with the exception of the robot, which cannot be deleted). If the last goal region is deleted, the default goal region for the scenario is automatically added back (there must be at least one goal region).
* Selecting a robot that has an orientation (e.g., Dubins Cars) displays an orientation selector as a dot that extends from a line from the robot's center. Dragging this dot changes the robot's initial orientation. Holding shift while dragging the dot changes the robot's initial orientation in 15-degree increments. The orientation is display in degrees while the robot is selected, and updated while the user drags and changes the orientation.
* Selecting a goal region when the robot has an orientation (e.g., Dubins car), the interface shows a similar orientation change interface as when selecting a robot. Changing the orientation on an obstacle changes only the goal direction, thus the arrow direction within the region, but leave the rotation of the region itself unchanged.

"Draw Rectangle" modes (same interfaces for obstacle and goal region, only difference is what it produces):
* Clicking starts drawing a rectangle from a corner. Dragging sets the other corner.
* Holding shift while dragging forces a 1:1 ratio (thus a square).
* If the user draws a rectangle without dimension, it is not added.

"Draw Circle" modes (same interfaces for obstacle and goal region, only difference is what it produces):
* Clicking starts drawing a circle/ellipse from a corner. Dragging sets the other corner.
* Holding shift while dragging forces a 1:1 ratio (thus a circle).
* If the user draws a circle/ellipse without dimension, it is not added.

"Draw Polygon" modes (same interfaces for obstacle and goal region, only difference is what it produces):
* Clicking starts drawing a polygon. It places a vertex at the clicked point, and then an edge connects it to the mouse.
* While drawing a polygon, each click adds the next vertex.
* While drawing a polygon, clicking on the starting vertex ends the draw operation and adds the polygon.
* While drawing a polygon, double-clicking adds a point at the double-clicked location and closes the polygon by connecting the last point to the first, then adds the polygon.
* While drawing, holding shift restricts the added point to create a multiple of a 15-degree angle from the previous point.
* Polygons with zero area are not added (e.g., points, lines, degeneracies).

The "clear graph" button clears all state generated by the motion planner and updates the view to represent that (i.e., removes the graph and solution from the display). It does not change the scenario (robot, goal(s)s, obstacle(s) remain unchanged).

Any obstacle added or modified results in an update to the graph and solution:
* Graph edges and vertices that are now in collision are removed. For trees, this operation cascades to remove all nodes in the tree that are no longer reachable due to the removed parents/ancestors.
* When graph edges and vertices are removed, the solution is recomputed and redrawn (if there is a solution). Rejected nodes and edges that connect to removed vertices are also removed.
* Other UI elements are similarly updated (e.g., graph edge and node counts, path length, etc.)

Moving the robot attempts to reconnect it to the graph and recompute a solution.
* Graph nodes and edges that are no longer reachable are removed from the graph.
* Rejected nodes and edges that connect to the removed elements of the graph are also removed.
* Once the drag/move is complete (i.e., not during dragging), the planner "reconnects" the robot to the graph (see "Reconnection Strategy" for each planner below).

Moving or updating the goal region recomputes the solution, and possibly updates the graph. This happens after the goal region update is complete (i.e., not during dragging). See "Goal Update Strategy" for each planner below.

### Information Bar

The information bar appears below the workspace visualization. This bar includes information about the current progress of the motion planner and graph. It contains the following information from left to right:
* "Nodes: # (#)", where the first "#" is the number of nodes in the graph(s), displayed in bold. The second "(#)" is the number of nodes evaluated/sampled.
* "Edges: # (#)", where the first "#" is the number of edges in the graph(s), displayed in bold. The second "(#)" is the number of edges evaluated/sampled.
* "Path: # m (# segments)", shows the computed path length in meters and the number of segments in the path. When there is no solution, this shows as "N/A".

## Technical Specification

### Architecture

The top-level architectural decisions for the implementation are:
* The workspace visualization uses SVG.
* The application makes use of CDNs for third-party libraries.
* The application makes uses standard browser interfaces where possible to avoid unnecessary/excessive use of third-party libraries.
* The application makes uses of MVC (Model-View-Controller) architecture.
* The Model is the core of the application as it defines all shared state represented by the interface. After the controller updates the model, it notifies view elements to update their presentation.
* Performance of the workspace visualization is critical--it should be incrementally updated when possible (instead of redrawn from scratch).

### Scenarios

All scenarios take place on a 10m x 10m workspace. The origin is at the lower-left. The coordinate (10,10) is at the upper-right. (Note: this may differ from the underlying SVG representation.)

The scenarios are:
* **Empty**: There are no obstacles. The robot starts at the upper left and the goal region (a circle) is in the lower right.
* **Center Obstacle**: This is the default selection. There is one circular obstacle in the center of the workspace. The robot starts on the left. The goal is on the right.
* **Narrow Corridor**: There is pair of rectangular obstacles that make it so there is a single narrow corridor between the robot and goal. The robot is on the left. The goal is on the right.
* **Simple Maze**: The robot starts on the upper left. The goal region is on the lower right. Three rectangular obstacles form a crude "W" of freespace that the robot must navigate.
* **Complex Maze**: This uses an automated 2D random maze generator to create an obstacle environment. The robot starts at the upper left. The goal is in the lower right. The maze is built on a 10x10 grid.
* **Cavern**: The robot starts on the left. The goal is on the right. The walls are irregular polygons. There are random obstacles placed (representing boulders and stalactites) making a straight-line solutions impossible.

### Robot Types

There are 4 robot types: "2D Holonomic" (default), "Dubins Cars", "Reeds-Shepp Cars", and "Differential Drive."

Goal regions have an orientation. Car robots must reach an (x,y) coordinate within the region, and face the direction of the goal region.

**2D Holonomic**
* These robots are discs (non-point) thus have a radius. The radius is defined by resizing the robot in the workspace.

**Dubins Cars**
* These robots include a "Steering Radius" user-selectable parameter that appears in the control panel under the robot selection.
* These robots are rectangles. The size of the robot is configurable by resizing the robot in the workspace.

**Reeds-Shepp Cars**
* These robots include a "Steering Radius" user-selectable parameter that appears in the control panel under the robot selection.
* These robots are rectangles. The size of the robot is configurable by resizing the robot in the workspace.

**Differential Drive**
* These robots use Balkcom-Mason curves.
* These robots are discs (non-point) thus have a radius. The radius is defined by resizing the robot in the workspace.

### Graph

Internally, the program maintains one or more graphs. Most planners have one graph. Planners, such as RRT-Connect may have multiple.

For graph (non-tree) methods, Holonomic, Reeds-Shepp, and Differential drive can use undirected graphs. Dubins cars will require direction. We store the edges with a implicit (or explicit) direction. When operating on an undirected graph, we will ignore the direction. We will store edge costs for each edge. This cost will be based on the path the robot computes (see below)--for example, Euclidian distance for holonomic robots or path-length for Dubins.

Rejected samples are stored in a parallel graph structure.

### Goal Regions

There will be at least one goal region, there may be more. When performing goal-biased sampling, a random goal region is chosen, and then a random sample is selected from that region. For non-rectangular regions, rejection sampling may be effective (sample within the bounding box, then test if the sample is in the region).

### Robot Class

Each robot type has its own "class" with methods for:
* sample generation
* steered path generation
* configuration collision checking
* link/edge collision checking

The sample generation method returns a random configuration sample appropriate for the robot and workspace. Thus for a holonomic robot, it returns an `(x,y)` value, while cars returns an `(x,y,theta)` value.

The steered path generation method returns a representation of the path from a start configuration to an end configuration. It takes arguments, `startConfig`, `targetConfig`, `stepSize`, and `reverse`. The `stepSize` is value of the parameter from the planner that determines the maximum length that the path may traverse. The `stepSize` may be `inf` is the planner doesn't include a step size. If `reverse` is true, that means the caller is building a graph from goal to start, and thus the computation must be appropriately adjusted to consider computing a reverse version of the path. In either case, the path must include `startConfig` but may run short of `targetConfig` due to the `stepSize` limit. (For example, with a Dubins car, if reverse is true, the computation could compute the Dubins path from start to target with both thetas rotated 180 degrees, then unrotated to return the proper path). The return value for this method is a robot-specific path type. The return value also includes an end configuration and path cost so that the end configuation can be added as a node in the graph, and the weight can be stored in the edge for path cost computations. Note: the actual robot-specific path type is only really needed for two things: the `isValidLink` method below, and converting to an SVG path.

The method `isValidConfig(config)` takes a configuration as an argument, thus `(x,y)` for holonomic robots, and `(x,y,theta)` for cars and differential drive.

The `isValidLink(path)` take an argument that represents the path a robot takes (the same type as returned by the steered path generation). When an analytic method does not exist (or is difficult to implement), the `isValidLink` method densely samples along the path, calling `isValidConfig` for each point. The `isValidLink` method makes use of the global setup information to determine which path to follow.

These methods use the global setup to understand the robot dimensions and obstacle environment.

### Planners

The application will have the planners listed in this section. Each planner has a set of tunable parameters. Each planner has a "reconnection strategy" for when the user modifies the workspace and changes the robot location. Each planner has a "goal update strategy" for when the user modifies the workspace to change the goal. (If a user modifies the obstacles, the general strategy is to remove all edges from the graph that are no longer valid, and any part of the graph that is no longer reachable due to that modification.)

#### PRM

The is a variant of the original Probabilistic Roadmaps algorithm. In the original version, PRM would generate a random graph by generating samples, then connecting edges offline--an online process would search it. In the version we present here, it does the following in each iteration:
1. generate a random sample
2. checks the random sample is valid (discarding if not, and placing into the rejected graph, then terminating the iteration)
3. adds the vertex to the graph
4. searches for the a set of nearest neighbors
5. for each nearest neighbor, if the link to the neighbor is valid, it adds an edge.
6. computes the shortest path from start to goal using Djkstra's algorithm (Note: this is inefficient, but good for explanation)

Tunable parameters:
* nearest neighbor size

**Reconnection Strategy:** When the user move the robot, treat the robot's new state as a new sample and connect it to the graph using the graph's connection strategy.

**Goal Update Strategy:** Searches the set of nodes nearest to the new goal region, connects edges if they are valid.

#### RRT

This is the classic Rapidly-exploring Randomized Trees algorithm. It generates a random sample, finds the nearest neighbor in the existing tree, steers the robot from the nearest neighbor to the new sample (up to maximum step size away), rejects the sample if in collision, rejects the sample if the edge from the nearest node to the new sample is invalid, and adds the sample as a node and edge if valid. With some tunable probability, the random sample will be from a goal region.

Tunable parameters:
* maximum step size
* goal-biased sampling rate

**Reconnection Strategy:** When the user move the robot, given the new robot start state, search through the nodes for a reachable one, and of the reachable nodes, select the one with lowest cost, then add an edge from the robot's new start state. This operation is likely to remove much of the tree.

**Goal Update Strategy:** The tree is left intact. Any goal nodes that are no longer in the goal region are now no longer considered goals. Any nodes in the updated goal region are now considered goals. The shortest path is updated to the shortest path to goal. Note: this update may result in no solution path.

#### RRT*

This is the asymptotically-optimal version of RRT. It operates like RRT, except, after ever node it adds, it looks in a small neighborhood to rewire the graph to lower costs. Importantly, it first checks within the neighborhood of the new random sample (after steering), to see if it would have a shorter path through a different parent in that neighborhood--and sets the parent to that node if it would. It then checks the rest of the neighborhood to see if any neighboring node would have a shorter path through the new node--if it would, it updates the neighboring node's parent to go through the new node.  Note: it is important to consider the actual path cost to goal when rewiring the graph and avoid stale costs. Typical implementations will store the path cost in a node, and cascade an update to all children when a parent is rewired. Another possible approach is to recompute the path costs on demand.

Tunable parameters:
* maximum step size
* goal-biased sampling rate

**Reconnection Strategy:** When the user move the robot, given the new robot start state, search through the nodes for a reachable one, and of the reachable nodes, select the one with lowest cost, then add an edge from the robot's new start state. This operation is likely to remove much of the tree.

**Goal Update Strategy:** The tree is left intact. Any goal nodes that are no longer in the goal region are now no longer considered goals. Any nodes in the updated goal region are now considered goals. The shortest path is updated to the shortest path to goal. Note: this update may result in no solution path.

#### RRT-Connect

This planner operates like RRT how it samples and grows a tree from start to goal ("forward"), but with the addition of building trees from goal to start ("reverse"). This means that every iteration, we generate one sample and attempt to add it to both forward and reverse trees. The planner terminates with a solution when the added sample connects to both trees.

Some important considerations for the "reverse" tree:
* A goal region is an area--we cannot treat it as a single point.
* There may be multiple goal regions.
* Conceptually, we can consider the "reverse" tree as one tree with a shared virtual root (i.e., one without a physical location/configuration). This virtual root has one child node for each goal region. These goal regions are also "virtual" in the sense that they represent any point on the region. Finally, the next level down the tree represents a physical location/configuration. When rendering the reverse tree, we should only include the non-virtual nodes.
* When considering a sample against the reverse tree, we need to use the reversed dynamics of the robot. This is critical for non-holonomic robots, especially the Dubins car.
* When computing a path from goal with the reversed dynamics, we need to connect the sample to some configuration in the goal region. Any point will do, but ideally the point is on the boundary of the goal region (since getting to the boundary is sufficient to solve the planning problem, and there is little point in moving into the goal region). In the case the point on the boundary is inside an overlapping goal region, the algorithm should further steer that point to the boundary of the overlapping region. We must be careful to avoid infinite loops with overlapping goal regions having strange interactions with the steering function.

Tunable parameters:
* maximum step size

(Note: there is explicitly no goal-biased sampling option)

**Reconnection Strategy:** When the user move the robot, it updates the forward tree in a similar fashion as RRT. The reverse tree is unaffected.

**Goal Update Strategy:** When a goal is updated, the reverse tree is updated in a similar fashion to the RRT. The forward tree is unaffected.

