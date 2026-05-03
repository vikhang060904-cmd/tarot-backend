import { useEffect, useRef } from 'react';
import './Scene.css';

const Scene = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const wizardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize scene animations
    const portal = sceneRef.current?.querySelector('.portal') as HTMLElement;
    if (portal) {
      portal.classList.add('open');
    }
  }, []);

  return (
    <div className="scene" ref={sceneRef} id="scene">
      <div className="stars"></div>
      <div className="fog"></div>

      {/* PORTAL */}
      <div className="portal" id="portal">
        <div className="portal-core"></div>
        <div className="portal-ring"></div>
        <div className="portal-particles"></div>
      </div>

      {/* STAGE */}
      <div className="stage">
        <div className="chair"></div>

        <div className="table" id="table" ref={tableRef}>
          <div className="table-rune"></div>

          {/* DECK */}
          <div className="deck" id="deck">
            <img src="/images/tarot/back.png" alt="Card Deck" />
          </div>

          {/* CARD STAGE */}
          <div className="card-stage" id="cards" ref={cardsRef}></div>
        </div>
      </div>

      {/* WIZARD */}
      <div className="wizard" id="wizard" ref={wizardRef}>
        <img src="/images/wizard.png" className="wizard-img" alt="Wizard" />
        <div className="wizard-hand" id="wizardHand"></div>
        <div className="wizard-magic" id="wizardMagic"></div>
      </div>

      {/* BUBBLE */}
      <div className="bubble" id="wizardBubble"></div>

      {/* AUDIO */}
      <audio id="bgm" src="/audio/bg.mp3" loop></audio>
      <audio id="sfx" src="/audio/magic.mp3"></audio>
    </div>
  );
};

export default Scene;
