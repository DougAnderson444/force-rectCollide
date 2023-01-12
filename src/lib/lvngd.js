let svgBackgroundColor = '#073b4c';

const margin = { left: 0, right: 0, top: 0, bottom: 0 };
const width = 1100 - margin.right - margin.left;
const height = 1100 - margin.top - margin.bottom;

//size of the container div
d3.select('#chart').style('width', '400px').style('height', '400px');

/* draw the SVG - the viewBox and preserveAspectRatio attributes help make it responsive */
let svg = d3
	.select('#chart')
	.append('div')
	.classed('svg-container', true)
	.append('svg')
	.attr('preserveAspectRatio', 'xMinYMin meet')
	.attr('viewBox', '0 0 1100 1100')
	.classed('svg-content-responsive', true)
	.style('background-color', svgBackgroundColor)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

const numNodes = 20;

let colorList = [
	'#93f5fc',
	'#e69d98',
	'#8fe7d8',
	'#e7a293',
	'#abefff',
	'#fbdea9',
	'#84afde',
	'#dfe0a6',
	'#c7d9ff',
	'#a8b983',
	'#ffd5ee',
	'#abebc6',
	'#b4a6c0',
	'#cce9b3',
	'#95b0ba',
	'#ffcebf',
	'#7cb6ad',
	'#fffcf9',
	'#8cb594',
	'#c0fffe'
];

let color = d3.scaleOrdinal().domain([0, numNodes]).range(colorList);
let nodes = d3.range(numNodes).map(function (i) {
	let w = Math.random() * 50 + 100,
		h = Math.random() * 50 + 100,
		velocity = Math.random() * 2 + 1,
		angle = Math.random() * 360;
	return {
		x: Math.random() * (width - w),
		y: Math.random() * (height - h),
		width: w,
		height: h,
		vx: velocity * Math.cos((angle * Math.PI) / 180),
		vy: velocity * Math.sin((angle * Math.PI) / 180),
		fill: color(i)
	};
});

let rects = svg
	.selectAll('rect')
	.data(nodes)
	.enter()
	.append('rect')
	.style('fill', function (d) {
		return d.fill;
	})
	.attr('width', function (d) {
		return d.width;
	})
	.attr('height', function (d) {
		return d.height;
	})
	.attr('x', function (d) {
		return d.x;
	})
	.attr('y', function (d) {
		return d.y;
	});

let collisionForce = rectCollide().size(function (d) {
	return [d.width, d.height];
});

let boxForce = boundedBox()
	.bounds([
		[0, 0],
		[width, height]
	])
	.size(function (d) {
		return [d.width, d.height];
	});

let simulation = d3
	.forceSimulation()
	.velocityDecay(0.001)
	.alphaTarget(1)
	.force('box', boxForce)
	.force('collision', collisionForce)
	.nodes(nodes);
simulation.on('tick', ticked);

function ticked() {
	rects
		.attr('x', function (d) {
			return d.x;
		})
		.attr('y', function (d) {
			return d.y;
		});
}

function constant(_) {
	return function () {
		return _;
	};
}

