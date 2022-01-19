const uaIncludes = (str: string) => navigator.userAgent.includes(str);
const addClass = (condition: boolean, className: string) => {
	if (condition) {
		document.documentElement.classList.add(className);
	}
};

const isSamsung = uaIncludes("SamsungBrowser");
const isSafari = uaIncludes("Safari") && !uaIncludes("Chrome");
const isEdgium = uaIncludes("Edg/");
const isLegacyEdge = uaIncludes("Edge/");
const isChromium = uaIncludes("Chrome") && !isLegacyEdge;
const isEdge = isEdgium || isLegacyEdge;

addClass(isChromium, "ua-chromium");
addClass(isSamsung, "ua-samsung");
addClass(isSafari, "ua-safari");
addClass(isEdge, "ua-edge");
addClass(isEdgium, "ua-edgeium");
addClass(isLegacyEdge, "ua-legacy-edge");

export {};
