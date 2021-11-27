import * as THREE from '../../node_modules/three/build/three.module.js';
import { OrbitControls } from '../../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../../node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { Shader } from './gradient/shader.js'


let assets = {

    mixer: null,
    clips: null,
    model: {
        template: null,
        end_stop: null,
        long_fix: null,
        drill: {},
        saw: null,
        tta: null,
        zange: null,
        ruler: null,
        short_fix_1: null,
        annotation: []
    },
    plane: []
};
let loaded = false;


var customMaterial = new THREE.ShaderMaterial(
    {
        uniforms: {
            p: { type: "f", value: 1.5 },
            glowColor: { type: "c", value: new THREE.Color(0x8f5003) },
        },
        vertexShader: Shader.vertexShader,
        fragmentShader: Shader.fragmentShader,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });


const Scene = () => {
    const scene = new THREE.Scene();
    return scene;
}


const Camera = (scene) => {
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(5.213876414338369, 3.226959077941586, 7.899508076158702)
    scene.add(camera);
    return camera;
}
const Clock = () => {
    const clock = new THREE.Clock();

    return clock;
}
const PointLight = (scene) => {
    const light = new THREE.DirectionalLight(0xfac105, 1);
    light.position.set(4.7, 3, 2.5)
    light.castShadow = true;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    const d = 5;

    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;

    light.shadow.camera.far = 1000;
    scene.add(light)

    return light;
}

function isMobile() {
    let checker = {
        Android: function Android() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function BlackBerry() {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function iOS() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function Opera() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function Windows() {
            return (
                navigator.userAgent.match(/IEMobile/i) ||
                navigator.userAgent.match(/WPDesktop/i)
            );
        },
        any: function any() {
            return (
                checker.Android() ||
                checker.BlackBerry() ||
                checker.iOS() ||
                checker.Opera() ||
                checker.Windows()
            );
        },
    };
    return checker.any() ? true : false;
}



const Raycaster = () => {
    const raycaster = new THREE.Raycaster();
    return raycaster;
}
const Renderer = (canvas) => {
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });

    let DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
    if (isMobile()) DPR = 1;
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    return renderer;
}

const Control = (camera, renderer) => {
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 500;
    controls.minDistance = 2;
    return controls;
}

const buildEnv = (scene) => {
    const hemiLight = new THREE.HemisphereLight(0xfac105, 0xffffff, 1);
    scene.add(hemiLight);
    const geometry = new THREE.PlaneGeometry(5000, 5000);
    geometry.rotateX(- Math.PI / 2);
    const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    scene.add(plane);
    assets.plane.push(plane)
    return plane;
}

