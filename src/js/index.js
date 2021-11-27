import * as THREE from '../../node_modules/three/build/three.module.js';
import * as Utils from './scene.js';


let end_animation_point = 0;
let selectedModel = -1;
let train_step = 0;
let prev = 0;
let toolList = [
    { name: "long_fix", start: 0, end: 5, instrument: "Alignment Wire" },
    { name: "template", start: 5, end: 8.5, instrument: "Drill and Resection Guide" },
    { name: "end_stop", start: 8.5, end: 14, instrument: "End-Stop Pin" },
    { name: "drill", start: 14, end: 42.3, instrument: "2,0 mm Drill " },
    { name: "short_fix_1", start: 42.5, end: 53, instrument: "3 x Fixation Wire 2,0 mm" },
    { name: "drill", start: 53, end: 63.8, instrument: "Shank Drill (implant size relatatd)" },
    { name: "middle_pin", start: 64, end: 71.8, instrument: "Shank (implant size related)" },
    { name: "saw", start: 71.8, end: 116.5, instrument: "Osszilating Saw" },
    { name: "ruler", start: 116.5, end: 131.8, instrument: "Depth Gauge" },
    { name: "tta", start: 131.8, end: 136.1, instrument: "Implant" },
    { name: "zange", start: 136.1, end: 180, instrument: "Implant Cutting Device" },
];
let play_state = false;
let isTrain = false;
class App {
    constructor() {

        this.init();
    }

    init() {

        this.scene = Utils.Scene();
        this.camera = Utils.Camera(this.scene);

        this.canvas = document.getElementById("canvas")

        this.renderer = Utils.Renderer(this.canvas);
        this.pointLight = Utils.PointLight(this.scene);
        this.controls = Utils.Control(this.camera, this.renderer);
        this.raycaster = Utils.Raycaster()
        this.model = Utils.loadAssets(this.scene, this.renderer);
        this.clock = Utils.Clock();
        this.animate();
        Utils.buildEnv(this.scene);
    }

    animate() {
        var render = () => {
            if (Utils.loaded) {
                Utils.setLoaded(false);
            }

            this.controls.update();
            let delta = this.clock.getDelta();

            if (Utils.assets.mixer) {

                Utils.assets.mixer.update(delta);
                if (isTrain) {
                    $("#test_message").css("display", "none");
                    if (Utils.assets.mixer.clipAction(Utils.assets.clips).time > 168) {
                        $("#train_message").css("display", "block")
                    }
                    else {
                        $("#train_message").css("display", "none")
                    }
                    if (Utils.assets.mixer.clipAction(Utils.assets.clips).time > end_animation_point) {


                        play_state = false
                        Utils.assets.mixer.clipAction(Utils.assets.clips).paused = true;

                        if ($("#playPause").hasClass("fa-pause-circle")) {
                            $("#playPause").removeClass("fa-pause-circle").addClass("fa-play-circle");

                        }
                    }
                }
                else {

                    $("#animationTimer").slider("setValue", Utils.assets.mixer.clipAction(Utils.assets.clips).time);
                    $("#train_message").css("display", "none")
                    if (Utils.assets.mixer.clipAction(Utils.assets.clips).time > 168) {
                        $("#test_message").css("display", "block")
                    }
                    else
                        $("#test_message").css("display", "none")
                }


            }
            this.camera.updateMatrixWorld();


            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(render);

        }
        render();
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);

        }, false);

        window.addEventListener('mousemove', (event) => {

            if (selectedModel !== -1) {
                if (window.innerWidth > 768) {

                    event.preventDefault();

                    let mouse = new THREE.Vector2();

                    mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
                    this.raycaster.setFromCamera(mouse, this.camera);
                    const intersects = this.raycaster.intersectObjects(Utils.assets.plane);

                    if (intersects.length > 0) {

                        const intersect = intersects[0];
                        Utils.assets.model[toolList[selectedModel].name].scale.set(1, 1, 1)
                        Utils.assets.model[toolList[selectedModel].name].position.copy(intersect.point)
                        end_animation_point = toolList[selectedModel].end;
                        intersects.every((ele) => {
                            if (ele.object.name.includes("bone")) {
                                play_state = true
                                Utils.controlAnimation_rangeValue(play_state, Utils.assets.mixer, Utils.assets.clips, toolList[selectedModel].start);
                                if ($("#playPause").hasClass("fa-play-circle")) {
                                    $("#playPause").removeClass("fa-play-circle").addClass("fa-pause-circle");

                                }
                                Utils.assets.model[toolList[selectedModel].name].scale.set(0, 0, 0)
                                selectedModel = -1;

                                return false;

                            }
                            return true;
                        })

                    }
                }
            }
        })

        // $(window).on('click', () => {
        //     console.log("camera position", this.camera.position)
        // })
        // console.log(Utils.assets.mixer.clipAction(Utils.assets.clips).time)


        window.addEventListener('pointerup', (event) => {

            $("#annotation_panel").css("display", "none");
            $("#popup_image").css("display", "none")
            $("#annotation_text").empty();
            let mouse = new THREE.Vector2();
            mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
            this.raycaster.setFromCamera(mouse, this.camera);
            const intersects_annotation = this.raycaster.intersectObjects(Utils.assets.model.annotation, true);

            if (intersects_annotation.length > 0 && intersects_annotation[0].object.name.includes('Plane')) {
                switch (intersects_annotation[0].object.parent.name) {
                    case "annotation_endStop":
                        $("#annotation_text").html("End-Stop-Pin position in the ruler of the resection guide should be determined by templating previously.");
                        $("#annotation_panel").css("display", "block");
                        break;
                    case "annotation_ruler":
                        $("#annotation_text").html("Measuring of the needed implant width");
                        $("#annotation_panel").css("display", "block");
                        break;
                    case "annotation_zange":
                        $("#annotation_text").html("Shorten the implant width in accordance with the previous measured thickness.")
                        $("#annotation_panel").css("display", "block");
                        break;
                    case "annotation_tta":
                        $("#annotation_text").html("Do not over-bend the tuberositas.")
                        $("#annotation_panel").css("display", "block");
                        break;
                }


            }

        });


    }


}

