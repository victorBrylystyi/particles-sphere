
import { CircleGeometry, Color, DynamicDrawUsage, InstancedMesh, MathUtils, Matrix4, Mesh, MeshBasicMaterial, OrthographicCamera, Scene, SphereGeometry, WebGLRenderer } from "three";
import { createNoise2D } from 'simplex-noise';
import { lerp } from "three/src/math/MathUtils.js";


type AppConstructorProps = {
    domElement?: HTMLElement, 
    customColors?: number[],
    displayType?: string
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
    displayType: string;
    canvas: HTMLCanvasElement;
    step: number = 0;
    scrollDelta: number = 0;
    time: number = 0;
    revealTime: number = 0;
    delta: number = 0;
    prevTime: number = 0;
    duration = [4, 2, 2];
    scrollOffsets = [0,0,0,0,0];
    particles: Particle[] = [];
    gl!: WebGLRenderer;
    scene!: Scene;
    camera!: OrthographicCamera;
    internalSphere!: Mesh;
    internalSphere2!: Mesh;

    gridSizeY!: number;
    gridSizeX!: number;
    scaleArr!: number[];
    count!: number;
    mesh!: InstancedMesh;
    mesh2!: InstancedMesh;
    processId!: number;

    constructor(props: AppConstructorProps){
        const { domElement, customColors, displayType } = props;
        this.root = domElement || document.getElementById('root') as HTMLElement;
        this.displayType = displayType ? displayType : 'flex';
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
        const cont = document.querySelector('.container') as HTMLElement;
        cont.addEventListener('scroll', () => {

            if (this.step > 3) {

                const cont = document.querySelector('.container') as HTMLElement;
                this.scrollDelta = cont.scrollTop;

                if (this.scrollDelta >= this.scrollOffsets[1] && this.scrollDelta < this.scrollOffsets[2]) {
                    const diap = this.scrollOffsets[2] - this.scrollOffsets[1];

                    const delta = this.scrollDelta - this.scrollOffsets[1];
                    const t = delta/diap;

                    this.camera.zoom = lerp(1, 3, t);
                    this.camera.updateProjectionMatrix();

                    const op = lerp(1, 0, t);
                    (this.internalSphere.material as MeshBasicMaterial).opacity = op < 0.06 ? 0 : op;

                    const opacity = lerp(0, 1, t);
                    (this.mesh2.material as MeshBasicMaterial).opacity = opacity < 0.06 ? 0 : opacity;
                    (this.internalSphere2.material as MeshBasicMaterial).opacity = opacity < 0.06 ? 0 : opacity;
                }

                if (this.scrollDelta >= this.scrollOffsets[2] && this.scrollDelta < this.scrollOffsets[3]) {
                    const diap = this.scrollOffsets[3] - this.scrollOffsets[2];

                    const delta = this.scrollDelta - this.scrollOffsets[2];
                    const t = delta/diap;

                    this.camera.zoom = lerp(3, 1, t);
                    this.camera.updateProjectionMatrix();


                    this.mesh.position.set(0,0,0);
                    this.internalSphere.position.set(0,0,0);

                    this.mesh2.position.set(0,0,0);
                    this.internalSphere2.position.set(0,0,0);

                    const sceneBackground = this.scene.background as Color;
                    if (sceneBackground.getHex('srgb') !== 0x222E37) {
                        this.scene.background = _color.setHex(0x222E37, 'srgb');
                    }

                }

                if (this.scrollDelta >= this.scrollOffsets[3] && this.scrollDelta < this.scrollOffsets[4]) {
                
                    const diap = this.scrollOffsets[4] - this.scrollOffsets[3];

                    const delta = this.scrollDelta - this.scrollOffsets[3];
                    const t = delta/diap;

                    const r = lerp(34/255, 1, t);
                    const g = lerp(46/255, 1, t);
                    const b = lerp(55/255, 1, t);
                    const color = _color.setRGB(r, g, b, 'srgb');
                    this.scene.background = color;
                    (this.internalSphere.material as MeshBasicMaterial).color = color;
                    (this.internalSphere2.material as MeshBasicMaterial).color = color;

                    const newX = lerp(0, 45, t);
                    const newY = lerp(0, -15, t);

                    this.mesh.position.set(
                        newX < 0.07 ? 0 : newX, 
                        newY > -0.07 ? 0 : newY,
                        0
                    );

                    this.internalSphere.position.set(
                        newX < 0.07 ? 0 : newX, 
                        newY > -0.07 ? 0 : newY,
                        0
                    );

                    const newX2 = lerp(0, -40, t);
                    const newY2 = lerp(0, 6, t);

                    this.mesh2.position.set(
                        newX2 > -0.07 ? 0 : newX2, 
                        newY2 < 0.07 ? 0 : newY2,
                        0
                    );

                    this.internalSphere2.position.set(
                        newX2 > -0.07 ? 0 : newX2,
                        newY2 < 0.07 ? 0 : newY2,
                        0
                    );

                    const op = lerp(0, 1, t);
                    (this.internalSphere.material as MeshBasicMaterial).opacity = op < 0.06 ? 0 : op;

                }

            }

        });

        this.scene = new Scene();
        this.scene.background = new Color().setHex(0x222E37, 'srgb');

        const aspect = this.root.clientWidth / this.root.clientHeight; 

        this.gridSizeY = 50;
        this.gridSizeX = Math.round(this.gridSizeY * aspect);
        this.count = this.gridSizeX * this.gridSizeY;

        const frustumSize = 20;

        const left = -frustumSize * aspect / 2; 
        const right = frustumSize * aspect / 2;
        const top = frustumSize / 2;
        const bottom = -frustumSize / 2;
        this.camera = new OrthographicCamera( left, right, top, bottom, 0.1, 100 );
        this.camera.position.z = 50;
        
        this.scaleArr = Array.from({length: this.count}, e => Math.max(0.1, Math.random() * 0.6));
    
        this.createScene()

    };

    createScene () {
        this.particles = [];

        const geometry = new CircleGeometry(0.3, 64);
        const material = new MeshBasicMaterial({ 
            transparent: true,
            color: new Color().setHex(0xB5C3D6, 'srgb')
        });

        this.count = this.gridSizeX * this.gridSizeY;

        this.mesh = new InstancedMesh( geometry, material, this.count );
        this.mesh.instanceMatrix.setUsage( DynamicDrawUsage ); // will be updated every frame

        const geometry2 = new CircleGeometry(0.3, 64);
        const material2 = new MeshBasicMaterial({ 
            transparent: true,
            alphaTest: 0.1,
            opacity: 0,
            color: new Color().setHex(0xB5C3D6, 'srgb')
        });

        this.mesh2 = new InstancedMesh( geometry2, material2, this.count );
        this.mesh2.frustumCulled = false;
        this.mesh2.instanceMatrix.setUsage( DynamicDrawUsage ); // will be updated every frame

        this.internalSphere = new Mesh(
            new SphereGeometry(17, 64, 64),
            new MeshBasicMaterial({
                transparent: true,
                color: 0x222E37
            })
        );
        this.internalSphere2 = new Mesh(
            new SphereGeometry(14.7, 64, 64),
            new MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                color: 0x222E37
            })
        );
        this.scene.add(this.internalSphere);
        this.scene.add(this.internalSphere2);

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
        this.scene.add( this.mesh2 );

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
                            // .setPosition(flatPos[0], flatPos[1], interpZ)
                            .setPosition(flatPos[0], flatPos[1], 22)
                        );

                        this.mesh.setColorAt(i, _color.setRGB(color[0], color[1], color[2]));
                    }

                    const interpFrustrum = slerp(20, 50, this.revealTime);
                    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
                    const frustumSize = interpFrustrum;
                    const left = -frustumSize * aspect / 2; 
                    const right = frustumSize * aspect / 2;
                    const top = frustumSize / 2;
                    const bottom = -frustumSize / 2;
                    this.camera.left = left;
                    this.camera.right = right;
                    this.camera.top = top;
                    this.camera.bottom = bottom;
                    this.camera.updateProjectionMatrix();

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

                        const r = slerp(color[0], 0xB5/255, customTime);
                        const g = slerp(color[1], 0xC3/255, customTime);
                        const b = slerp(color[2], 0xD6/255, customTime);

                        this.mesh.setColorAt(i, _color.setRGB(r, g, b));
                        this.mesh2.setColorAt(i, _color.setRGB(r, g, b));

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
                    this.mesh2.instanceColor!.needsUpdate = true;

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
            case 3: // static sphere animation
                {
                    for (let i = 0; i < this.count; i++) {
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

                        this.mesh2.setMatrixAt(i, _mat4.identity()
                            .makeScale(0.45, 0.45, 0.45)
                            .setPosition(sX, sY, sZ)
                        );
                    }

                    this.revealTime += this.delta / (this.duration[2] * 1000);
                    this.mesh.instanceMatrix.needsUpdate = true;
                    this.mesh2.instanceMatrix.needsUpdate = true;

                    if (this.revealTime >= 1){

                        const cont = document.querySelector('.container') as HTMLElement;
                        cont.style.display = this.displayType;
                        const sections = document.querySelectorAll('.centralText') as NodeListOf<HTMLElement>;
                        const sections2 = document.getElementsByClassName('content') as HTMLCollectionOf<HTMLElement>;
                        if (sections.length !== 0) {
                            sections.forEach((e, i) => this.scrollOffsets[i] = e.offsetTop - sections[0].offsetTop);
                        } else {
                            this.scrollOffsets[0] = sections2[0].offsetTop;
                            this.scrollOffsets[1] = sections2[1].offsetTop;
                            this.scrollOffsets[2] = sections2[2].offsetTop;
                            this.scrollOffsets[3] = sections2[3].offsetTop;
                            this.scrollOffsets[4] = sections2[4].offsetTop;
                        }

                        
                        this.step = 4;
                        this.revealTime = 0;
                    }
                }
                break;
                case 4:
                    { 
                        for (let i = 0; i < this.count; i++) {
                            const { initPos } = this.particles[i];
    
                            const u = Math.sin(initPos[0]);
                            const v = initPos[1] + (dt - this.time)/2000;
    
                            const noise = noise2d(initPos[0] * 2.5 * u, v * 2.5);
                            const radius = 20 + noise * 0.5;
    
                            const sX = radius * Math.cos( v ) * Math.sin( initPos[0] );
                            const sZ = radius * Math.sin( v ) * Math.sin( initPos[0] );
                            const sY = radius * Math.cos( initPos[0] );

                            const noise2 = noise2d(initPos[0] * 0.5 * u, v * 0.5);
                            const radius2 = 16 + noise2 * 1.5;
    
                            const sX2 = radius2 * Math.cos( v ) * Math.sin( initPos[0] );
                            const sZ2 = radius2 * Math.sin( v ) * Math.sin( initPos[0] );
                            const sY2 = radius2 * Math.cos( initPos[0] );
    
                            this.mesh.setMatrixAt(i, _mat4.identity()
                                .makeScale(0.45, 0.45, 0.45)
                                .setPosition(sX, sY, sZ)
                            );

                            this.mesh2.setMatrixAt(i, _mat4.identity()
                                .makeScale(0.45, 0.45, 0.45)
                                .setPosition(sX2, sY2, sZ2)
                            );
    
                        }  
    
                        this.revealTime += this.delta / (this.duration[2] * 1000);
                        this.mesh.instanceMatrix.needsUpdate = true;
                        this.mesh2.instanceMatrix.needsUpdate = true;
    

                    }
                    break;            
            default:
                break;
        }

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

    updateCamera (camera: OrthographicCamera){

        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;

        const frustumSize = this.gridSizeY;
        const left = -frustumSize * aspect / 2; 
        const right = frustumSize * aspect / 2;
        const top = frustumSize / 2;
        const bottom = -frustumSize / 2;
        camera.left = left;
        camera.right = right;
        camera.top = top;
        camera.bottom = bottom;
        camera.updateProjectionMatrix();

    }

    resize(){

        this.canvas.width = this.root.clientWidth;
        this.canvas.height = this.root.clientHeight;

        this.updateCamera(this.camera);
        
        this.gl.setSize(this.canvas.width, this.canvas.height, true); 

    };
};