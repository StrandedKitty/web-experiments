import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import PhysicsSystem from "./PhysicsSystem";
import Controls from "./Controls";
import Capsule from "./objects/Capsule";

export default class App {
	constructor() {
		this.loop = this.animate.bind(this);
		this.controls = new Controls();
		this.physicsSystem = new PhysicsSystem(this.controls);
		this.init().then(() => this.animate());
	}

	async init() {
		this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: document.getElementById('canvas')});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.sortObjects = false;

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xf5f5f5);

		this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.position.set(20, 20, 60);
		this.scene.add(this.camera);

		this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

		const light = new THREE.DirectionalLight(0xffffff, 0.5);
		this.scene.add(light);
		this.scene.add(light.target);
		light.target.position.set(1, -1, -1);

		this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

		await this.physicsSystem.initAmmo();

		this.setupScene();

		window.addEventListener('resize', this.onResize.bind(this), false);
	}

	setupScene() {
		this.addGround();
		this.addCube();
	}

	addGround() {
		const material = new THREE.MeshStandardMaterial({
			color: '#11ff34',
			roughness: 0.5
		});
		const geometry = new THREE.PlaneBufferGeometry(100, 100);
		geometry.rotateX(-Math.PI / 2);
		geometry.translate(0, 10, 0);
		const mesh = new THREE.Mesh(geometry, material);

		this.scene.add(mesh);

		this.physicsSystem.bodies.ground.object = mesh;
	}

	addCube() {
		const material = new THREE.MeshStandardMaterial({
			color: '#ff0059',
			roughness: 0.5
		});
		const geometry = new THREE.BoxBufferGeometry(2, 2, 2);
		const mesh = new THREE.Mesh(geometry, material);

		this.scene.add(mesh);

		const capsule = new Capsule(1, 3, new THREE.MeshStandardMaterial());
		this.scene.add(capsule);

		this.physicsSystem.bodies.box.object = mesh;
		this.physicsSystem.bodies.capsule.object = capsule;
	}

	animate() {
		requestAnimationFrame(this.loop);

		if(this.controls.mouseDown) {
			const vector = new THREE.Vector3(0.5, 0.5, -1).unproject(this.camera);
			const cameraDir = new THREE.Vector3();
			this.camera.getWorldDirection(cameraDir);
			vector.add(cameraDir.multiplyScalar(5));

			this.physicsSystem.setBodyPosition(this.physicsSystem.bodies.box, vector.x, vector.y, vector.z);
		}

		this.physicsSystem.simulate(1 / 60);

		this.orbitControls.update();

		this.renderer.render(this.scene, this.camera);
	}

	onResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}
};