const loadAssets = (scene, renderer) => {
    let gltf;
    Promise.all([
        new Promise(resolve => {
            new RGBELoader().setDataType(THREE.UnsignedByteType).load('assets/env/venice_sunset_1k.hdr', resolve)
        }).then(result => {

            var texture = result;
            var pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            var envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();
        }),


        loadModel('models/final.glb').then(function (result) {
            gltf = result.scene;

            assets.model.annotation.push(gltf.children[1], gltf.children[2], gltf.children[3], gltf.children[4])
            gltf.traverse(child => {

                if (child.isMesh) {

                    if (child.name === 'skin') {
                        child.material = customMaterial;

                    }
                    else if (child.name.includes("bone")) {


                        child.receiveShadow = true;
                        child.castShadow = true;

                        assets.plane.push(child)
                    }

                    else {
                        if (!child.name.includes("template")) {

                            child.receiveShadow = true;
                            child.castShadow = true;
                            switch (child.name) {
                                case "ruler":
                                    const ruler = child.clone()
                                    ruler.children[0].position.set(-1.125, -0.115, -0.430)

                                    assets.model.ruler = ruler;

                                    scene.add(assets.model["ruler"])
                                    break;

                                case "zange":
                                    const zange = child.clone()
                                    zange.children[0].position.set(0.001, -0.003, -0.010)
                                    zange.children[1].position.set(0.001, -0.003, -0.010)
                                    assets.model.zange = zange;

                                    scene.add(assets.model["zange"])

                                    break;

                                case "drill":

                                    assets.model["drill"] = child.clone();
                                    assets.model["drill"].children[0].position.set(0.003, 0.461, -0.768); //knife
                                    assets.model["drill"].children[1].position.set(0.002, -0.002, 0.159); //neck
                                    assets.model["drill"].remove(assets.model["drill"].children[2]);


                                    assets.model["saw"] = child.clone();
                                    assets.model["saw"].children[1].position.set(0.002, -0.002, 0.159); //neck
                                    assets.model["saw"].children[2].position.set(0.002, -0.002, 0.019);
                                    assets.model["saw"].children[2].scale.set(1, 1, 1)
                                    assets.model["saw"].remove(assets.model["saw"].children[0]);

                                    scene.add(assets.model["drill"], assets.model["saw"]);
                                    break;

                                case "tta":

                                    assets.model["tta"] = child.clone();
                                    assets.model["tta"].children[0].position.set(0.001, 0.001, -0.174)
                                    assets.model["tta"].children[0].rotation.set(-0.014, 0.029, -0.019)
                                    assets.model["tta"].children[1].position.set(-0.239, -0.069, -0.294)
                                    assets.model["tta"].children[1].rotation.set(-0.014, 0.029, -0.019)
                                    scene.add(assets.model["tta"])

                                    break;



                                default:

                                    if (child.name !== "saw") {
                                        assets.model[child.name] = child.clone();
                                        assets.model[child.name].scale.set(0, 0, 0)
                                        scene.add(assets.model[child.name])


                                    }

                                    break;

                            }


                        }
                        else {

                            if (child.name === 'template') {
                                assets.model.template = child.clone();
                                scene.add(assets.model["template"]);

                                assets.model["template"].children = []

                            }

                        }


                    }

                }


            });


            scene.add(gltf);

            loaded = true;

            const mixer = new THREE.AnimationMixer(gltf);
            const clips = result.animations[0];

            assets.mixer = mixer;
            assets.clips = clips;

            assets.model.annotation.forEach(ele => {
                ele.children.forEach(element => {
                    element.castShadow = false;
                    element.receiveShadow = false;
                })
            })

        }),



    ]).then(() => {
        $(".starting_scene").fadeTo(1000, 0, () => {
            $(".starting_scene").css("display", "none");
            $("#starting_image").css("display", "none");
            $("#logo_title").css("display", "none");
            $("#bottomLine").css("display", "block");

        });



    });

}
const loadModel = (url) => {
    return new Promise(resolve => {
        new GLTFLoader().load(url, resolve, function (xhr) {
            const loading_percent = parseInt(xhr.loaded / xhr.total * 100)
            $(".progress-value").css("width", `${loading_percent}%`)
            $("#loading_percent").html("Loading " + loading_percent + "%")

        });
    });
}

const setLoaded = (bool) => {
    loaded = bool;
}



const setContent = (object, camera, controls) => {
    // put a camera at a proper position and look at a object

    let box = new THREE.Box3().setFromObject(object);

    const size = box.getSize(new THREE.Vector3()).length();
    object.size = size

    const center = box.getCenter(new THREE.Vector3());
    controls.reset();
    var obj_pos = new THREE.Vector3().copy(object.position);

    object.center = obj_pos;
    object.position.x += object.position.x - center.x;
    object.position.y += object.position.y - center.y;
    object.position.z += object.position.z - center.z;
    camera.position.copy(obj_pos);
    camera.position.y += size / 2;
    camera.position.z += size * 5 / 3;
    camera.lookAt(obj_pos);
}

const controlAnimation_rangeValue = (playingState, mixer, clips, startPoint) => {

    if (startPoint == null)
        startPoint = $("#animationTimer").slider('getValue');
    if (playingState) {
        mixer.clipAction(clips).paused = false;
        mixer.clipAction(clips).play();
        mixer.setTime(startPoint);
    }
    else {
        mixer.clipAction(clips).paused = true;
    }
}

const playAnimation = (startData, mixer, clips) => {

    if (mixer.clipAction(clips).paused) {
        mixer.clipAction(clips).paused = false;
    }
    mixer.clipAction(clips).paused = false;
    mixer.clipAction(clips).play();
    mixer.setTime(startData);
}

const makeBackground = (scene) => {
    const loader = new THREE.TextureLoader();

    loader.load("./assets/background1.jpg", (texture) => {
        scene.background = texture;
    })

}


export { Scene, Camera, Renderer, Control, buildEnv, loadAssets, assets, loaded, setLoaded, setContent, PointLight, controlAnimation_rangeValue, playAnimation, Clock, Raycaster, makeBackground };
