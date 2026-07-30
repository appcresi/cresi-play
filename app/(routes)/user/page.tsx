
import type { Metadata } from "next";
import UserProfileProps from "./components/UserProfileProps";
import React from "react";

export const metadata: Metadata = {
  title: "ESI | Perfil de Usuario | CrESI",
  description:
    "Consultá tu progreso, puntaje, logros y actividad en CrESI.",
};

export default function UserProfilePage(): JSX.Element {
  return <UserProfileProps />;
}