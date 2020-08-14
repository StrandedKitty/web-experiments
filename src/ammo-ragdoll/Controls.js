import * as THREE from 'three';

export default class Controls {
	constructor() {
		this.keys = {
			'up': false,
			'down': false,
			'left': false,
			'right': false
		};

		this.mouse = new THREE.Vector2(0, 0);
		this.mouseDown = false;

		this.addListeners();
	}

	addListeners() {
		document.addEventListener("keydown", event => {
			switch (event.code) {
				case 'KeyW':
					this.keys.up = true;
					break;
				case 'KeyS':
					this.keys.down = true;
					break;
				case 'KeyA':
					this.keys.left = true;
					break;
				case 'KeyD':
					this.keys.right = true;
					break;
			}
		});

		document.addEventListener("keyup", event => {
			switch (event.code) {
				case 'KeyW':
					this.keys.up = false;
					break;
				case 'KeyS':
					this.keys.down = false;
					break;
				case 'KeyA':
					this.keys.left = false;
					break;
				case 'KeyD':
					this.keys.right = false;
					break;
			}
		});

		document.addEventListener('mousedown', event => {
			this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			this.mouseDown = true;
		});

		document.addEventListener('mouseup', event => {
			this.mouseDown = false;
		});
	}
}
