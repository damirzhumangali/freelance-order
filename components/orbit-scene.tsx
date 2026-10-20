"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { BufferGeometry, Material, Texture, WebGLRenderer } from "three";
import "./orbit-scene.css";

export type OrbitSceneMotion = {
  progress: number;
  pointerX: number;
  pointerY: number;
};

type OrbitSceneProps = {
  motion: RefObject<OrbitSceneMotion>;
  onReady?: (ready: boolean) => void;
};

/** A transparent, genuinely volumetric sculpture. Scroll moves its camera in world space. */
export default function OrbitScene({ motion, onReady }: OrbitSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);

  useEffect(() => { readyRef.current = onReady; }, [onReady]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let disposeScene: (() => void) | undefined;

    // Keep Three and its renderer entirely out of server rendering and the initial UI bundle.
    void Promise.all([
      import("three"),
      import("three/addons/environments/RoomEnvironment.js"),
    ]).then(([THREE, { RoomEnvironment }]) => {
      if (disposed) return;

      let renderer: WebGLRenderer | undefined;
      let frame = 0;
      let lastTime = 0;
      let idleTime = 0;
      let frameCount = 0;
      let failed = false;
      let cleaned = false;
      let firstFrame = false;
      let visible = true;
      let width = 1;
      let height = 1;
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      const textures = new Set<Texture>();
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let resizeObserver: ResizeObserver | undefined;
      let intersectionObserver: IntersectionObserver | undefined;
      let environmentTarget: ReturnType<InstanceType<typeof THREE.PMREMGenerator>["fromScene"]> | undefined;

      const cancelFrame = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
      };
      const fail = () => {
        if (disposed || failed) return;
        failed = true;
        cancelFrame();
        if (renderer) renderer.domElement.dataset.rendered = "false";
        try {
          readyRef.current?.(false);
        } finally {
          // A failed scene will stay on its photograph fallback. Free its GPU and
          // observers immediately instead of keeping an unusable renderer alive.
          clean();
        }
      };
      const contextLost = (event: Event) => { event.preventDefault(); fail(); };
      // After a GPU reset the editorial photograph remains a valid, readable fallback.
      const contextRestored = () => { fail(); };
      const clean = () => {
        if (cleaned) return;
        cleaned = true;
        cancelFrame();
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        document.removeEventListener("visibilitychange", visibilityChanged);
        reducedMotion.removeEventListener("change", motionChanged);
        renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
        renderer?.domElement.removeEventListener("webglcontextrestored", contextRestored);
        for (const geometry of geometries) geometry.dispose();
        for (const material of materials) material.dispose();
        for (const texture of textures) texture.dispose();
        environmentTarget?.dispose();
        renderer?.dispose();
        if (renderer && !renderer.getContext().isContextLost()) renderer.forceContextLoss();
        renderer?.domElement.remove();
      };
      disposeScene = clean;

      let requestRender = () => {};
      function visibilityChanged() {
        if (document.hidden) cancelFrame();
        else requestRender();
      }
      function motionChanged() {
        cancelFrame();
        idleTime = 0;
        requestRender();
      }

      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
        const canvas = renderer.domElement;
        canvas.className = "oe-webgl-canvas";
        canvas.dataset.renderer = "webgl";
        canvas.dataset.rendered = "false";
        canvas.setAttribute("aria-hidden", "true");
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;
        canvas.addEventListener("webglcontextlost", contextLost);
        canvas.addEventListener("webglcontextrestored", contextRestored);
        host.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(41, 1, 0.045, 80);
        const environmentRoom = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(renderer);
        try {
          environmentTarget = pmrem.fromScene(environmentRoom, 0.035);
          scene.environment = environmentTarget.texture;
          scene.environmentIntensity = 1.05;
          scene.environmentRotation.set(0, 0.55, 0);
        } finally {
          environmentRoom.dispose();
          pmrem.dispose();
        }

        scene.add(new THREE.HemisphereLight(0xfff7dd, 0x34513a, 1.8));
        const sun = new THREE.DirectionalLight(0xffedca, 3.5);
        sun.position.set(-3.5, 5.5, 5);
        scene.add(sun);
        const rim = new THREE.DirectionalLight(0xe9f0df, 2.6);
        rim.position.set(4, 2, -3.5);
        scene.add(rim);
        const fill = new THREE.DirectionalLight(0xffd9a0, 1.1);
        fill.position.set(1, -2, 4.5);
        scene.add(fill);

        const bronze = new THREE.MeshPhysicalMaterial({
          color: "#b58a45",
          metalness: 0.98,
          roughness: 0.27,
          clearcoat: 0.25,
          clearcoatRoughness: 0.2,
          envMapIntensity: 1.05,
        });
        const darkBronze = new THREE.MeshPhysicalMaterial({
          color: "#916a33",
          metalness: 0.98,
          roughness: 0.3,
          clearcoat: 0.22,
          clearcoatRoughness: 0.22,
          envMapIntensity: 1.05,
        });
        const polishedGold = new THREE.MeshStandardMaterial({
          color: "#d6b36c",
          metalness: 1,
          roughness: 0.18,
          envMapIntensity: 1.1,
        });
        materials.add(bronze);
        materials.add(darkBronze);
        materials.add(polishedGold);

        // A rounded rectangular cross section gives each orbit a broad, solid bronze
        // face and a narrow polished edge; every surface has its own world-space depth.
        function bandGeometry(radius: number, halfWidth: number, halfDepth: number) {
          const around = 192;
          const section = 16;
          const vertices: number[] = [];
          const uvs: number[] = [];
          const indices: number[] = [];
          const rounded = (value: number) => Math.sign(value) * Math.pow(Math.abs(value), 0.48);
          for (let i = 0; i <= around; i++) {
            const angle = (i / around) * Math.PI * 2;
            for (let j = 0; j <= section; j++) {
              const crossAngle = (j / section) * Math.PI * 2;
              const radial = radius + rounded(Math.cos(crossAngle)) * halfWidth;
              vertices.push(Math.cos(angle) * radial, Math.sin(angle) * radial, rounded(Math.sin(crossAngle)) * halfDepth);
              uvs.push(i / around, j / section);
              if (i < around && j < section) {
                const a = i * (section + 1) + j;
                const b = a + section + 1;
                indices.push(a, b, a + 1, b, b + 1, a + 1);
              }
            }
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
          geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
          geometry.setIndex(indices);
          geometry.computeVertexNormals();
          // Matching normals at both parameter seams prevent a visible manufacturing seam.
          const normals = geometry.getAttribute("normal");
          for (let j = 0; j <= section; j++) {
            const first = j;
            const last = around * (section + 1) + j;
            const normal = new THREE.Vector3().fromBufferAttribute(normals, first)
              .add(new THREE.Vector3().fromBufferAttribute(normals, last)).normalize();
            normals.setXYZ(first, normal.x, normal.y, normal.z);
            normals.setXYZ(last, normal.x, normal.y, normal.z);
          }
          for (let i = 0; i <= around; i++) {
            const first = i * (section + 1);
            const last = first + section;
            const normal = new THREE.Vector3().fromBufferAttribute(normals, first)
              .add(new THREE.Vector3().fromBufferAttribute(normals, last)).normalize();
            normals.setXYZ(first, normal.x, normal.y, normal.z);
            normals.setXYZ(last, normal.x, normal.y, normal.z);
          }
          geometry.computeBoundingSphere();
          geometries.add(geometry);
          return geometry;
        }

        const sculpture = new THREE.Group();
        const rings = [
          { radius: 2.12, width: 0.163, depth: 0.085, material: bronze },
          { radius: 1.84, width: 0.157, depth: 0.082, material: darkBronze },
          { radius: 1.55, width: 0.146, depth: 0.078, material: bronze },
        ].map(({ radius, width: bandWidth, depth, material }) => {
          const orbit = new THREE.Group();
          orbit.add(new THREE.Mesh(bandGeometry(radius, bandWidth, depth), material));
          // An inset line catches the light as the ring turns, making its rotation legible.
          const inlayGeometry = new THREE.TorusGeometry(radius - bandWidth * 0.57, 0.011, 8, 192);
          geometries.add(inlayGeometry);
          const inlay = new THREE.Mesh(inlayGeometry, polishedGold);
          inlay.position.z = depth + 0.002;
          orbit.add(inlay);
          sculpture.add(orbit);
          return orbit;
        });
        scene.add(sculpture);

        const smooth = (start: number, end: number, value: number) => {
          const t = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
          return t * t * (3 - 2 * t);
        };
        let flightPath = new THREE.CatmullRomCurve3();
        const cameraPoint = new THREE.Vector3();
        const lookTarget = new THREE.Vector3();

        const measure = () => {
          if (!renderer || disposed || failed) return;
          const bounds = host.getBoundingClientRect();
          width = Math.max(1, bounds.width);
          height = Math.max(1, bounds.height);
          const aspect = width / height;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 1.25 : 1.5));
          renderer.setSize(width, height, false);
          camera.aspect = aspect;
          camera.updateProjectionMatrix();
          const fitDistance = Math.max(11.4, 7.1 / aspect);
          flightPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.1, 0.42, fitDistance),
            new THREE.Vector3(2.7, 1.15, fitDistance * 0.88),
            new THREE.Vector3(4.1, 1.4, fitDistance * 0.60),
            new THREE.Vector3(1.6, 0.55, 4.2),
            new THREE.Vector3(0.04, 0.035, 1.75),
            new THREE.Vector3(0, 0, -2.15),
            new THREE.Vector3(0, 0, -6.8),
          ], false, "catmullrom", 0.35);
          requestRender();
        };

        const draw = (time: number) => {
          frame = 0;
          if (!renderer || disposed || failed || !visible || document.hidden) { lastTime = 0; return; }
          const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
          lastTime = time;
          if (!reducedMotion.matches) idleTime += delta;
          const state = motion.current;
          const p = reducedMotion.matches ? 0 : THREE.MathUtils.clamp(state.progress, 0, 1);
          const idle = reducedMotion.matches ? 0 : idleTime;
          const pointerWeight = reducedMotion.matches ? 0 : 1 - smooth(0.2, 0.65, p);
          const pointerX = THREE.MathUtils.clamp(state.pointerX, -1, 1) * pointerWeight;
          const pointerY = THREE.MathUtils.clamp(state.pointerY, -1, 1) * pointerWeight;

          rings[0].rotation.set(0.67 + idle * 0.13 + p * 1.9, 0.24 + idle * 0.19 + p * 2.7, -0.26 + p * 0.65);
          rings[1].rotation.set(-1.02 - idle * 0.16 + p * 3.3, -0.42 + idle * 0.22 - p * 1.9, 0.38 + p * 0.7);
          rings[2].rotation.set(0.2 + idle * 0.21 - p * 2.7, -1.04 - idle * 0.15 + p * 2.8, -0.42 - p * 1.2);
          sculpture.rotation.y = pointerX * 0.045;
          sculpture.rotation.x = pointerY * 0.025;

          flightPath.getPoint(p, cameraPoint);
          cameraPoint.x += pointerX * 0.34;
          cameraPoint.y -= pointerY * 0.2;
          camera.position.copy(cameraPoint);
          // The target travels ahead of the camera before it crosses the sculpture.
          // It never flips back to look at a point that has moved behind the lens.
          lookTarget.set(0, 0, -11.5 * smooth(0.35, 0.7, p));
          camera.lookAt(lookTarget);
          // Shift the lens, rather than the canvas, to leave room for the hero title.
          camera.setViewOffset(width, height, 0, height * 0.105 * (1 - smooth(0.18, 0.58, p)), width, height);
          try {
            renderer.render(scene, camera);
          } catch {
            fail();
            return;
          }
          // Context loss can be dispatched during render without throwing.
          if (failed || disposed || cleaned) return;
          canvas.dataset.frame = String(++frameCount);
          if (!firstFrame) {
            firstFrame = true;
            canvas.dataset.rendered = "true";
            readyRef.current?.(true);
          }
          if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
        };

        requestRender = () => {
          if (!frame && !disposed && !failed && visible && !document.hidden) frame = requestAnimationFrame(draw);
        };
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(host);
        intersectionObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) requestRender();
          else cancelFrame();
        }, { rootMargin: "50px", threshold: 0 });
        intersectionObserver.observe(host);
        document.addEventListener("visibilitychange", visibilityChanged);
        reducedMotion.addEventListener("change", motionChanged);
        measure();
      } catch {
        fail();
        clean();
      }
    }).catch(() => {
      if (!disposed) readyRef.current?.(false);
    });

    return () => {
      disposed = true;
      disposeScene?.();
    };
  }, [motion]);

  return <div className="oe-webgl-scene" ref={hostRef} aria-hidden="true" />;
}
