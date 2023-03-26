import {
	AnimationMixer
} from 'three';

export class Player {
	constructor(info) {
		this.moving = false;

		info.gltfLoader.load(
			info.modelSrc,
			glb => {
				glb.scene.traverse(child => {
					if (child.isMesh) {
						child.castShadow = true;
					}
				});
		
				this.modelMesh = glb.scene.children[0];
				this.modelMesh.position.y = 0.3;
				this.modelMesh.name = 'ilbuni';
				info.scene.add(this.modelMesh);
				info.meshes.push(this.modelMesh);

				this.actions = [];
		
				this.mixer = new AnimationMixer(this.modelMesh);
				// glb.animations[0]. [1] => 블랜더에서 작업한 애니메이션이 들어가있다
				this.actions[0] = this.mixer.clipAction(glb.animations[0]);
				this.actions[1] = this.mixer.clipAction(glb.animations[1]);
				this.actions[0].play();
				// this.actions[0].repetitions = 1 // 동작 몇번반복 ? 안정하면 무한인듯
				// this.actions[0].clampWhenFinished = true // 애니메이션 끝난 모션을 유지하고 싶을때
			}
		);
	}
}
