import * as AmmoModule from "ammo.js";
import * as THREE from "three";

let Ammo = undefined;

export default class PhysicsSystem {
	constructor(controls) {
		this.controls = controls;
	}

	async initAmmo() {
		Ammo = await AmmoModule();

		const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		this.dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		const overlappingPairCache = new Ammo.btDbvtBroadphase();
		const solver = new Ammo.btSequentialImpulseConstraintSolver();
		this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, overlappingPairCache, solver, collisionConfiguration);
		this.dynamicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));

		this.initBodies();
	}

	initBodies() {
		this.bodies = {};

		const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 10, 50));
		const groundTransform = new Ammo.btTransform();
		groundTransform.setIdentity();
		//groundTransform.getBasis().setEulerZYX(Math.PI / 2, 0, -Math.PI / 4);
		groundTransform.setOrigin(new Ammo.btVector3(0, -10, 0));

		this.bodies.ground = this.addStaticBody({
			shape: groundShape,
			transform: groundTransform
		});

		const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
		const boxTransform = new Ammo.btTransform();
		boxTransform.setIdentity();
		boxTransform.setOrigin(new Ammo.btVector3(0, 50, 0));

		this.bodies.box = this.addDynamicBody({
			shape: boxShape,
			transform: boxTransform,
			mass: 1,
			friction: 0.8
		});

		{
			const boxShape = new Ammo.btCapsuleShape(1, 3);
			const boxTransform = new Ammo.btTransform();
			boxTransform.setIdentity();
			boxTransform.setOrigin(new Ammo.btVector3(0, 50, 0));

			const capsule = this.addDynamicBody({
				shape: boxShape,
				transform: boxTransform,
				mass: 1,
				friction: 2
			});

			capsule.type = 'player';
			capsule.setAngularFactor(0, 1, 0);
			this.bodies.capsule = capsule;
		}
	}

	addDynamicBody({shape, transform, mass = 1, friction = 0.6}) {
		const localInertia = new Ammo.btVector3(1, 1, 1);
		const myMotionState = new Ammo.btDefaultMotionState(transform);
		const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
		const body = new Ammo.btRigidBody(rbInfo);

		body.setFriction(friction);
		body.setRollingFriction(friction);

		this.dynamicsWorld.addRigidBody(body);

		return body;
	}

	addStaticBody({shape, transform, friction = 0.6}) {
		const localInertia = new Ammo.btVector3(0, 0, 0);
		const myMotionState = new Ammo.btDefaultMotionState(transform);
		const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, shape, localInertia);
		const body = new Ammo.btRigidBody(rbInfo);

		body.setFriction(friction);

		this.dynamicsWorld.addRigidBody(body);

		return body;
	}

	setBodyPosition(body, x, y, z) {
		const transform = body.getCenterOfMassTransform();
		transform.setOrigin(new Ammo.btVector3(x, y, z));
		body.setCenterOfMassTransform(transform);
		body.activate();
	}

	simulate(dt) {
		this.dynamicsWorld.stepSimulation(dt, 2);

		this.processCollisionForces();

		for (const body of Object.values(this.bodies)) {
			const threeObject = body.object;

			if (body.type === 'player') {
				const airborne = this.capsuleSpringForce(body);

				if(!airborne) {
					body.activate();
					if (this.controls.keys.right) {
						body.setLinearVelocity(new Ammo.btVector3(10, 0, 0));
					} else if (this.controls.keys.left) {
						body.setLinearVelocity(new Ammo.btVector3(-10, 0, 0));
					} else if (this.controls.keys.up) {
						body.applyCentralForce(new Ammo.btVector3(0, 500, 0));
					} else {
						//body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
					}
				}

			}

			if (threeObject) {
				this.readBulletBody(body, threeObject);
			}
		}
	}

	readBulletBody(body, mesh) {
		const transform = new Ammo.btTransform();

		body.getMotionState().getWorldTransform(transform);

		const origin = transform.getOrigin();
		const rotation = transform.getRotation();

		mesh.position.x = origin.x();
		mesh.position.y = origin.y();
		mesh.position.z = origin.z();
		mesh.quaternion.x = rotation.x();
		mesh.quaternion.y = rotation.y();
		mesh.quaternion.z = rotation.z();
		mesh.quaternion.w = rotation.w();
	}

	capsuleSpringForce(capsule) {
		const pos = new THREE.Vector3(
			capsule.getWorldTransform().getOrigin().x(),
			capsule.getWorldTransform().getOrigin().y(),
			capsule.getWorldTransform().getOrigin().z()
		);

		let springforceY = 0;

		let airborne = true;
		const from = new Ammo.btVector3(pos.x, pos.y, pos.z);
		const to = new Ammo.btVector3(pos.x, pos.y - 10, pos.z);
		const res = new Ammo.AllHitsRayResultCallback(from, to);
		this.dynamicsWorld.rayTest(from, to, res);
		for (let i = 0; i < res.m_hitPointWorld.size(); i++) {
			if (res.m_collisionObjects[i] !== capsule) {
				const hitpoint = res.m_hitPointWorld.at(i);

				const d = pos.distanceTo(new THREE.Vector3(hitpoint.x(), hitpoint.y(), hitpoint.z()));

				if (d < 2.5) {
					const stiffness = 8;
					springforceY = stiffness * Math.max(1.9 * 2 - d, -0.05 * 2);
					airborne = false;
					break;
				}
			}
		}

		capsule.applyCentralForce(new Ammo.btVector3(0, springforceY, 0));

		return airborne;
	}

	processCollisionForces() {
		const num = this.dispatcher.getNumManifolds();

		for(let i = 0; i < num; i++) {
			const manifold = this.dispatcher.getManifoldByIndexInternal(i);

			const num_contacts = manifold.getNumContacts();
			if (num_contacts === 0) {
				continue;
			}

			for (let j = 0; j < num_contacts; j++) {
				const point = manifold.getContactPoint(j);

				const body0 = manifold.getBody0();
				const body1 = manifold.getBody1();

				const playerBodyID = this.bodies.capsule.a;

				if(body0.a === playerBodyID || body1.a === playerBodyID) {
					const impulse = point.getAppliedImpulse();

					if(impulse > 10) {
						console.log('Player collision impulse is ' + impulse);
					}
				}
			}
		}
	}
}

