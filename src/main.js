import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Player } from './Player';
import { House } from './House';
import gsap from 'gsap';

// Texture
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('/images/grid.png');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.x = 10;
floorTexture.repeat.y = 10;

// Renderer
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({
	canvas,
	antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.OrthographicCamera(
	-(window.innerWidth / window.innerHeight), // left
	window.innerWidth / window.innerHeight, // right,
	1, // top
	-1, // bottom
	-100,
	100
);


const cameraPosition = new THREE.Vector3(1,4,5); // x,y,z
camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
camera.zoom = 0.2;
camera.updateProjectionMatrix();
scene.add(camera);

// Light
const ambientLight = new THREE.AmbientLight('white', 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('white', 0.5);
const directionalLightOriginPosition = new THREE.Vector3(1, 1, 1);
directionalLight.position.x = directionalLightOriginPosition.x;
directionalLight.position.y = directionalLightOriginPosition.y;
directionalLight.position.z = directionalLightOriginPosition.z;
directionalLight.castShadow = true;

// mapSize 세팅으로 그림자 퀄리티 설정
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
// 그림자 범위
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.near = -100;
directionalLight.shadow.camera.far = 100;
scene.add(directionalLight);

// Mesh
const meshes = [];
const floorMesh = new THREE.Mesh(
	new THREE.PlaneGeometry(100, 100),
	new THREE.MeshStandardMaterial({
		map: floorTexture
	})
);
floorMesh.name = 'floor';
floorMesh.rotation.x = -Math.PI/2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);
meshes.push(floorMesh);

const pointerMesh = new THREE.Mesh(
	new THREE.PlaneGeometry(1, 1),
	new THREE.MeshBasicMaterial({
		color: 'crimson',
		transparent: true,
		opacity: 0.5
	})
);
pointerMesh.rotation.x = -Math.PI/2;
pointerMesh.position.y = 0.01;
pointerMesh.receiveShadow = true;
scene.add(pointerMesh);

const spotMesh = new THREE.Mesh(
	new THREE.PlaneGeometry(3, 3),
	new THREE.MeshStandardMaterial({
		color: 'yellow',
		transparent: true,
		opacity: 0.5
	})
);
spotMesh.position.set(5, 0.005, 5);
spotMesh.rotation.x = -Math.PI/2;
spotMesh.receiveShadow = true;
scene.add(spotMesh);

const gltfLoader = new GLTFLoader();

const house = new House({
	gltfLoader,
	scene,
	modelSrc: '/models/house.glb',
	x: 5,
	y: -1.3,
	z: 2
});

const player = new Player({
	scene,
	meshes,
	gltfLoader,
	modelSrc: '/models/ilbuni.glb'
});

// Ray casting => 가상의 공간에 보이지 않는 빛(Ray)을 투사해 빛에 닿는 표면을 파악하는 기술
// Raycaster() => 장면에서 광선을 투사하고 광선과 교차하는 객체를 결정
const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let destinationPoint = new THREE.Vector3();
let angle = 0;
let isPressed = false; // 마우스를 누르고 있는 상태

// 그리기
const clock = new THREE.Clock();

function draw() {
	const delta = clock.getDelta();

	if (player.mixer) player.mixer.update(delta);

	if (player.modelMesh) {
		camera.lookAt(player.modelMesh.position);
	}

	if (player.modelMesh) {

		if (isPressed) {
			raycasting();
		}

		if (player.moving) {
			const speed = isShiftPressed ? 0.1 : 0.05;

			// 걸어가는 상태
			angle = Math.atan2(
				destinationPoint.z - player.modelMesh.position.z,
				destinationPoint.x - player.modelMesh.position.x
			);

			player.modelMesh.position.x += Math.cos(angle) * speed;
			player.modelMesh.position.z += Math.sin(angle) * speed;

			camera.position.x = cameraPosition.x + player.modelMesh.position.x;
			camera.position.z = cameraPosition.z + player.modelMesh.position.z;
			
			player.actions[0].stop();
			player.actions[1].play();
			
			if (
				Math.abs(destinationPoint.x - player.modelMesh.position.x) < 0.03 &&
				Math.abs(destinationPoint.z - player.modelMesh.position.z) < 0.03
			) {
				player.moving = false;
				console.log('멈춤');
				console.log(house)
			}

			if (
				Math.abs(spotMesh.position.x - player.modelMesh.position.x) < 1.5 &&
				Math.abs(spotMesh.position.z - player.modelMesh.position.z) < 1.5
			) {
				if (!house.visible) {
					console.log('나와');
					house.visible = true;
					spotMesh.material.color.set('seagreen');
					gsap.to(
						house.modelMesh.position,
						{
							duration: 1,
							y: 1,
							ease: 'Bounce.easeOut'
						}
					);
					gsap.to(
						camera.position,
						{
							duration: 1,
							y: 3
						}
					);
				}
			} else if (house.visible) {
				console.log('들어가');
				house.visible = false;
				spotMesh.material.color.set('yellow');
				gsap.to(
					house.modelMesh.position,
					{
						duration: 0.5,
						y: -1.3
					}
				);
				gsap.to(
					camera.position,
					{
						duration: 1,
						y: 5
					}
				);
			}
		} else {
			// 서 있는 상태
			player.actions[1].stop();
			player.actions[0].play();
		}
	}

	renderer.render(scene, camera);
	renderer.setAnimationLoop(draw);
}

// let houseClicked = false;
function checkIntersects() {

	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects([...meshes, house.modelMesh]);

	for (const item of intersects) {
		if (item.object.name === 'floor') {
			destinationPoint.x = item.point.x;
			destinationPoint.y = 0.3;
			destinationPoint.z = item.point.z;
			player.modelMesh.lookAt(destinationPoint);

			player.moving = true;

			pointerMesh.position.x = destinationPoint.x;
			pointerMesh.position.z = destinationPoint.z;
		}  else if (item.object === house.modelMesh) {
			/* if(!houseClicked){
				alert('hi');
				houseClicked = true;
			} */
		}
		break;
	}
}

function setSize() {
	camera.left = -(window.innerWidth / window.innerHeight);
	camera.right = window.innerWidth / window.innerHeight;
	camera.top = 1;
	camera.bottom = -1;

	// 간단히 말해서 updateProjectionMatrix()는 카메라의 현재 상태를 정확하게 반영하도록 카메라의 투영 행렬을 다시 계산하는 메서드
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);
}

// 이벤트
window.addEventListener('resize', setSize);

// 마우스 좌표를 three.js에 맞게 변환
function calculateMousePosition(e) {
	mouse.x = e.clientX / canvas.clientWidth * 2 - 1;
	mouse.y = -(e.clientY / canvas.clientHeight * 2 - 1);
}

// 변환된 마우스 좌표를 이용해 래이캐스팅
function raycasting() {
	raycaster.setFromCamera(mouse, camera);
	checkIntersects();
}

// 마우스 이벤트
canvas.addEventListener('mousedown', e => {
	isPressed = true;
	calculateMousePosition(e);
});
canvas.addEventListener('mouseup', () => {
	isPressed = false;
});
canvas.addEventListener('mousemove', e => {
	if (isPressed) {
		calculateMousePosition(e);
	}
});

// 터치 이벤트
canvas.addEventListener('touchstart', e => {
	isPressed = true;
	calculateMousePosition(e.touches[0]);
});
canvas.addEventListener('touchend', () => {
	isPressed = false;
});
canvas.addEventListener('touchmove', e => {
	if (isPressed) {
		calculateMousePosition(e.touches[0]);
	}
});

// player => space key 점프
let isJumping = false;
document.addEventListener('keydown', e => {
	if (e.code === 'Space' && !isJumping) {
		isJumping = true;
		jump();
	}
});
function jump() {
	const jumpHeight = 1;
	const jumpDuration = 0.5;
	const jumpEase = 'Power2.easeOut';

	const startPosition = player.modelMesh.position.clone();
	const endPosition = player.modelMesh.position.clone().add(new THREE.Vector3(0, jumpHeight, 0));

	gsap.to(
		player.modelMesh.position,
		{
			duration: jumpDuration,
			y: endPosition.y,
			ease: jumpEase,
			onComplete: () => {
				gsap.to(
					player.modelMesh.position,
					{
						duration: jumpDuration,
						y: startPosition.y,
						ease: jumpEase,
						onComplete: () => {
							isJumping = false;
						}
					}
				);
			}
		}
	);
}

// player => shift key 달리기
let isShiftPressed = false;
document.addEventListener('keydown', e => {
	if (e.key === 'Shift') {
	  isShiftPressed = true;
	}
});
document.addEventListener('keyup', e => {
	if (e.key === 'Shift') {
	  isShiftPressed = false;
	}
});


draw();