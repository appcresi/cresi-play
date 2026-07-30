import type { Metadata } from "next";
import ChatSimulator from "./components/ChatSimulator";
import React from 'react';

export const metadata: Metadata = {
  title: "ESI | Simulador Grooming | CrESI",
  description:
    "Practicá cómo reaccionar ante mensajes sospechosos y aprendé a cuidarte en las redes sociales.",
};

export default function SimuladorPage(): JSX.Element {
  return <ChatSimulator />;
}