"use client";
/* eslint-disable */
// @ts-nocheck


import { useEffect, useRef } from "react";

// High-resolution photographic Earth textures from the official Three.js examples.
const EARTH_ALBEDO = "https://threejs.org/examples/textures/planets/earth_day_4096.jpg";
const EARTH_NIGHT = "https://threejs.org/examples/textures/planets/earth_lights_2048.png";
const EARTH_CLOUDS = "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";

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
        // Keep the photographic Earth visibly bright in the dashboard: the source texture
        // is naturally dark in several regions, so lift the rendered surface without
        // changing the surrounding orbital UI.
        renderer.domElement.style.filter = "brightness(1.18) saturate(1.14) contrast(1.06)";
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

        // Load the photographic daytime Earth first so the real globe appears immediately.
        // Night lights and clouds enhance it progressively without blocking first paint.
        const albedo = await loader.loadAsync(EARTH_ALBEDO);
        if (disposed) {
          geometry.dispose();
          albedo.dispose();
          renderer.dispose();
          return;
        }

        albedo.colorSpace = THREE.SRGBColorSpace;
        albedo.anisotropy = 2;

        const night = new THREE.DataTexture(
          new Uint8Array([0, 0, 0, 255]),
          1,
          1,
          THREE.RGBAFormat,
        );
        night.needsUpdate = true;
        night.colorSpace = THREE.SRGBColorSpace;

        // Use the photographic daytime Earth directly. This avoids shader shadowing
        // that was making the real map appear like a mostly-night globe.
        const earthMaterial = new THREE.MeshBasicMaterial({
          map: albedo,
          color: new THREE.Color(0xffffff),
          toneMapped: false,
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
              gl_FragColor = vec4(glowColor, innerFade * 0.90);
            }
          `,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

        const addClouds = (clouds: import("three").Texture) => {
          if (disposed) {
            clouds.dispose();
            return;
          }
          clouds.colorSpace = THREE.SRGBColorSpace;
          const cloudGeometry = new THREE.SphereGeometry(1.095, 48, 48);
          const cloudMaterial = new THREE.MeshPhongMaterial({
            map: clouds,
            transparent: true,
            opacity: 0.34,
            depthWrite: false,
          });
          const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
          group.add(cloudMesh);
          cloudMesh.userData.isCloudLayer = true;
        };

        loader.load(EARTH_NIGHT, (texture) => {
          if (disposed) { texture.dispose(); return; }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 2;
          // Night lights are intentionally not composited into the daytime Earth.
          texture.dispose();
        });

        loader.load(EARTH_CLOUDS, addClouds);

        const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
        keyLight.position.set(-4.2, 3.2, 4.6);
        scene.add(keyLight);
        scene.add(new THREE.AmbientLight(0x3977aa, 0.48));

        // Thin cyan orbital rings naturally occlude behind/in front of the Earth.
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
        <img src={EARTH_ALBEDO} alt="" style={{ filter: "brightness(1.18) saturate(1.14) contrast(1.06)" }} />
      </div>
    </div>
  );
}