const app = new App();
const clock = Utils.Clock;


$("#playPause").on("click", () => {

    if ($("#playPause").hasClass("fa-play-circle")) {
        play_state = true;
        $("#playPause").removeClass("fa-play-circle").addClass("fa-pause-circle");

        Utils.controlAnimation_rangeValue(play_state, Utils.assets.mixer, Utils.assets.clips);
    }

    else {
        play_state = false;
        $("#playPause").removeClass("fa-pause-circle").addClass("fa-play-circle");
        Utils.controlAnimation_rangeValue(play_state, Utils.assets.mixer, Utils.assets.clips);
    }

})

$(".manual").on("click", () => {

    $("#pdf_section").css("display", "block");
})
$(".close_pdf").on("click", () => {

    $("#pdf_section").css("display", "none");

})

// With JQuery
$("#animationTimer").slider({
    ticks: [0, 5, 8.5, 14, 42.3, 53, 63.8, 71.8, 116.5, 131.8, 136.1, 180],
    ticks_positions: [0, 2.7, 4.73, 7.8, 23.5, 29.5, 35.4, 39.9, 64.7, 73.2, 75.7, 100],
    tooltip: 'hide',
    ticks_snap_bounds: 1,
    min: 0,

});
$("#animationTimer").on("change", function (slideEvent) {

    Utils.controlAnimation_rangeValue(play_state, Utils.assets.mixer, Utils.assets.clips);

});


$("#animation_mode").on("change", function () {
    if ($(this).prop("checked") == true) {
        isTrain = true;
        train_step = 0;
        play_state = false;
        $(".buttonList").css("display", "block")
        $("#bottomLine").css("display", "none")
        if (window.innerWidth <= 768) {
            $("#mobile_tool").css("display", "flex")
        }
        Utils.assets.mixer.clipAction(Utils.assets.clips).paused = true;
        Utils.assets.mixer.setTime(0);
        $("#test").css("color", "white")
        $("#train").css("color", "rgb(155, 219, 6)")

    } else {
        isTrain = false
        $(".buttonList").css("display", "none")
        $("#bottomLine").css("display", "block")
        $("#mobile_tool").css("display", "none");
        if ($("#playPause").hasClass("fa-pause-circle")) {
            $("#playPause").removeClass("fa-pause-circle").addClass("fa-play-circle");
        }
        Utils.assets.mixer.clipAction(Utils.assets.clips).paused = true;
        Utils.assets.mixer.setTime(0);
        $("#test").css("color", "orange")
        $("#train").css("color", "white")
    }
})


