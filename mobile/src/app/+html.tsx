import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const swRegister = `
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function () {
		navigator.serviceWorker.register('/sw.js').catch(function () {});
	});
}
`;

export default function Root({ children }: PropsWithChildren) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
				/>
				<meta name="theme-color" content="#C5E8A4" />
				<meta name="application-name" content="Bot-choy" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Bot-choy" />
				<link rel="manifest" href="/manifest.webmanifest" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
				<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
				<ScrollViewStyleReset />
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: SW registration */}
				<script dangerouslySetInnerHTML={{ __html: swRegister }} />
			</head>
			<body>{children}</body>
		</html>
	);
}
