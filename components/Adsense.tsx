"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/context/AuthContext";

// Pantallas del aula virtual y de las actividades en vivo de una clase: sin
// publicidad. (/escritorio también es aula virtual, pero solo para quien
// tiene clase: eso se decide por el perfil, abajo.)
const NO_ADS_PREFIXES = ["/docente", "/clase", "/vivo", "/nube"];

type AdsbygoogleQueue = unknown[] & { requestNonPersonalizedAds?: number };

/**
 * Código de Google AdSense (anuncios automáticos). Solo se monta si se
 * aceptaron las cookies (ver CookieConsent).
 *
 * El público es casi todo menor de 18, así que:
 * - siempre se piden anuncios NO personalizados (`requestNonPersonalizedAds`,
 *   que según la ayuda de AdSense vale para todos los anuncios de la página,
 *   incluidos los automáticos, y tiene que estar antes de cargar el script);
 * - se marca el tratamiento para adolescentes (`data-tag-for-age-treatment="2"`,
 *   documentado para bloques de anuncios; en los automáticos no está
 *   confirmado, por eso no es la única medida);
 * - no se cargan en el aula virtual: ni para docentes ni para alumnos con clase.
 *
 * Límite: si alguien entra primero a una página con anuncios y después pasa al
 * aula sin recargar, el script ya está cargado. Para cubrirlo, esas rutas
 * también se excluyen desde AdSense (Anuncios → Por sitio → Exclusiones de página).
 */
export default function Adsense(): JSX.Element | null {
	const GA_ADSENSE_KEY = process.env.NEXT_PUBLIC_GA_ADSENSE_KEY;
	const pathname = usePathname();
	const { profile, loading } = useAuth();
	const [configured, setConfigured] = useState(false);

	useEffect(() => {
		const w = window as unknown as { adsbygoogle?: AdsbygoogleQueue };
		w.adsbygoogle = w.adsbygoogle || [];
		w.adsbygoogle.requestNonPersonalizedAds = 1;
		setConfigured(true);
	}, []);

	const inClassroom =
		profile?.profile?.role === "teacher" || !!profile?.profile?.classroomId;
	const classroomRoute = NO_ADS_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

	if (typeof GA_ADSENSE_KEY === "undefined" || !configured || loading || inClassroom || classroomRoute) {
		return null;
	}

	return (
		<Script
			src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${GA_ADSENSE_KEY}`}
			crossOrigin="anonymous"
			strategy="afterInteractive"
			data-tag-for-age-treatment="2"
		/>
	);
}
