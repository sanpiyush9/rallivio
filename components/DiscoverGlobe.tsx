"use client";
/* eslint-disable */
// @ts-nocheck


import { useEffect, useRef } from "react";

const EARTH_ALBEDO = "/textures/earth-albedo.svg";
const EARTH_NIGHT = "/textures/earth-night.svg";
const EARTH_CLOUDS = "/textures/earth-clouds.svg";

export default function DiscoverGlobe() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let renderer: import("three").WebGLRenderer | null = null;
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visible = { current: true };

    const fallback = () => host.classList.remove("globeReady");
    const ready = () => host.classList.add("globeReady");

    const init = async () => {
      if (disposed || reducedMotion.matches) return;

      try {
        console.info("[globe] init");
        const THREE = await import("three");
        if (disposed) return;

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.className = "discoverGlobeCanvas";
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
        camera.position.set(0, 0, 4.15);

        const group = new THREE.Group();
        group.rotation.z = THREE.MathUtils.degToRad(23.4);
        scene.add(group);

        const geometry = new THREE.SphereGeometry(1.08, 64, 64);
        const loader = new THREE.TextureLoader();

        const [albedo, night, clouds] = await Promise.all([
          loader.loadAsync(EARTH_ALBEDO),
          loader.loadAsync(EARTH_NIGHT),
          loader.loadAsync(EARTH_CLOUDS).catch(() => null),
        ]);
        if (disposed) {
          geometry.dispose();
          albedo.dispose();
          night.dispose();
          clouds?.dispose();
          renderer.dispose();
          return;
        }

        albedo.colorSpace = THREE.SRGBColorSpace;
        night.colorSpace = THREE.SRGBColorSpace;
        albedo.anisotropy = 2;
        night.anisotropy = 2;

        const earthMaterial = new THREE.ShaderMaterial({
          uniforms: {
            dayMap: { value: albedo },
            nightMap: { value: night },
            lightDirection: { value: new THREE.Vector3(-0.62, 0.48, 0.62).normalize() },
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;
            void main() {
              vUv = uv;
              vWorldNormal = normalize(mat3(modelMatrix) * normal);
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `,
          fragmentShader: `
            uniform sampler2D dayMap;
            uniform sampler2D nightMap;
            uniform vec3 lightDirection;
            varying vec2 vUv;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;
            void main() {
              vec3 normal = normalize(vWorldNormal);
              float ndl = dot(normal, normalize(lightDirection));
              float day = smoothstep(-0.38, 0.10, ndl);
              vec3 daylight = texture2D(dayMap, vUv).rgb;
              vec3 cityGlow = texture2D(nightMap, vUv).rgb;
              float rim = pow(1.0 - max(dot(normal, normalize(cameraPosition - vWorldPosition)), 0.0), 3.0);
              vec3 color = mix(cityGlow * 2.25, daylight * 1.75, day);
              color += vec3(0.08, 0.52, 0.95) * rim * 0.48;
              gl_FragColor = vec4(color, 1.0);
            }
          `,
        });

        const earth = new THREE.Mesh(geometry, earthMaterial);
        group.add(earth);

        const atmosphereGeometry = new THREE.SphereGeometry(1.13, 48, 48);
        const atmosphereMaterial = new THREE.ShaderMaterial({
          uniforms: { glowColor: { value: new THREE.Color(0x58cfff) } },
          vertexShader: `
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;
            void main() {
              vWorldNormal = normalize(mat3(modelMatrix) * normal);
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `,
          fragmentShader: `
            uniform vec3 glowColor;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;
            void main() {
              vec3 viewDir = normalize(cameraPosition - vWorldPosition);
              float fresnel = pow(1.0 - max(dot(viewDir, normalize(vWorldNormal)), 0.0), 3.6);
              float innerFade = smoothstep(0.0, 0.82, fresnel);
              gl_FragColor = vec4(glowColor, innerFade * 0.72);
            }
          `,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

        if (clouds) {
          clouds.colorSpace = THREE.SRGBColorSpace;
          const cloudGeometry = new THREE.SphereGeometry(1.095, 48, 48);
          const cloudMaterial = new THREE.MeshPhongMaterial({
            map: clouds,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
          });
          const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
          group.add(cloudMesh);
          cloudMesh.userData.isCloudLayer = true;
        }

        const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
        keyLight.position.set(-4.2, 3.2, 4.6);
        scene.add(keyLight);
        scene.add(new THREE.AmbientLight(0x3977aa, 0.48));

        // Thin cyan orbital rings naturally occlude behind/in front of the Earth.
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0x57dcff,
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.30, 0.006, 8, 160), ringMaterial);
        ring1.rotation.x = THREE.MathUtils.degToRad(66);
        ring1.rotation.z = THREE.MathUtils.degToRad(18);
        group.add(ring1);
        const ring2 = new THREE.Mesh(
          new THREE.TorusGeometry(1.37, 0.004, 8, 160),
          ringMaterial.clone(),
        );
        ring2.material.opacity = 0.42;
        ring2.rotation.x = THREE.MathUtils.degToRad(108);
        ring2.rotation.z = THREE.MathUtils.degToRad(-24);
        group.add(ring2);

        // Sparse starfield surrounding the globe.
        const starPositions = new Float32Array(240 * 3);
        for (let i = 0; i < 240; i++) {
          const radius = 2.7 + Math.random() * 2.2;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          starPositions[i * 3 + 1] = radius * Math.cos(phi);
          starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        const starMaterial = new THREE.PointsMaterial({
          color: 0x9deaff,
          size: 0.018,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
        });
        scene.add(new THREE.Points(starGeometry, starMaterial));

        const resize = () => {
          if (!renderer) return;
          const width = Math.max(1, host.clientWidth);
          const height = Math.max(1, host.clientHeight);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        };
        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);

        let lastFrame = 0;
        const renderFrame = (now: number) => {
          if (disposed || !renderer) return;
          if (!visible.current) return;
          if (!lastFrame) lastFrame = now;
          if (now - lastFrame >= 33.33) {
            const delta = Math.min((now - lastFrame) / 1000, 0.1);
            group.rotation.y += (Math.PI * 2 / 60) * delta;
            const cloud = group.children.find((child) => child.userData.isCloudLayer) as import("three").Mesh | undefined;
            if (cloud) cloud.rotation.y += (Math.PI * 2 / 48) * delta;
            renderer.render(scene, camera);
            if (renderer.info.render.frame <= 3 || renderer.info.render.frame % 60 === 0) console.log("[globe] frame", renderer.info.render.frame);
            lastFrame = now;
          }
          frame = window.requestAnimationFrame(renderFrame);
        };
        renderer.render(scene, camera);
        ready();

        intersectionObserver = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            visible.current = Boolean(entry?.isIntersecting);
            if (visible.current && !reducedMotion.matches) {
              window.cancelAnimationFrame(frame);
              frame = window.requestAnimationFrame(renderFrame);
            } else {
              window.cancelAnimationFrame(frame);
            }
          },
          { threshold: 0.01 },
        );
        intersectionObserver.observe(host);

        if (visible.current) frame = window.requestAnimationFrame(renderFrame);
      } catch (error) {
        console.error("[globe] initialization failed", error);
        fallback();
      }
    };

    const schedule = typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(init, { timeout: 900 })
      : globalThis.setTimeout(init, 350);

    return () => {
      disposed = true;
      if (typeof window.cancelIdleCallback === "function" && typeof schedule === "number") window.cancelIdleCallback(schedule);
      else globalThis.clearTimeout(schedule);
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      renderer?.dispose();
      host.innerHTML = "";
    };
  }, []);

  return (
    <div ref={hostRef} className="globeStage" aria-label="Animated 3D Earth">
      <div className="globeFallback" aria-hidden="true">
        <span className="globeLand landA" />
        <span className="globeLand landB" />
        <span className="globeLand landC" />
      </div>
    </div>
  );
}
