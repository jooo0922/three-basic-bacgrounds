'use strict'

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    // alpha: true // WebGLRenderer의 alpha 옵션을 켜두면 렌더러 상에서 아무것도 렌더되지 않은 공간은 투명하게 보이게 함.
    // css에서 배경 이미지를 지정하는 게 아닌, scene의 background에 배경 이미지를 지정하는 거라면 렌더러를 투명으로 할 이유가 없겠지?
  });
  // 이거는 렌더러가 color buffer를 지울지 말지 결정하는 거라고 함.
  // 그니까 현재 프레임의 컬러 버퍼값을 지우지 말라고 하는거임.
  // 왜냐면 일반적으로 프레임을 새로 그릴때마다 컬러 버퍼를 싹 지우고 다시 새로 써야 새로운 화면이 나오도록 하는게 맞지만,
  // 배경은 애니메이션을 주는 게 아니니까 같은 컬러 버퍼를 계속 사용해도 되는거지. 오히려 썻다 지웠다 하는 게 계산 낭비니까.
  renderer.autoClearColor = false;

  // create camera
  const fov = 75;
  const aspect = 2;
  const near = 0.1
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  // create scene
  const scene = new THREE.Scene();

  // create directional light
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  // create BoxGeometry
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  // BoxGeometry를 전달받아서 퐁-머티리얼과 함께 큐브 메쉬를 만들어주는 함수
  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({
      color
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube)

    cube.position.x = x;

    return cube;
  }

  // 각각 색상, x좌표값이 다른 큐브들을 3개 만들어서 cubes 배열 안에 저장해놓음. 나중에 animate 메서드에서 사용할 것.
  const cubes = [
    makeInstance(geometry, 0x44aa88, 0),
    makeInstance(geometry, 0x8844aa, -2),
    makeInstance(geometry, 0xaa8844, 2),
  ];

  // css에서 지정한 배경에 Three.js에서 후처리 효과를 적용하려면 Three.js 씬의 배경으로 렌더링해야 함.
  // 즉, 배경 이미지 텍스처를 로드해와서 그냥 씬의 background에 할당해주기만 하면 됨.
  const loader = new THREE.TextureLoader();
  const bgTexture = loader.load('https://threejsfundamentals.org/threejs/resources/images/daikanyama.jpg');
  scene.background = bgTexture;

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  // animate
  function animate(t) {
    t *= 0.001;

    // 렌더러가 리사이징되면 카메라의 비율(aspect)도 리사이징된 사이즈에 맞게 업데이트 되어야 함.
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    /**
     * 그런데 그냥 scene.background에 로드된 이미지 텍스처를 할당해버리면
     * 배경 이미지가 canvas 비율보다 긴 방향으로 짜부되어버림.
     * 
     * 이거를 조정하려면 bgTexture의 repeat, offset 값을 조정해줘야 됨.
     * 왜냐? 동일한 canvas 사이즈 내에서 텍스처를 발라주는 것이기 때문에
     * 텍스처의 반복을 몇 회로 설정할 것인지(repeat), 텍스처의 위치는 어떻게 조정할 것인지(offset)를
     * 잘 설정해줘야 함.
     * 
     * 참고로 offset 값은 x, y 각 축에 0 ~ 1 사이의 값을 할당해주며,
     * 0은 위치가 그대로인 것이고, 1은 각 축에서 텍스처 크기만큼 이동하는거임.
     * 
     * 참고로 repeat값은 텍스쳐의 반복 횟수를 늘려준다는 뜻도 되지만,
     * 동일한 면적 내에서의 반복 횟수를 늘려주기 때문에 반복 횟수가 1보다 많아질수록 텍스쳐가 반복 횟수가 많아지는 축으로 더 짜부되는 효과가 발생함.
     * 더 많은 여러개의 텍스쳐들을 동일한 면적 내에 욱여넣어야 되니까 저렇게 되는거지.
     * 반대로 1보다 작아지면 작아지는 축으로 더 늘어나는 효과가 발생함.
     *
     * 다만 imageAspect 같은 경우는, 텍스처를 로드하는 데 시간이 걸리기 때문에 이미지가 로드되지 않았을 경우 그 값을 1로 할당해버림.
     */
    const canvasAspect = canvas.clientWidth / canvas.clientHeight;
    const imageAspect = bgTexture.image ? bgTexture.image.width / bgTexture.image.height : 1;
    const aspect = imageAspect / canvasAspect;

    // aspect > 1이면, imageAspect > canvasAspect이고, 이 말은 이미지가 캔버스보다 가로로 더 길어보이는 너비를 가지고 있다는 뜻이 됨. 
    // 이럴 경우, bgTexture의 x좌표값은 1(전체 텍스처 너비) - 1 / aspect(aspect가 1보다 크니까 그 역수를 취하면 1보다 작아지겠지) 한 값의 절반만큼 이동해주고,
    // x축으로 1 / aspect 만큼 반복해주도록(repeat.x) 설정하면 위에서 x축으로 이동하여 공백이 생긴만큼 텍스쳐를 x방향으로 늘려주는 효과가 발생함.
    // 반면, aspect < 1이면, imageAspect < canvasAspect이고, 이 말은 이미지가 캔버스보다 가로로 더 짧아보이는 너비를 가지고 있다는 뜻이 됨.
    // 이럴 경우, bgTexture의 x좌표값은 움직이지 않도록 두고, x축으로 1만큼 반복해주도록(repeat.x), 즉 반복하지 않도록 해서 어떠한 stretching도 하지 않음.
    bgTexture.offset.x = aspect > 1 ? (1 - 1 / aspect) / 2 : 0;
    bgTexture.repeat.x = aspect > 1 ? 1 / aspect : 1;

    // aspect > 1이면, 이미지가 캔버스보다 세로로 더 짧아보이는 높이를 가지고 있다는 뜻이 됨.
    // 이럴 경우, bgTexture의 y좌표값은 움직이지 않도록 두고, y축으로 1만큼 반복, 즉 반복하지 않도록 해서 어떠한 stretching도 하지 않음
    // 반면, aspect < 1이면, 이미지가 캔버스보다 세로로 더 길어보이는 높이를 가지고 있다는 뜻이 됨.
    // 이럴 경우, bgTexture의 y좌표값은 1(전체 텍스트 높이) - aspect(aspect가 1보다 작으니까 1에서 뺀 값도 1보다 작겠지) 한 값의 절반만큼 이동해주고,
    // y축으로 aspect만큼 반복해주도록(repeat.y) 설정하면 위에서 y축으로 이동하여 공백이 생긴만큼 텍스쳐를 y방향으로 늘려주는 효과가 발생함.
    bgTexture.offset.y = aspect > 1 ? 0 : (1 - aspect) / 2;
    bgTexture.repeat.y = aspect > 1 ? 1 : aspect;
    // 그니까 전반적으로 보면 알 수 있듯이 캔버스 요소보다 비율적으로 길어서 텍스처가 짜부되는 방향에 대해서
    // offset을 줘서 오른쪽, 또는 아래쪽으로 밀어준 뒤, 공백이 생긴 만큼 repeat값을 1보다 작게 설정하여 늘려주는 거라고 보면 됨.
    // 왜냐? 맨 윗부분에 적어놨듯이(또는 튜토리얼 웹사이트를 보면 알 수 있듯이) 캔버스 비율보다 긴 방향으로 배경 이미지 텍스처가 짜부되어 있으니까,
    // 얘를 옆으로, 또는 아래로 살짝 옮긴 뒤 해당 방향으로 다시 늘려줘서 공백을 채워주는거지.

    // cubes안에 담긴 각각의 cube mesh들의 rotation값에 매 프레임마다 변화를 줘서 회전시킴
    cubes.forEach((cube, index) => {
      const speed = 1 + index * 0.1;
      const rotate = t * speed;
      cube.rotation.x = rotate;
      cube.rotation.y = rotate;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(animate); // 내부에서 반복 호출 해줌
  }

  requestAnimationFrame(animate);
}

main();