import * as THREE from 'three';

export default class Capsule extends THREE.Object3D {
	constructor(radius, height, material) {
		super();

		const sphereGeometry = new THREE.SphereBufferGeometry(radius, 16, 8);
		const sphereTop = new THREE.Mesh(sphereGeometry, material);
		const sphereBottom = new THREE.Mesh(sphereGeometry, material);

		sphereTop.position.y = height / 2;
		sphereBottom.position.y = -height / 2;

		const cylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(radius, radius, height, 16, 1), material);

		this.add(sphereTop);
		this.add(sphereBottom);
		this.add(cylinder);
	}
}
