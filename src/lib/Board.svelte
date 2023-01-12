<script>
	// @ts-nocheck

	import { onMount, tick } from 'svelte';
	import * as d3 from 'd3';
	import * as config from '$lib/config.js';
	import { boxForce, rectRepel } from '$lib/modifiers';
	import { nanoid } from 'nanoid/non-secure';
	import Group from './Group.svelte';
	import Plus from './svg/Plus.svelte';

	let nodes;
	let simulation;
	let numNodes = 8;
	let alphaDecay = 0.1; // 0.005 ~ 378 iterations, 0.05 ~ 35 iterations
	let alphaMin = 0.21;
	let snap = false;
	let grid = 100;
	let margin = { left: 0, right: 0, top: 0, bottom: 0 };
	let width = 800 - margin.right - margin.left;
	let height = 600 - margin.top - margin.bottom;
	let i = 0;
	let nodesAdded = 0;
	let adding = false;

	// https://github.com/d3/d3-scale-chromatic
	let color = d3.scaleOrdinal().range(d3.schemeSet1);

	onMount(async () => {
		nodes = d3.range(numNodes).map((i) => {
			if (i == 0) return addNode({ i, width: 100, height: 100, x: 0, y: 0, vx: -5, vy: -5 });
			let w = Math.random() * 50 + 100,
				h = Math.random() * 50 + 100,
				velocity = Math.random() * 2 + 150,
				angle = Math.random() * 360,
				vx = -250, // velocity * Math.cos((angle * Math.PI) / 180),
				vy = -250, // velocity * Math.sin((angle * Math.PI) / 180),
				x = snapToGrid(Math.random() * (width - w), grid),
				y = snapToGrid(Math.random() * (height - h), grid);
			return addNode({ i, width: w, height: h, x, y, vx, vy });
		});

		simulate();
	});

	async function handleAddNode() {
		if (adding) return;
		adding = true;
		// set i to random number beterrn 1 and 10
		let rand = Math.random();
		nodes = [
			...nodes,
			addNode({
				i: Math.floor(rand * 10) + 1,
				vx: -250,
				vy: -250,
				x: width,
				y: height,
				width: 140,
				height: 130
			})
		];
		nodesAdded++;
		restartSim().on('end', () => {
			adding = false;
		});
	}

	function addNode(
		{ i, vx, vy, width, height, x, y } = { i: 0, vx: 0, vy: 0, width: 100, height: 100 }
	) {
		return {
			id: nanoid(6),
			x,
			y,
			width,
			height,
			vx: vx || 0,
			vy: vy || 0,
			fill: color(i),
			pinned: false
		};
	}

	// react to grid var changing
	$: if (grid) chgSnap();

	function chgSnap() {
		if (!simulation) return;
		simulation = simulation.stop();

		// if snap is chg, add/remove forceX/Y to the simulation
		if (!snap || !grid) simulation = simulation.force('x', null).force('y', null);
		else if (grid) {
			simulate()
				.force(
					'x',
					d3
						.forceX()
						.x((d) => (Math.round(d.x / grid) * grid).toFixed(1))
						.strength(0.25)
				)
				.force(
					'y',
					d3
						.forceY()
						.y((d) => (Math.round(d.y / grid) * grid).toFixed(1))
						.strength(0.25)
				);
		}
		simulation = simulation.alpha(1).nodes(nodes).restart();
	}

	function simulate() {
		if (simulation) simulation.stop();
		simulation = null;
		simulation = d3
			.forceSimulation(nodes)
			.force('box', boxForce(width, height))
			.force('collision', rectRepel?.strength(1)) // max strength 1.5-ish
			.alpha(1)
			.alphaDecay(alphaDecay)
			.alphaMin(alphaMin) // When alpha reaches alphaMin, the simulation stops
			.on('tick', () => {
				// console.log('tick', i++);
				// refresh Svelte UI
				nodes = nodes;
			})
			.on('end', () => {
				console.log('end');
			});

		return simulation;
	}

	const snapToGrid = (p, r) => Math.round(p / r) * r;

	function restartSim() {
		if (!simulation) return;
		simulation = simulation.stop();
		i = 0;
		simulation = simulation.alpha(1).nodes(nodes).restart(); // alpha decreases over time as the simulation “cools down”.
		return simulation;
	}
</script>

<div style="display: flex; flex-direction: column; align-items: center; margin:1em;">
	<h1>Svelte D3 Rectangular Forces</h1>
	<!-- checkboxes for snap to grid -->
	<div>
		<label for="snap">Snap to grid</label>
		<input type="checkbox" bind:checked={snap} id="snap" on:change={chgSnap} />
	</div>
	<!-- range slider for grid value -->
	<div>
		<label for="grid">Grid ({grid})</label>
		<input type="range" min="10" max="100" step="10" bind:value={grid} id="grid" />
	</div>
</div>

{#if nodes && nodes?.length}
	<div
		class="Frame"
		style:width="{width}px"
		style:height="{height}px"
		style:background-color={config.svgBackgroundColor}
		style:position={'relative'}
	>
		<!-- Key is needed to refresh #each dirctive without duplicates -->
		{#key nodesAdded}
			<Group bind:nodes {restartSim} {width} {height} />
		{/key}

		<!-- Button to add new node with good amount of velocity inwards towards center of canvas -->
		<button
			disabled={adding}
			style="z-index: 50;
				position: absolute; bottom: 10px; right: 10px; border: none;
				user-select: none;
				box-shadow: 10px 5px 5px black;
                background-color: {adding ? 'grey' : '#4daf4a'};
                width: 50px;
                height: 50px;
                --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
				--tw-ring-offset-shadow: 0 0 #0000;
				--tw-ring-shadow: 0 0 #0000;
				--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
				box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
				"
			on:mousedown={handleAddNode}
		>
			<Plus />
		</button>
	</div>
{/if}

<style>
	.Frame {
		display: inline-block;
		padding: 40px;
		border-width: 20px;
		border-style: solid;
		border-color: #2f2d2d #434040 #4f4c4c #434040;
		box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.6), 0 5px 2px rgba(0, 0, 0, 0.1),
			0 10px 20px rgba(0, 0, 0, 0.8);
	}
</style>
