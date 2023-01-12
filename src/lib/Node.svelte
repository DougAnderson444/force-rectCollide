<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { grabable } from '$lib/directives';
	import PushPin from '$lib/svg/PushPin.svelte';
	import Trash from '$lib/svg/Trash.svelte';
	import { resizable } from '@douganderson444/svelte-resizable';
	import CustomResizer from './CustomResizer.svelte';

	export let nodes;
	export let node;

	const dispatch = createEventDispatcher();

	let offsetWidth;
	let offsetHeight;

	// Update nodes on resize
	$: if (offsetWidth && offsetWidth !== node.width) {
		node.width = offsetWidth;
		nodes = nodes;
	}
	$: if (offsetHeight && offsetHeight !== node.height) {
		node.height = offsetHeight;
		nodes = nodes;
	}

	function handleMove(event) {
		nodes = nodes;
		dispatch('move', '');
	}
</script>

<div
	use:grabable={{ nodeData: node }}
	use:resizable={{ show: true, Resizer: CustomResizer }}
	on:move={handleMove}
	on:end={handleMove}
	bind:offsetWidth
	bind:offsetHeight
	class="node"
	style="
                position: absolute;
				user-select: none;
				box-shadow: 10px 5px 5px black;
                background-color: {node.fill};
                width: {node.width}px;
                height: {node.height}px;
                left: {node.x}px;
                top: {node.y}px;
				--tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
				--tw-ring-offset-shadow: 0 0 #0000;
				--tw-ring-shadow: 0 0 #0000;
				--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
				box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
				"
>
	<button
		data-gripper
		data-no-pan
		style:color={node.pinned ? 'black' : 'white'}
		style:background-color={'transparent'}
		style:border={'none'}
		on:click={() => {
			// toggle pin and set nodex.fx and node.fy to null if not pinned, and node.x/y if pinned
			node.pinned = !node.pinned;
			node.fx = node.pinned ? node.x : null;
			node.fy = node.pinned ? node.y : null;
		}}
		style="
					--shadowColor: #000000cf;
					--widthPin: 1.25em;
					filter: drop-shadow(0 0.9em 0.5em var(--shadowColor));
					width: var(--widthPin);
					height:auto;
					position: absolute;
					top:-1em;
					right: calc({node.width / 2}px - var(--widthPin) / 2);
					margin:0em;
					padding:0em;
					z-index:10;
					"
	>
		<PushPin />
	</button>

	<button
		data-gripper
		data-no-pan
		style:color={'red'}
		style:background-color={'transparent'}
		style:border={'none'}
		on:click={() => {
			// delete node from nodes
			dispatch('deleting', node.id);
			nodes = nodes.filter((n) => n.id !== node.id);
		}}
		style="--shadowColor: #000000cf;
					--widthPin: 1em;
					filter: drop-shadow(0 12px 0.65em var(--shadowColor));
					width: var(--widthPin);
					height:auto;
					position: absolute;
					top:-0.5em;
					right: -0.5em;
					margin:0em;
					padding:0em;
					"
	>
		<Trash />
	</button>
</div>
