import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uSpread;
  varying vec2 vUv;

  float Hash(vec2 p) {
    vec3 p2 = vec3(p.xy, 1.0);
    return fract(sin(dot(p2, vec3(37.1, 61.7, 12.4))) * 3758.5453123);
  }

  float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f *= f * (3.0 - 2.0 * f);
    return mix(
      mix(Hash(i + vec2(0.0, 0.0)), Hash(i + vec2(1.0, 0.0)), f.x),
      mix(Hash(i + vec2(0.0, 1.0)), Hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    v += noise(p * 1.0) * 0.5;
    v += noise(p * 2.0) * 0.25;
    v += noise(p * 4.0) * 0.125;
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 centeredUv = uv - 0.5;
    if (aspect > 1.0) {
      centeredUv.x *= aspect;
    } else {
      centeredUv.y /= aspect;
    }
    
    float dissolveEdge = uv.y - uProgress * 1.2;
    float noiseValue = fbm(centeredUv * 15.0);
    float d = dissolveEdge + noiseValue * uSpread;
    
    float pixelSize = 1.0 / uResolution.y;
    float alpha = 1.0 - smoothstep(-pixelSize, pixelSize, d);
    
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const CONFIG = {
  color: '#ffffff',
  spread: 0.5,
  speed: 1,
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.89, g: 0.89, b: 0.89 };
}

const HeroSection = () => {
  const heroRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    
    if (!hero || !canvas) return;

    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      ScrollTrigger.update();
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // 2. Initialize Three.js Scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
    });

    // Detect initial theme and set background color accordingly
    let isDark = document.documentElement.classList.contains('dark');
    const initialColor = isDark ? '#000000' : '#ffffff';
    const rgb = hexToRgb(initialColor);
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(hero.offsetWidth || window.innerWidth, hero.offsetHeight || window.innerHeight),
        },
        uColor: { value: new THREE.Vector3(rgb.r, rgb.g, rgb.b) },
        uSpread: { value: CONFIG.spread },
      },
      transparent: true,
    });

    // Observe theme toggles and transition WebGL shader color smoothly with GSAP
    const observer = new MutationObserver(() => {
      const darkNow = document.documentElement.classList.contains('dark');
      if (darkNow !== isDark) {
        isDark = darkNow;
        const nextColorStr = isDark ? '#000000' : '#ffffff';
        const nextRgb = hexToRgb(nextColorStr);
        
        gsap.to(material.uniforms.uColor.value, {
          x: nextRgb.r,
          y: nextRgb.g,
          z: nextRgb.b,
          duration: 0.5,
          ease: 'power2.out',
        });
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let scrollProgress = 0;
    let animId;

    function resize() {
      if (!hero || !renderer) return;
      const width = hero.offsetWidth || window.innerWidth;
      const height = hero.offsetHeight || window.innerHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      material.uniforms.uResolution.value.set(width, height);
    }

    resize();
    window.addEventListener('resize', resize);

    function animate() {
      material.uniforms.uProgress.value = scrollProgress;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    }
    animate();

    // 3. Lenis scroll listener to drive shader progress relative to page scroll
    const onScroll = ({ scroll }) => {
      const heroHeight = hero.offsetHeight;
      if (heroHeight > 0) {
        scrollProgress = Math.min((scroll / heroHeight) * CONFIG.speed, 1.1);
      }
    };
    lenis.on('scroll', onScroll);

    // Clean up function on component unmount
    return () => {
      // disconnect MutationObserver
      observer.disconnect();

      // cancel animation frames
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(animId);
      
      // destroy Lenis
      lenis.destroy();
      
      // dispose Three.js structures
      window.removeEventListener('resize', resize);
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (renderer) renderer.dispose();
      
      // restore body scroll styling
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div data-anim-index className="index">
      <section className="hero" ref={heroRef}>
        {/* Brand Text Overlay */}
        <div className="hero__top">
          <h1>Sõshka</h1>
          <p>Premium Handpicked Essentials</p>
        </div>

        {/* Parallax backgrounds and WebGL canvas overlay */}
        <div className="hero__row">
          <img className="hero__bg" src="/img/hero.PNG" alt="Hero Background" />
          <canvas ref={canvasRef} className="hero-canvas"></canvas>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
