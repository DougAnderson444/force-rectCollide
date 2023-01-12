<script>
	export let handle;
	export let trigger;
	export let show; // boolean toggle whether to show the resizer handle or not
	$: if (handle) trigger(handle); // let the directive know what/where the resize handle is
</script>

{#if show}
	<div class="resizer" bind:this={handle} />
{/if}

<style>
	.resizer {
		user-select: none;
		width: 0;
		height: 0;
		position: absolute;
		right: 0;
		bottom: 0;
		cursor: se-resize;
		transform-origin: 0 0;
	}
	.resizer::after {
		--width: 4em;
		--line-width: 0.5em;

		content: '';
		position: absolute;
		--margin: 1em;
		margin-right: var(--margin);
		margin-bottom: var(--margin);
		right: calc(-1 * var(--line-width) / 2);
		bottom: calc(-1 * var(--line-width) / 2);
		width: calc(var(--width) / 2);
		height: calc(var(--width) / 2);
		border-right: var(--line-width) solid #e197119e;
		border-bottom: var(--line-width) solid #e197119e;
		transform: translate(var(--margin), var(--margin));
		transform-origin: 0 0;
	}
</style>
