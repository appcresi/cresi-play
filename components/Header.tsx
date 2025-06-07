"use client";

import { Popover, Transition } from "@headlessui/react";
import {
  IconApps,
  IconArrowNarrowRight,
  IconCards,
  IconChevronDown,
  IconUser,
  IconAB2,
  IconHome,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodPuzzled,
  IconMoodTongueWink2,
  IconBooks
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { Fragment, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import cresiLogo from "public/cresi-logo.webp";

interface NavigationLink {
  name: string;
  href: string;
}

export default function Header(): JSX.Element {
  const pathname = usePathname();
  const [currentSection, setCurrentSection] = useState<string>("CrESI");
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  useEffect(() => {
    // Encuentra la aplicación correspondiente a la ruta actual
    const currentApp = applications.find(app => 
      pathname === app.href || pathname.startsWith(`${app.href}/`)
    );
    
    // Si encuentra una aplicación, establece su nombre como la sección actual
    if (currentApp) {
      setCurrentSection(currentApp.name);
    } else {
      setCurrentSection("CrESI"); // Valor por defecto
    }
  }, [pathname]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMouseNearTop = false;

    const handleMouseMove = (e: MouseEvent) => {
      const mouseY = e.clientY;
      const threshold = 50; // Pixels desde el borde superior
      
      // Si el mouse está cerca del borde superior o el popover está abierto
      if (mouseY <= threshold || isPopoverOpen) {
        isMouseNearTop = true;
        setIsVisible(true);
        // Limpiar el timeout si existe
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } else {
        isMouseNearTop = false;
        // Solo ocultar si el popover no está abierto
        if (!isPopoverOpen) {
          // Esperar un poco antes de ocultar para evitar parpadeos
          timeoutId = setTimeout(() => {
            if (!isMouseNearTop && !isPopoverOpen) {
              setIsVisible(false);
            }
          }, 1000); // 1 segundo de delay
        }
      }
    };

    // Agregar listener para el movimiento del mouse
    document.addEventListener('mousemove', handleMouseMove);

    // Mostrar el header inicialmente y ocultarlo después de 3 segundos
    const initialTimeout = setTimeout(() => {
      if (!isMouseNearTop && !isPopoverOpen) {
        setIsVisible(false);
      }
    }, 3000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isPopoverOpen]);

  // SOLUCIÓN: Agregar padding-top dinámico al body cuando el header es visible
  useEffect(() => {
    const headerHeight = 80; // Altura aproximada del header (ajusta según sea necesario)
    
    // Agregar padding-top al body cuando el header es visible
    if (isVisible) {
      document.body.style.paddingTop = `${headerHeight}px`;
      document.body.style.transition = 'padding-top 0.3s ease-in-out';
    } else {
      document.body.style.paddingTop = '0px';
    }

    // Cleanup: restaurar el padding cuando el componente se desmonte
    return () => {
      document.body.style.paddingTop = '0px';
    };
  }, [isVisible]);

  return (
    <header className={`
      py-2 px-8 w-full fixed top-0 z-50 
      bg-white border-b-4 border-black
      transform transition-transform duration-300 ease-in-out
      ${isVisible ? 'translate-y-0' : '-translate-y-full'}
    `}>
      <nav className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/" className="transform hover:scale-110 transition-transform">
            <Image
              src={cresiLogo}
              alt="Logotipo de CrESI"
              width={64}
              className="relative top-[0.25rem]"
            />
          </Link>
          
          {/* Título de la sección actual */}
          <h1 className="hidden md:block text-2xl font-black"
                style={{
                  textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                }}>
                <span className="text-[#4ADE80]">{currentSection}</span>
            </h1>
        </div>
        
        <span className="flex items-center">
          <ApplicationsPopover 
            onOpenChange={setIsPopoverOpen}
          />
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
  { name: "Meme Creator", href: "/memegenerador", icon: <IconMoodTongueWink2 />, isExternal: false },
  { name: "Literatura", href: "/literatura", icon: <IconBooks />, isExternal: false }
];

interface ApplicationsPopoverProps {
  onOpenChange: (isOpen: boolean) => void;
}

function ApplicationsPopover({ onOpenChange }: ApplicationsPopoverProps): JSX.Element {
  return (
    <Popover className="relative">
      {({ open, close }) => {
        // Notificar cambios en el estado del popover
        useEffect(() => {
          onOpenChange(open);
        }, [open, onOpenChange]);

        return (
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
              <span className="flex items-center gap-1">
                <span className="hidden md:inline">Aplicaciones</span>
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
        );
      }}
    </Popover>
  );
}