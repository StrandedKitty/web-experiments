import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

new class App {
    constructor() {
        this.loop = this.animate.bind(this);
        this.init();
        this.animate();
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: document.getElementById('canvas')});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.sortObjects = false;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f5);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(8, 8, 20);
        this.scene.add(this.camera);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        this.scene.add(light);
        this.scene.add(light.target);
        light.target.position.set(1, 1, -1);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        this.setupScene();

        window.addEventListener('resize', this.onResize.bind(this), false);
    }

    setupScene() {
        const geometry = new THREE.PlaneBufferGeometry(10, 10);
        const material = new THREE.MeshStandardMaterial({
            side: THREE.DoubleSide,
            roughness: 0.5
        });

        const planes = [
            new THREE.Mesh(geometry, material),
            new THREE.Mesh(geometry, material),
            new THREE.Mesh(geometry, material)
        ];

        planes[0].position.z = -5;
        planes[2].position.z = 5;

        for (let i = 0; i < planes.length; i++) {
            this.scene.add(planes[i]);
        }
    }

    animate() {
        requestAnimationFrame(this.loop);

        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};