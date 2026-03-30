## Questions

* What color palette should we use?
* Are there parameters we should consider for the differential drive robot (similar to steering radius for the cars)?
* How should we store and represent the graph(s) internally? I'd like to have one graph structure shared by all planners. This will make the MVC approach effective and also reduce the amount of coding we need. When building graphs, they are append only. Workspace operations that change the environment require the graph to be rebuilt--these operations could be implemented as effectively a full rebuild of the graph instead of incremental removal. Note: RRT* does rewire the graph, but this does not change the number of elements, it simply changes the vertices to which an edge is connected (thus edge start and end should be modifable). This is a case where I'd like to specify the implementation in the technical section of the specficiation.
* When building the graph, especially for non-holonomic robots, do we want to store the computed path between vertices in the edge? Or would it just be sufficient to recompute the path between vertices on demand. We should only need to recompute paths when updating the SVG view. If we update the SVG view when we add the edge to the graph, then we could use the path without recomputation (though we do need to convert the internal robot-specific path generation to SVG paths). That would mean that we'd only need to recompute paths when updating the solution path view.
* Are there tunable parameters we should consider adding to these planners? This is an educational tool, so we should consider showing tunable parameters that help students understand the inner workings and overall behavior.
* Can we add Halton sequence sampling (and other sequences)? These might have to be limited to holonomic robots?
* Can we consider (implicit) grid-based algorithms, such as "A\*", "Djikstras", "D\*Lite"? (These too might be limited to a subset of robots)
* Can we consider adding lattice planners?
* Are there notable planners, or variations on planners, that we should consider as well? 
* Can we add a costmap to the graph?

* Interaction between motion planner and interface. setTimeout, setInterval, threads.

* How should we architect the implementation? We have ideas for some javascript files to produce. Now that the spec is near complete, let's list these out.
