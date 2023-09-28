import Script from "next/script";

/**
 * Componente que agrega el código de Google AdSense a la página.
 */
export default function Adsense(): JSX.Element | null {
	const GA_ADSENSE_KEY = process.env.NEXT_PUBLIC_GA_ADSENSE_KEY;

	if (typeof GA_ADSENSE_KEY !== "undefined") {
		return (
			<Script
				src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${GA_ADSENSE_KEY}`}
				crossOrigin="anonymous"
				strategy="afterInteractive"
			/>
		);
	}

	return null;
}