function rectCollide() {
	let nodes, sizes, masses;
	let strength = 1;
	let iterations = 1;
	let nodeCenterX;
	let nodeMass;
	let nodeCenterY;

	function force() {
		let node;
		let i = -1;
		while (++i < iterations) {
			iterate();
		}
		function iterate() {
			//let quadtree = d3.quadtree().x(function(d) {return d.x;}).y(function(d) {return d.y;}).addAll(nodes);
			let quadtree = d3.quadtree(nodes, xCenter, yCenter);
			let j = -1;

			while (++j < nodes.length) {
				node = nodes[j];
				nodeMass = masses[j];
				nodeCenterX = xCenter(node);
				nodeCenterY = yCenter(node);
				quadtree.visit(collisionDetection);
			} //end nodes loop
		} //end iterate function

		function collisionDetection(quad, x0, y0, x1, y1) {
			let updated = false;
			let data = quad.data;
			if (data) {
				if (data.index > node.index) {
					let xSize = (node.width + data.width) / 2;
					let ySize = (node.height + data.height) / 2;
					let dataCenterX = xCenter(data);
					let dataCenterY = yCenter(data);
					let dx = nodeCenterX - dataCenterX;
					let dy = nodeCenterY - dataCenterY;
					let absX = Math.abs(dx);
					let absY = Math.abs(dy);
					let xDiff = absX - xSize;
					let yDiff = absY - ySize;

					if (xDiff < 0 && yDiff < 0) {
						//collision has occurred
						//overlap x
						let sx = xSize - absX;
						//overlap y
						let sy = ySize - absY;

						if (sx < sy) {
							//x displacement smaller than y
							if (sx > 0) {
								sy = 0;
							}
						} else {
							//y displacement smaller than x
							if (sy > 0) {
								sx = 0;
							}
						}
						if (dx < 0) {
							//change sign of sx - has collided on the right(?)
							sx = -sx;
						}
						if (dy < 0) {
							//change sign of sy -
							sy = -sy;
						}

						//magnitude of vector
						let distance = Math.sqrt(sx * sx + sy * sy);
						//direction vector/unit vector - normalize each component by the magnitude to get the direction
						let vCollisionNorm = { x: sx / distance, y: sy / distance };
						let vRelativeVelocity = { x: data.vx - node.vx, y: data.vy - node.vy };
						//dot product of relative velocity and collision normal
						let speed =
							vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;
						if (speed < 0) {
							//negative speed = rectangles moving away
						} else {
							//takes into account mass
							let collisionImpulse = (2 * speed) / (masses[data.index] + masses[node.index]);
							if (Math.abs(xDiff) < Math.abs(yDiff)) {
								//x overlap is less
								data.vx -= collisionImpulse * masses[node.index] * vCollisionNorm.x;
								node.vx += collisionImpulse * masses[data.index] * vCollisionNorm.x;
							} else {
								//y overlap is less
								data.vy -= collisionImpulse * masses[node.index] * vCollisionNorm.y;
								node.vy += collisionImpulse * masses[data.index] * vCollisionNorm.y;
							}

							updated = true;
						}
					}
				}
			}
			return updated;
		}
	} //end force

	function xCenter(d) {
		return d.x + d.vx + sizes[d.index][0] / 2;
	}
	function yCenter(d) {
		return d.y + d.vy + sizes[d.index][1] / 2;
	}

	force.initialize = function (_) {
		sizes = (nodes = _).map(function (d) {
			return [d.width, d.height];
		});
		masses = sizes.map(function (d) {
			return d[0] * d[1];
		});
	};

	force.size = function (_) {
		let size;
		return arguments.length ? ((size = typeof _ === 'function' ? _ : constant(_)), force) : size;
	};

	force.strength = function (_) {
		return arguments.length ? ((strength = +_), force) : strength;
	};

	force.iterations = function (_) {
		return arguments.length ? ((iterations = +_), force) : iterations;
	};

	return force;
} //end rectCollide

function boundedBox() {
	let nodes, sizes;
	let bounds;
	let size; // = constant([0, 0])

	function force() {
		let node, size;
		let xi, x0, x1, yi, y0, y1;
		let i = -1;
		while (++i < nodes.length) {
			node = nodes[i];
			size = sizes[i];
			xi = node.x + node.vx;
			x0 = bounds[0][0] - xi;
			x1 = bounds[1][0] - (xi + size[0]);
			yi = node.y + node.vy;
			y0 = bounds[0][1] - yi;
			y1 = bounds[1][1] - (yi + size[1]);
			if (x0 > 0 || x1 < 0) {
				node.x += node.vx;
				node.vx = -node.vx;
				if (node.vx < x0) {
					node.x += x0 - node.vx;
				}
				if (node.vx > x1) {
					node.x += x1 - node.vx;
				}
			}
			if (y0 > 0 || y1 < 0) {
				node.y += node.vy;
				node.vy = -node.vy;
				if (node.vy < y0) {
					node.vy += y0 - node.vy;
				}
				if (node.vy > y1) {
					node.vy += y1 - node.vy;
				}
			}
		}
	}

	force.initialize = function (_) {
		sizes = (nodes = _).map(size);
	};

	force.bounds = function (_) {
		return arguments.length ? ((bounds = _), force) : bounds;
	};

	force.size = function (_) {
		let size;
		return arguments.length ? ((size = typeof _ === 'function' ? _ : constant(_)), force) : size;
	};

	return force;
}
