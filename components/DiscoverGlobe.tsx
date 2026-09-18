"use client";

import { useEffect, useRef } from "react";

const EARTH_ALBEDO = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
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
              float day = smoothstep(-0.16, 0.28, ndl);
              vec3 daylight = texture2D(dayMap, vUv).rgb;
              vec3 cityGlow = texture2D(nightMap, vUv).rgb;
              float rim = pow(1.0 - max(dot(normal, normalize(cameraPosition - vWorldPosition)), 0.0), 3.0);
              vec3 color = mix(cityGlow * 1.55, daylight * 1.15, day);
              color += vec3(0.10, 0.28, 0.55) * rim * 0.22;
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

        const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
        keyLight.position.set(-4.2, 3.2, 4.6);
        scene.add(keyLight);
        scene.add(new THREE.AmbientLight(0x1a2c4c, 0.18));

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

        const renderFrame = (now: number) => {
          if (disposed || !renderer) return;
          if (!visible.current) return;
          if (!renderFrame.last) renderFrame.last = now;
          if (now - renderFrame.last >= 33.33) {
            const delta = Math.min((now - renderFrame.last) / 1000, 0.1);
            group.rotation.y += (Math.PI * 2 / 60) * delta;
            const cloud = group.children.find((child) => child.userData.isCloudLayer) as import("three").Mesh | undefined;
            if (cloud) cloud.rotation.y += (Math.PI * 2 / 48) * delta;
            renderer.render(scene, camera);
            renderFrame.last = now;
          }
          frame = window.requestAnimationFrame(renderFrame);
        };
        renderFrame.last = 0;
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
      } catch {
        fallback();
      }
    };

    const schedule = "requestIdleCallback" in window
      ? window.requestIdleCallback(init, { timeout: 900 })
      : window.setTimeout(init, 350);

    return () => {
      disposed = true;
      if ("cancelIdleCallback" in window && typeof schedule === "number") window.cancelIdleCallback(schedule);
      else window.clearTimeout(schedule);
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
