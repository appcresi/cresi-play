"use client";

import { Popover, Transition } from "@headlessui/react";
import {
  IconApps,
  IconArrowNarrowRight,
  IconCards,
  IconChalkboard,
  IconChevronDown,
  IconMenu2,
  IconX,
  IconUser,
  IconAB2,
  IconHome,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodPuzzled,
  IconMoodTongueWink2
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { Fragment } from "react";

import cresiLogo from "public/cresi-logo.webp";

interface NavigationLink {
  name: string;
  href: string;
}

export default function Header(): JSX.Element {
  return (
    <header className="py-2 px-8 w-full fixed top-0 z-50 bg-white border-b-4 border-black">
      <nav className="flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="transform hover:scale-110 transition-transform">
          <Image
            src={cresiLogo}
            alt="Logotipo de CrESI"
            width={64}
            className="relative top-[0.25rem]"
          />
        </Link>
        <span className="hidden lg:flex lg:gap-6 lg:items-center">
          <ApplicationsPopover />
        </span>
      </nav>
    </header>
  );
}

interface Application extends NavigationLink {
  icon: JSX.Element;
  isExternal: boolean;
}

const applications: Application[] = [
  { name: "Inicio", href: "/", icon: <IconHome />, isExternal: false },
  { name: "Perfil", href: "/user", icon: <IconUser />, isExternal: false },
  { name: "Trivias", href: "/trivias", icon: <IconCards />, isExternal: false },
  { name: "Pasapalabras", href: "/pasapalabras", icon: <IconAB2 />, isExternal: false },
  { name: "Simulador Grooming", href: "/simulador", icon: <IconShieldCheck />, isExternal: false },
  { name: "Completa Palabras", href: "/completapalabras", icon: <IconBrandPnpm />, isExternal: false },
  { name: "DataMuncher", href: "/datamuncher", icon: <IconPacman />, isExternal: false },
  { name: "MoodTracker", href: "/moodtracker", icon: <IconMoodPuzzled />, isExternal: false },
  { name: "Meme Creator", href: "/memegenerador", icon: <IconMoodTongueWink2 />, isExternal: false }
];

function ApplicationsPopover(): JSX.Element {
  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <Popover.Button className={`
            flex gap-2 items-center
            px-4 py-2
            font-bold text-white
            bg-blue-500
            border-4 border-black
            rounded-lg
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            transform transition-all duration-200
            hover:translate-x-1 hover:translate-y-1
            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            focus:outline-none
            focus:translate-x-1 focus:translate-y-1
            focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            ${open ? 'translate-x-1 translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
          `}>
            <IconApps className="w-5 h-5" />
            <span className="hidden md:flex items-center gap-1">
              Aplicaciones
              <IconChevronDown className={`
                w-4 h-4
                transition-transform duration-200
                ${open ? 'rotate-180' : ''}
              `} />
            </span>
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition duration-200 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-150 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Popover.Panel className={`
              absolute z-10 
              right-0 top-12
              min-w-[20em]
              p-4
              bg-white
              border-4 border-black
              rounded-lg
              shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
              before:content-['']
              before:absolute before:w-4 before:h-4 
              before:bg-white before:border-l-4 before:border-t-4
              before:border-black before:rotate-45 before:-top-2 
              before:right-8 before:z-0
            `}>
              <div className="flex flex-col gap-2">
                {applications.map((application) => (
                  <Popover.Button
                    key={application.name}
                    as={application.isExternal ? 'a' : Link}
                    href={application.href}
                    target={application.isExternal ? '_blank' : undefined}
                    rel={application.isExternal ? 'noreferrer' : undefined}
                    className={`
                      p-3
                      flex gap-2 items-center
                      bg-gray-100
                      border-2 border-black
                      rounded-lg
                      transform transition-all duration-200
                      hover:bg-yellow-100
                      hover:translate-x-1
                      hover:-rotate-1
                    `}
                    onClick={() => close()}
                  >
                    <span className="text-blue-500">{application.icon}</span>
                    <p className="font-medium">{application.name}</p>
                    <IconArrowNarrowRight className="ml-auto min-w-[1em] w-[1em] text-red-500" />
                  </Popover.Button>
                ))}
              </div>

              {/* Elemento decorativo */}
              <div className="absolute -top-4 -right-4 bg-red-500 rounded-full p-2 border-4 border-black transform rotate-12">
                <span className="text-white text-xs font-bold">¡CLICK!</span>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}