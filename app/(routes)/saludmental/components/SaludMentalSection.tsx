"use client";

import { useEffect, useState } from "react";
import GameStatusBar from '@/components/GameStatusBar';
import Test from "./Test";
import UserDataManager from '@/lib/userDataManager';

export default function SaludMentalSection(): JSX.Element {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
  }, []);

  return (
    <>
      <GameStatusBar title="Test de Salud Mental" score={score} lives={lives} level={1} />
      <Test onCompleted={(updatedScore) => setScore(updatedScore)} />
    </>
  );
}