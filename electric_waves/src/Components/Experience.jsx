import { OrbitControls, shaderMaterial } from '@react-three/drei'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { data } from '../Data/Data'
import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';


/**
 * DATA
 */
const PATH = data.economics[0].paths;
const randomRange = (min, max) => Math.random() * (max - min) + min;

/**
 * Spherical Curves
 */
let curves = [];
// Loop for curves
for (let i = 0; i < 100; i++) {
    // Loop for points
    let points = [];
    let length = randomRange(0.1, 1);

    for (let j = 0; j < 100; j++) {
        points.push(
            new THREE.Vector3().setFromSphericalCoords(
                // Radius
                1,
                // phi
                Math.PI - (j / 100) * Math.PI * length,
                // theta
                (i / 100) * Math.PI * 2,
            )
        )
    }
    let tempCurve = new THREE.CatmullRomCurve3(points);
    curves.push(tempCurve);
}

/**
 * Brain Curves
 */

let brainCurves = [];
PATH.forEach((path) => {
    let points = [];
    for (let i = 0; i < path.length; i += 3) {
        points.push(new THREE.Vector3(path[i], path[i + 1], path[i + 2]));
    }
    let tempCurve = new THREE.CatmullRomCurve3(points);
    brainCurves.push(tempCurve);
})

function Tube({ curve }) {
    const brainMat = useRef();
    const { viewport } = useThree();


    useFrame(({ clock, mouse }) => {
        brainMat.current.uniforms.time.value = clock.getElapsedTime();
        brainMat.current.uniforms.mouse.value = new THREE.Vector3(
            mouse.x * viewport.width / 2,
            mouse.y * viewport.height / 2,
            0
        );
    })

    const BrainMaterial = shaderMaterial(
        {
            time: 0,
            color: new THREE.Color(0.1, 0.3, 0.6),
            mouse: new THREE.Vector2(0.0, 0.0, 0.0)
        },
        // vertex shader
        `
          uniform float time;
          varying vec2 vUv;
          varying float vProgress;
          uniform vec3 mouse;
          void main() {
            vUv = uv;
            vProgress = smoothstep(-1.0, 1.0, sin(vUv.x * 8.0 + time * 3.0));

            vec3 p = position;
            float maxDist = 0.001;
            float dist = length(mouse - p);
            if(dist < maxDist){
                vec3 dir =  normalize(mouse - p);
                dir *= (1.0 - dist / maxDist);
                p -= dir;
            }

            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        // fragment shader
        `
          uniform float time;
          uniform vec3 color;
          varying vec2 vUv;
          varying float vProgress;
          void main() {
            float hideCorners1 = smoothstep(1.0, 0.9, vUv.x);
            float hideCorners2 = smoothstep(0.0, 0.1, vUv.x);
            vec3 finalColor = mix(color, color * 0.24, vProgress);
            gl_FragColor.rgba = vec4(finalColor, hideCorners1 * hideCorners2);
          }
        `
    )

    // declaratively
    extend({ BrainMaterial })
    return (
        <>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <tubeGeometry args={[curve, 64, 0.001, 4, false]} />
                <brainMaterial
                    ref={brainMat}
                    side={THREE.DoubleSide}
                    transparent={true}
                    depthTest={false}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </>
    )
}

function Tubes({ allthecurves }) {
    return (
        <>
            {allthecurves.map((curve, idx) => (
                <Tube key={idx} curve={curve} />
            ))}
        </>
    )
}

function BrainParticles({ allthecurves }) {
    let density = 10;
    let numberOfPoints = density * allthecurves.length;

    const myPoints = useRef([]);
    const brainGeo = useRef();

    let positions = useMemo(() => {
        let positions = [];
        for (let i = 0; i < numberOfPoints; i++) {
            positions.push(
                randomRange(-1, 1),
                randomRange(-1, 1),
                randomRange(-1, 1),
            )
        }
        return new Float32Array(positions);
    }, [])

    let randomSize = useMemo(() => {
        let randomSize = [];
        for (let i = 0; i < numberOfPoints; i++) {
            randomSize.push(
                randomRange(0.1, 3.0)
            )
        }
        return new Float32Array(randomSize);
    }, [])

    useEffect(() => {
        for (let i = 0; i < allthecurves.length; i++) {
            for (let j = 0; j < density; j++) {

                myPoints.current.push({
                    currentOffset: Math.random(),
                    speed: Math.random() * 0.001,
                    curve: allthecurves[i],
                    currPosition: Math.random() * 10
                })
            }
        }
    }, [])

    useFrame(({ clock }) => {
        let currPosition = brainGeo.current.attributes.position.array;

        for (let i = 0; i < myPoints.current.length; i++) {
            myPoints.current[i].currPosition += myPoints.current[i].speed;
            myPoints.current[i].currPosition = myPoints.current[i].currPosition % 1;

            let currPoint = myPoints.current[i].curve.getPointAt(myPoints.current[i].currPosition)

            currPosition[i * 3] = currPoint.x;
            currPosition[i * 3 + 1] = currPoint.y;
            currPosition[i * 3 + 2] = currPoint.z;

        }

        brainGeo.current.attributes.position.needsUpdate = true;
    })

    const BrainParticleMaterial = shaderMaterial(
        { time: 0, color: new THREE.Color(0.1, 0.3, 0.6) },
        // vertex shader
        `
          uniform float time;
          varying vec2 vUv;
          varying float vProgress;
          attribute float randomSize;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = randomSize * 5.0 * ( 1.0 / -mvPosition.z);
            // gl_PointSize = 20.0;
          }
        `,
        // fragment shader
        `
          uniform float time;
          void main() {
            float disc  = length(gl_PointCoord.xy - vec2(0.5));
            float opacity  = 0.3* smoothstep(0.5, 0.4, disc);
            gl_FragColor.rgba = vec4(vec3(opacity) * 0.5, 1.0);
          }
        `
    )

    // declaratively
    extend({ BrainParticleMaterial })
    return (
        <>
            <points rotation={[Math.PI / 2, 0, 0]}>
                <bufferGeometry attach="geometry" ref={brainGeo}>
                    <bufferAttribute
                        attach='attributes-position'
                        count={positions.length / 3}
                        array={positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach='attributes-randomSize'
                        count={randomSize.length}
                        array={randomSize}
                        itemSize={1}
                    />
                </bufferGeometry>
                <brainParticleMaterial
                    attach="material"
                    depthTest={false}
                    transparent={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </>
    )
}

const Experience = () => {
    return (
        <Canvas camera={{ position: [0, 0, 2], fov: 20 }}>
            <color attach="background" args={['black']} />
            {/* <OrbitControls /> */}
            <ambientLight />
            <pointLight intensity={5} position={[1, 1, 1]} />
            <Tubes allthecurves={curves} />
            <BrainParticles allthecurves={curves} />
        </Canvas>
    )
}

export default Experience