$(".tool").on("pointerdown", function () {

    let str = $(this).attr('id').split('_');
    if (str[1] !== selectedModel && selectedModel !== -1) {
        Utils.assets.model[toolList[selectedModel].name].scale.set(0, 0, 0)
    }

    if (str[1] == prev) {
        selectedModel = str[1];
        train_step = prev + 1
        return;
    }
    else if (str[1] == train_step) {
        selectedModel = str[1];
        prev = train_step;
        train_step++;
        if (train_step == 11) {
            train_step = 0;
        }

    }
    else {
        alert(`Please choose proper tools, The needed tool is the ${toolList[train_step].instrument} `)
    }

})


$(".mobileTool").on("click", function (e) {


    let str = $(this).attr('id').split('_');

    if (str[1] == train_step) {
        selectedModel = str[1];

        train_step++;
        if (train_step == 11) {
            train_step = 0;
        }
        play_state = true;
        end_animation_point = toolList[selectedModel].end;
        Utils.controlAnimation_rangeValue(play_state, Utils.assets.mixer, Utils.assets.clips, toolList[selectedModel].start);

    }
    else {
        alert(`Please choose proper tools. The needed tool is the ${toolList[train_step].instrument} `)
    }


})

$("#popup").on("click", () => {
    if (window.innerWidth > 768)
        $("#popup_image").css("display", "block")
})

$(".starting_scene").on("click", () => {
    $(".starting_scene").fadeTo(100, 0, () => {
        $(".starting_scene").css("display", "none");
        $("#starting_image").css("display", "none");
        $("#logo_title").css("display", "none");
        $("#bottomLine").css("display", "block");

    });

})


// function isMobile() {
//     checker = {
//         Android: function Android() {
//             return navigator.userAgent.match(/Android/i);
//         },
//         BlackBerry: function BlackBerry() {
//             return navigator.userAgent.match(/BlackBerry/i);
//         },
//         iOS: function iOS() {
//             return navigator.userAgent.match(/iPhone|iPad|iPod/i);
//         },
//         Opera: function Opera() {
//             return navigator.userAgent.match(/Opera Mini/i);
//         },
//         Windows: function Windows() {
//             return (
//                 navigator.userAgent.match(/IEMobile/i) ||
//                 navigator.userAgent.match(/WPDesktop/i)
//             );
//         },
//         any: function any() {
//             return (
//                 checker.Android() ||
//                 checker.BlackBerry() ||
//                 checker.iOS() ||
//                 checker.Opera() ||
//                 checker.Windows()
//             );
//         },
//     };
//     return checker.any() ? true : false;
// }

// //orientation of phone screen?
// function isPortrait() {
//     var portrait;
//     if (window.matchMedia("(orientation: portrait)").matches) {
//         portrait = true;
//     }
//     if (window.matchMedia("(orientation: landscape)").matches) {
//         portrait = false;
//     }
//     return portrait;
// }


$(".arrow").on("click", (e) => {

    for (let i = 0; i < toolList.length; i++) {

        if ((Utils.assets.mixer.clipAction(Utils.assets.clips).time > toolList[i].start) && (Utils.assets.mixer.clipAction(Utils.assets.clips).time < toolList[i].end)) {

            if (e.target.id === "next") {
                if (i + 1 < toolList.length) {
                    play_state = true;
                    Utils.controlAnimation_rangeValue(play_state, Utils.assets.mixer, Utils.assets.clips, toolList[i + 1].start);
                    $("#playPause").removeClass("fa-play-circle").addClass("fa-pause-circle");
                }
            }
            else {

                if (i - 1 >= 0) {
                    play_state = true
                    Utils.controlAnimation_rangeValue(play_state, Utils.assets.mixer, Utils.assets.clips, toolList[i - 1].start);
                }
                $("#playPause").removeClass("fa-play-circle").addClass("fa-pause-circle");

            }
        }

    }
})




