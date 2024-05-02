
import { BoxGeometry, Color, DoubleSide, DynamicDrawUsage, Group, InstancedMesh, MathUtils, Matrix4, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Quaternion, Scene, SphereGeometry, SpriteMaterial, Texture, TextureLoader, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNoise2D } from 'simplex-noise';
import { lerp, smootherstep, smoothstep } from "three/src/math/MathUtils.js";


type AppConstructorProps = {
    domElement?: HTMLElement, 
    customColors?: number[]
}
type Particle = {
    initPos: [number, number],
    scale: number,
    delay: number,
    index: number,
    flatPos: [number, number, number],
    color: number[]
}

function randomIntFromInterval(min: number, max: number): number { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const _mat4 = new Matrix4();
const _color = new Color();
const noise2d = createNoise2D();

const slerp = (a: number, b: number, dt: number) => {
    return a + (b - a) * Math.sin(dt * (Math.PI/2));
}

export class App {
    root: HTMLElement;
    pallete: number[];
    canvas: HTMLCanvasElement;
    step: number = 0;
    subStep: number = 0;
    time: number = 0;
    revealTime: number = 0;
    delta: number = 0;
    prevTime: number = 0;
    duration = [5, 3, 3];
    particles: Particle[] = [];
    gl!: WebGLRenderer;
    scene!: Scene;
    camera!: PerspectiveCamera;
    // controls!: OrbitControls;
    internalSphere!: Mesh;

    gridSizeY!: number;
    gridSizeX!: number;
    scaleArr!: number[];
    count!: number;
    mesh!: InstancedMesh;
    positions!: number[];
    processId!: number;

    constructor(props: AppConstructorProps){
        const { domElement, customColors } = props;
        this.root = domElement || document.getElementById('root') as HTMLElement;
        this.pallete = customColors || [
            0x6b727b,
            0x5b616b,
            0x55514f,
            0x473e3a,
            0x332c27,
            0x201c19,
            0x88827d,
            0x7b8591,
            0x8a8c8a,
            0x979288,
            0x89959e,
            0x9c9a94,
            0x9ea6ae,
            0xa7a59f,
            0xb7b5b2,
            0xc9cbcb, 

            0x54544c,
            0x5c636c,
            0x302825,
            0x969997,
            0xbbbbbb,
            0x6c747c,
            0x848487,
            0xaca49f,
            0x48443c,
            0x9ca4b4
        ];

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.root.clientWidth; // px
        this.canvas.height = this.root.clientHeight;
    
        this.root.appendChild(this.canvas);

        this.glInit();


    }
    glInit () {

        this.gl = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.gl.setSize( this.root.clientWidth, this.root.clientHeight );
        this.gl.setPixelRatio(window.devicePixelRatio);

        window.addEventListener('resize', () => this.resize());

        this.scene = new Scene();
        this.scene.background = new Color().setHex(0x222E37, 'srgb');

        const aspect = this.root.clientWidth / this.root.clientHeight; 
        // const frustumSize = 43;

        this.camera = new PerspectiveCamera( 75, aspect, 0.1, 1000 );
        this.camera.position.z = 50;
        // const left = frustumSize * aspect / 2; 
        // const right = - frustumSize * aspect / 2;
        // const top = - frustumSize / 2;
        // const bottom = frustumSize / 2;
        // this.camera = new OrthographicCamera( left, right, top, bottom, 0.1, 100 );
        // this.camera.position.z = 5;

        this.gridSizeY = 43;
        this.gridSizeX = Math.round(this.gridSizeY * aspect);
        this.count = this.gridSizeX * this.gridSizeY;
        
        this.scaleArr = Array.from({length: this.count}, e => Math.max(0.1, Math.random() * 0.6));

        // this.controls = new OrbitControls( this.camera, this.gl.domElement );
        // this.controls.enableDamping = true;
        // this.controls.enableZoom = true;
        // this.controls.enablePan = false;

        const loader = new TextureLoader();
        loader.load( './assets/disc.png', (texture) => this.createScene(texture));

    };

    createScene (texture: Texture) {

        this.positions = [];
        this.particles = [];

        const geometry = new PlaneGeometry(1, 1);
        const material = new MeshBasicMaterial({ 
            transparent: true,
            map: texture,
            alphaTest: 0.7,
            color: new Color().setHex(0xB5C3D6, 'srgb')
        });

        this.count = this.gridSizeX * this.gridSizeY;

        this.mesh = new InstancedMesh( geometry, material, this.count );
        this.mesh.instanceMatrix.setUsage( DynamicDrawUsage ); // will be updated every frame

        this.internalSphere = new Mesh(
            new SphereGeometry(17, 64, 64),
            new MeshBasicMaterial({
                color: 0x222E37
            })
        );
        this.scene.add(this.internalSphere);

        let acc = 0;

        for (let i = 0; i < this.gridSizeX; i++){
            for (let a = 0; a < this.gridSizeY; a++){

                // const phi = Math.acos( - 1 + ( 2 * acc ) / this.count );
                // const phi = (i / (this.gridSizeX - 1)) * Math.PI * 2 + Math.PI/2 ;
                // const theta = Math.sqrt( this.count * Math.PI ) * phi ;

                // const theta = MathUtils.randFloatSpread(360); 
                // const phi = MathUtils.randFloatSpread(360);

                const u = (this.gridSizeX - 1 - i) / this.gridSizeX;
                const phi = u * Math.PI * 2 + Math.PI/2 ;
                const theta = ((a + 1) / (this.gridSizeY + 1)) * Math.PI + Math.PI ;

                const r1 = Math.random() * 2 - 1;
                const r2 = Math.random() * 2 - 1;
                const bb = Math.PI/(this.gridSizeX * 2);

                this.particles.push({
                    initPos: [theta + bb * r1, phi + bb * r2],
                    scale: this.scaleArr[acc],
                    delay: Math.random() * 0.3,
                    index: acc,
                    flatPos: [i - this.gridSizeX/2 + 0.5, a - this.gridSizeY/2 + 0.5, 42.5],
                    color: _color.setHex(this.pallete[randomIntFromInterval(0, this.pallete.length - 1)], 'srgb').toArray()
                });

                acc++;
            }
        }

        this.scene.add( this.mesh );

        this.render();
    };

    animation (dt: number) {

        this.delta = dt - this.prevTime;

        switch (this.step) {
            case 0: // to grid
                {
                    for (let i = 0; i < this.count; i++){

                        const {scale, flatPos, color, delay} = this.particles[i];
                        const t = MathUtils.smoothstep(this.revealTime, delay, 1);

                        const animScale = slerp(0, scale, t);
                        const interpZ = slerp(22, flatPos[2], t);

                        this.mesh.setMatrixAt(i, _mat4.identity()
                            .makeScale(animScale, animScale, animScale)
                            .setPosition(flatPos[0], flatPos[1], interpZ)
                        );

                        this.mesh.setColorAt(i, _color.setRGB(color[0], color[1], color[2]));
                    }

                    this.revealTime += this.delta / (this.duration[0] * 1000);
                    this.mesh.instanceMatrix.needsUpdate = true;
                    this.mesh.instanceColor!.needsUpdate = true;

                    if (this.revealTime >= 1){
                        this.step = 1;
                        this.revealTime = 0;
                        this.time = dt;
                    }
                }
                break;
            case 1: // to sphere
                {
                    for (let i = 0; i < this.count; i++){
                        const {scale, initPos, flatPos, delay, color} = this.particles[i];
                        const t = MathUtils.smoothstep(this.revealTime, delay, 1);
                        const intrpScale = lerp(scale, 0.45, this.revealTime);

                        const u = Math.sin(initPos[0]);
                        const v = initPos[1] + (dt - this.time)/2000;

                        const noise = noise2d(initPos[0] * 0.5 * u, v * 0.5);
                        const radius = 20 + noise * 3;
                        
                        const sX = radius * Math.cos( v ) * Math.sin( initPos[0] );
                        const sZ = radius * Math.sin( v ) * Math.sin( initPos[0] );
                        const sY = radius * Math.cos( initPos[0] );

                        const customTime = MathUtils.smoothstep(t, 0.5, 1);

                        this.mesh.setColorAt(i, _color.setRGB(
                            slerp(color[0], 0xB5/255, customTime),
                            slerp(color[1], 0xC3/255, customTime),
                            slerp(color[2], 0xD6/255, customTime),
                        ));
                        
                        this.mesh.setMatrixAt(i, _mat4.identity()
                            .makeScale(intrpScale, intrpScale, intrpScale)
                            .setPosition(
                                slerp(flatPos[0], sX, t),
                                slerp(flatPos[1], sY, t),
                                slerp(flatPos[2], sZ, t),
                            )
                        );
                    }

                    this.revealTime += this.delta / (this.duration[1] * 1000);
                    this.mesh.instanceMatrix.needsUpdate = true;
                    this.mesh.instanceColor!.needsUpdate = true;

                    if (this.revealTime >= 1){
                        this.step = 2;
                        this.revealTime = 0;
                    }
                }
                break;
                case 2: // 
                    { 
                        const intrpR = lerp(3, 0.5, this.revealTime);

                        for (let i = 0; i < this.count; i++){
                            const { initPos } = this.particles[i];

                            const u = Math.sin(initPos[0]);
                            const v = initPos[1] + (dt - this.time)/2000;

                            const noise1 = noise2d(initPos[0] * 0.5 * u, v * 0.5);
                            const noise2 = noise2d(initPos[0] * 2.5 * u, v * 2.5);
                            const radius = 20 + lerp(noise1, noise2, this.revealTime) * intrpR;

                            const sX = radius * Math.cos( v ) * Math.sin( initPos[0] );
                            const sZ = radius * Math.sin( v ) * Math.sin( initPos[0] );
                            const sY = radius * Math.cos( initPos[0] );
    
                            this.mesh.setMatrixAt(i, _mat4.identity()
                                .makeScale(0.45, 0.45, 0.45)
                                .setPosition(sX, sY, sZ)
                            );
                        }

                        const newR = lerp(17, 19.4, this.revealTime);
                        this.internalSphere.geometry.dispose();
                        this.internalSphere.geometry = new SphereGeometry(newR, 64, 64);

                        this.revealTime += this.delta / (this.duration[2] * 1000);
                        this.mesh.instanceMatrix.needsUpdate = true;

    
                        if (this.revealTime >= 1){
                            this.step = 3;
                            this.revealTime = 0;
                        }
                    }
                    break;
                    case 3:
                        {
                            for (let i = 0; i < this.count; i++){
                                const { initPos } = this.particles[i];
    
                                const u = Math.sin(initPos[0]);
                                const v = initPos[1] + (dt - this.time)/2000;
    
                                const noise = noise2d(initPos[0] * 2.5 * u, v * 2.5);
                                const radius = 20 + noise * 0.5;
    
                                const sX = radius * Math.cos( v ) * Math.sin( initPos[0] );
                                const sZ = radius * Math.sin( v ) * Math.sin( initPos[0] );
                                const sY = radius * Math.cos( initPos[0] );
        
                                this.mesh.setMatrixAt(i, _mat4.identity()
                                    .makeScale(0.45, 0.45, 0.45)
                                    .setPosition(sX, sY, sZ)
                                );
                            }
        
                            this.revealTime += this.delta / (this.duration[2] * 1000);
                            this.mesh.instanceMatrix.needsUpdate = true;
        
                            // if (this.revealTime >= 1){
                            //     this.step = 4;
                            //     this.revealTime = 0;
                            // }
                        }
                        break;
        
            default:
                break;
        }

        // this.controls.update();

        this.gl.render( this.scene, this.camera );

        this.prevTime = dt;

    };

    render(dt = 0){
        this.animation(dt);
        this.processId = requestAnimationFrame((dt)=>{
            this.render(dt);
        });
    };

    stopAnimation(){
        cancelAnimationFrame(this.processId);
    };

    updatePerspective (camera: PerspectiveCamera){

        camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        camera.updateProjectionMatrix();

    }

    resize(){

        this.canvas.width = this.root.clientWidth;
        this.canvas.height = this.root.clientHeight;

        this.updatePerspective(this.camera);
        
        this.gl.setSize(this.canvas.width, this.canvas.height, true); 

    };
};
