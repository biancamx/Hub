"use client";

import { useEffect, useRef, useState } from "react";
import "./SystemCarousel.css";

interface SystemItem {
  _id?: string;
  id?: number;
  title: string;
  description: string;
  image?: string;
  imageUrl?: string;
  url: string;
}

function CarouselDotButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? "active" : ""}
      onClick={onClick}
      aria-label={label}
    />
  );
}

export default function SystemCarousel() {
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const CARD_WIDTH = 280;
  const CARD_GAP = 20;
  const CARD_STEP = CARD_WIDTH + CARD_GAP;

  const startX = useRef(0);
  const dragging = useRef(false);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cards");
      const result = await res.json();

      if (result.success) {
        setSystems(result.data || []);
        setError("");
      } else {
        setError("Falha ao carregar os sistemas.");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    if (systems.length > 0 && activeIndex >= systems.length) {
      setActiveIndex(0);
    }
  }, [systems.length, activeIndex]);

  const next = () => {
    if (!systems.length) return;
    setActiveIndex((prev) =>
      prev === systems.length - 1 ? 0 : prev + 1
    );
  };

  const previous = () => {
    if (!systems.length) return;
    setActiveIndex((prev) =>
      prev === 0 ? systems.length - 1 : prev - 1
    );
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    dragging.current = true;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging.current || !systems.length) return;

    const distance = e.clientX - startX.current;

    dragging.current = false;

    if (Math.abs(distance) < 40) return;

    if (distance < 0) {
      next();
    } else {
      previous();
    }
  };

  const handlePointerCancel = () => {
    dragging.current = false;
  };

  const getSystemImage = (system: SystemItem) => {
    return system.imageUrl || system.image || "/images/portal-corporativo.png";
  };

  if (loading) {
    return (
      <section className="system-carousel empty-state">
        <div className="carousel-header">
          <h1>Meus Sistemas</h1>
        </div>
        <div className="system-empty-box">
          <p>Carregando sistemas...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="system-carousel empty-state">
        <div className="carousel-header">
          <h1>Meus Sistemas</h1>
        </div>
        <div className="system-empty-box error-box">
          <p>{error}</p>
          <button onClick={fetchCards}>Tentar novamente</button>
        </div>
      </section>
    );
  }

  if (!systems.length) {
    return (
      <section className="system-carousel empty-state">
        <div className="carousel-header">
          <h1>Meus Sistemas</h1>
        </div>
        <div className="system-empty-box">
          <p>Nenhum sistema cadastrado.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="system-carousel">
      <div className="carousel-header">
        <h1>Meus Sistemas</h1>

        <p>
          Selecione abaixo o sistema que deseja acessar.
        </p>
      </div>

      <div
        className="carousel-window"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          className="carousel-track"
          style={{
            transform: `translateX(calc(50% - ${
              activeIndex * CARD_STEP + CARD_WIDTH / 2
            }px))`,
          }}
        >
          {systems.map((system, index) => {
            const isActive = index === activeIndex;
            const systemId = system._id || system.id || index + 1;
            const systemImage = getSystemImage(system);

            return (
              <article
                key={String(systemId)}
                className={`system-card ${isActive ? "active" : ""}`}
                onClick={() => setActiveIndex(index)}
              >
                <div className="card-image">
                  <img
                    src={systemImage}
                    alt={system.title}
                    draggable={false}
                  />
                </div>

                <div className="card-content">
                  <div className="card-top">
                    {isActive && <span className="active-label">ATIVO</span>}
                  </div>

                  <h2>{system.title}</h2>

                  <p>{system.description}</p>

                  {isActive && (
                    <a
                      href={system.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="access-button"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Acessar Sistema
                      <span>↗</span>
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="carousel-dots">
        {systems.map((system, index) => (
          <CarouselDotButton
            key={String(system._id || system.id || index + 1)}
            active={index === activeIndex}
            label={`Selecionar ${system.title}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
