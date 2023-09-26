import Script from "next/script";

/**
 * Componente que agrega el código de Google Analytics a la página.
 */
export default function Analytics(): JSX.Element | null {
	const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

	if (typeof GA_TRACKING_ID !== "undefined") {
		return (
			<>
				<Script
					src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
					strategy="afterInteractive"
				/>
				<Script id="google-analytics" strategy="afterInteractive">
					{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', '${GA_TRACKING_ID}');
          `}
				</Script>
			</>
		);
	}

	return null;
}