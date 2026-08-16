import type { Metadata } from "next";
import MoodTracker from "./components/MoodTracker";
import React from 'react';

export const metadata: Metadata = {
  title: "ESI | Diario de Emociones | CrESI",
  description:
    "Aprendé a reconocer tus emociones y llevar un registros de tus estados de ánimo.",
  alternates: {
    canonical: "https://jugar.cresi.com.ar/moodtracker",
  },
};

export default function MoodTrackerPage(): JSX.Element {
  return <MoodTracker />;
}