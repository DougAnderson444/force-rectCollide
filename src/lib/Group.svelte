<script>
	// @ts-nocheck
	import Node from './Node.svelte';
	import { backIn } from 'svelte/easing';

	export let nodes;
	export let restartSim;

	export let width;
	export let height;

	let deleting = false;

	function whoosh(node, params) {
		// compare nodes with prevList, count number of elements that differ
		// if count is more than 1, return null
		// if count is 1, return transition

		if (!deleting) return null;
		deleting = false;

		return {
			delay: params.delay || 0,
			duration: params.duration || 250,
			easing: params.easing || backIn,
			css: (t, u) => `transform: translate(${(u * width) / 2}px, ${u * height}px) scale(${t})`
		};
	}
</script>

{#each nodes as node (node.id)}
	<div out:whoosh>
		<Node bind:nodes {node} on:move={restartSim} on:deleting={(e) => (deleting = true)} />
	</div>
{/each}
